import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import Product
from apps.sellers.models import SellerProfile


class Order(models.Model):
    """The buyer-facing payment record for one checkout. A cart can hold
    items from multiple sellers, so the actual fulfillment work is split
    per-seller into SellerOrder below - this is what ties them together
    and what the buyer sees as "their order"."""

    class PaymentMethod(models.TextChoices):
        ESEWA = "esewa", "eSewa"
        KHALTI = "khalti", "Khalti"
        COD = "cod", "Cash on delivery"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    order_number = models.CharField(max_length=20, unique=True, editable=False)
    # PROTECT - orders are financial/history records that must outlive the
    # buyer account; account deletion flows should anonymize, not cascade here.
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")

    # Shipping snapshot - copied from the buyer's chosen address at checkout
    # time so order history stays accurate even if that address is later
    # edited or deleted.
    shipping_full_name = models.CharField(max_length=100)
    shipping_phone = models.CharField(max_length=15)
    shipping_address_line = models.CharField(max_length=255)
    shipping_city = models.CharField(max_length=100)
    shipping_district = models.CharField(max_length=100)
    shipping_province = models.CharField(max_length=100)

    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices)
    payment_status = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"AB-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)


class SellerOrder(models.Model):
    """One seller's slice of an Order - what that seller needs to pack,
    ship, and get paid out for."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="seller_orders")
    seller = models.ForeignKey(SellerProfile, on_delete=models.PROTECT, related_name="seller_orders")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    # Snapshot of the seller's commission rate at sale time - preserved even
    # if their rate changes later, so past payouts stay reconstructable.
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    tracking_number = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order.order_number} / {self.seller.store_name}"


class OrderItem(models.Model):
    seller_order = models.ForeignKey(SellerOrder, on_delete=models.CASCADE, related_name="items")
    # SET_NULL - a product can be deleted later without destroying order
    # history; product_name/unit_price below preserve what was actually
    # bought and at what price, independent of the live Product row.
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="order_items")
    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity

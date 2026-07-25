from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.catalog.models import Product
from apps.orders.models import OrderItem


class Review(models.Model):
    """Reviews require a verified purchase (order_item) rather than being
    freeform - matches the trust-first positioning (eSewa/Khalti/COD trust
    row, "why AaganBazaar" section) and keeps reviews from being gamed."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    order_item = models.OneToOneField(OrderItem, on_delete=models.CASCADE, related_name="review")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ {self.product.name} by {self.buyer.email}"


class ReviewImage(models.Model):
    MAX_PER_REVIEW = 2

    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="reviews/")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for review #{self.review_id}"

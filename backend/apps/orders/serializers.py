from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem, SellerOrder


class OrderItemSerializer(serializers.ModelSerializer):
    # Explicit DecimalField - line_total is a model @property, not a DB
    # field, so ModelSerializer would otherwise auto-build a plain
    # ReadOnlyField for it and render it as an imprecise JSON float
    # instead of a decimal string (same fix as CartItemSerializer).
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_name", "unit_price", "quantity", "line_total")
        read_only_fields = fields


class SellerOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    commission_amount = serializers.SerializerMethodField()
    net_earnings = serializers.SerializerMethodField()

    class Meta:
        model = SellerOrder
        fields = (
            "id",
            "order_number",
            "seller",
            "seller_name",
            "status",
            "subtotal",
            "commission_rate",
            "commission_amount",
            "net_earnings",
            "tracking_number",
            "items",
            "created_at",
        )
        read_only_fields = (
            "id",
            "order_number",
            "seller",
            "seller_name",
            "subtotal",
            "commission_rate",
            "commission_amount",
            "net_earnings",
            "items",
            "created_at",
        )

    def get_commission_amount(self, obj):
        return (obj.subtotal * obj.commission_rate / Decimal("100")).quantize(Decimal("0.01"))

    def get_net_earnings(self, obj):
        return obj.subtotal - self.get_commission_amount(obj)


class SellerOrderUpdateSerializer(serializers.ModelSerializer):
    """Restricted to what a seller may actually change - forward-only
    status transitions. DELIVERED -> REFUNDED is the one exception to
    "forward-only": it's how a seller records a return/refund handled
    outside the platform (no online payment gateway integration yet)."""

    class Meta:
        model = SellerOrder
        fields = ("status", "tracking_number")

    _ALLOWED_TRANSITIONS = {
        SellerOrder.Status.PENDING: {SellerOrder.Status.CONFIRMED, SellerOrder.Status.CANCELLED},
        SellerOrder.Status.CONFIRMED: {SellerOrder.Status.SHIPPED, SellerOrder.Status.CANCELLED},
        SellerOrder.Status.SHIPPED: {SellerOrder.Status.DELIVERED},
        SellerOrder.Status.DELIVERED: {SellerOrder.Status.REFUNDED},
    }

    def validate_status(self, value):
        current = self.instance.status
        if value != current and value not in self._ALLOWED_TRANSITIONS.get(current, set()):
            raise serializers.ValidationError(f"Cannot move status from '{current}' to '{value}'.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    seller_orders = SellerOrderSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "shipping_full_name",
            "shipping_phone",
            "shipping_address_line",
            "shipping_city",
            "shipping_district",
            "shipping_province",
            "payment_method",
            "payment_status",
            "total_amount",
            "seller_orders",
            "created_at",
        )
        read_only_fields = fields


class CheckoutSerializer(serializers.Serializer):
    shipping_full_name = serializers.CharField(max_length=100)
    shipping_phone = serializers.CharField(max_length=15)
    shipping_address_line = serializers.CharField(max_length=255)
    shipping_city = serializers.CharField(max_length=100)
    shipping_district = serializers.CharField(max_length=100)
    shipping_province = serializers.CharField(max_length=100)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)

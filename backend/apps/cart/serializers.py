from decimal import Decimal

from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    unit_price = serializers.DecimalField(
        source="product.effective_price", max_digits=10, decimal_places=2, read_only=True
    )
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product", "product_name", "product_slug", "unit_price", "quantity", "line_total")
        extra_kwargs = {"product": {"write_only": True}}

    def validate_product(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This product is not available.")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "items", "total", "updated_at")

    def get_total(self, obj):
        # str(), not the raw Decimal - DRF's JSON encoder renders a bare
        # Decimal as a float, which is exactly the precision loss money
        # fields need to avoid. DecimalField elsewhere in this codebase
        # is serialized as a string for the same reason.
        total = sum((item.line_total for item in obj.items.all()), Decimal("0.00"))
        return str(total)

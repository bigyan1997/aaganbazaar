from rest_framework import serializers

from apps.catalog.serializers import ProductListSerializer

from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ("id", "product", "product_detail", "created_at")
        extra_kwargs = {"product": {"write_only": True}}

    def validate_product(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This product is not available.")
        return value

from rest_framework import serializers

from apps.orders.models import SellerOrder

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.first_name", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "product", "buyer_name", "order_item", "rating", "comment", "created_at")
        read_only_fields = ("id", "product", "buyer_name", "created_at")
        extra_kwargs = {"order_item": {"write_only": True}}

    def validate_order_item(self, value):
        # Duplicate-review rejection isn't checked here - the OneToOneField
        # on order_item already gets DRF's auto-generated UniqueValidator,
        # which runs before this method and catches it first.
        request = self.context["request"]
        if value.seller_order.order.buyer_id != request.user.id:
            raise serializers.ValidationError("This isn't your order item.")
        if value.seller_order.status != SellerOrder.Status.DELIVERED:
            raise serializers.ValidationError("You can only review delivered items.")
        return value

    def create(self, validated_data):
        order_item = validated_data["order_item"]
        validated_data["product"] = order_item.product
        validated_data["buyer"] = self.context["request"].user
        return super().create(validated_data)

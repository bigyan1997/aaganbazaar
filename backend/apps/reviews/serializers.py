from rest_framework import serializers

from apps.orders.models import SellerOrder

from .models import Review, ReviewImage


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ("id", "image")


class ReviewSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.first_name", read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = ("id", "product", "buyer_name", "order_item", "rating", "comment", "images", "created_at")
        read_only_fields = ("id", "product", "buyer_name", "images", "created_at")
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


class MyReviewSerializer(serializers.ModelSerializer):
    """GET /api/reviews/ (own reviews) - unlike ReviewSerializer (used on
    product pages, where the product is already known from context), this
    lists reviews across many products, so it nests enough of the product
    to link back to it."""

    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = serializers.SerializerMethodField()
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "product_name",
            "product_slug",
            "product_image",
            "rating",
            "comment",
            "images",
            "created_at",
        )
        read_only_fields = fields

    def get_product_image(self, obj):
        img = next((i for i in obj.product.images.all() if i.is_primary), None) or next(
            iter(obj.product.images.all()), None
        )
        if not img:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(img.image.url) if request else img.image.url

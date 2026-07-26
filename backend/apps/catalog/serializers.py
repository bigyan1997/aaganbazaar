from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "image", "parent", "display_order")


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary", "display_order")


class ProductListSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()
    # Populated by an annotated queryset (Avg/Count over reviews) in the
    # view - never computed per-object here, that would be an N+1 query
    # on every product list page.
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    sale_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "discount_percent",
            "sale_price",
            "stock_quantity",
            "in_stock",
            "category",
            "category_name",
            "seller_name",
            "primary_image",
            "average_rating",
            "review_count",
            "is_active",
        )

    def get_primary_image(self, obj):
        img = next((i for i in obj.images.all() if i.is_primary), None) or next(iter(obj.images.all()), None)
        if not img:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(img.image.url) if request else img.image.url


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(source="seller.store_name", read_only=True)
    seller_slug = serializers.CharField(source="seller.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    sale_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "discount_percent",
            "sale_price",
            "stock_quantity",
            "in_stock",
            "category",
            "category_name",
            "seller_name",
            "seller_slug",
            "images",
            "average_rating",
            "review_count",
            "is_active",
            "created_at",
        )
        read_only_fields = ("slug", "created_at")


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        # slug is read-only here (server-generated) but still returned -
        # a client creating a product needs it immediately to link to the
        # new product's page without an extra GET.
        fields = (
            "id",
            "category",
            "name",
            "description",
            "price",
            "stock_quantity",
            "discount_percent",
            "is_active",
            "slug",
        )
        read_only_fields = ("slug",)

    def validate_category(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This category is not active.")
        return value

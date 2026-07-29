from rest_framework import serializers

from .models import SellerProfile


class SellerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ("id", "store_name", "slug", "description", "contact_phone", "status", "created_at")
        read_only_fields = ("id", "slug", "status", "created_at")


class SellerPublicSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    # Populated via queryset annotation on SellerListView; falls back to None
    # (not 0) on views that don't annotate it, like the detail view, so the
    # frontend can tell "no reviews yet" apart from "actually rated zero".
    average_rating = serializers.FloatField(read_only=True, default=None)

    class Meta:
        model = SellerProfile
        fields = (
            "id",
            "store_name",
            "slug",
            "description",
            "logo",
            "created_at",
            "product_count",
            "average_rating",
        )
        read_only_fields = fields

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

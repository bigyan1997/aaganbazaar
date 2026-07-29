from rest_framework import serializers

from .models import SellerProfile


class SellerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ("id", "store_name", "slug", "description", "contact_phone", "status", "created_at")
        read_only_fields = ("id", "slug", "status", "created_at")


class SellerPublicSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = SellerProfile
        fields = ("id", "store_name", "slug", "description", "created_at", "product_count")
        read_only_fields = fields

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()

from rest_framework import serializers

from .models import SellerProfile


class SellerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ("id", "store_name", "slug", "description", "contact_phone", "status", "created_at")
        read_only_fields = ("id", "slug", "status", "created_at")


class SellerPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ("id", "store_name", "slug", "description", "created_at")
        read_only_fields = fields

from django.contrib import admin

from .models import SellerProfile


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("store_name", "user", "status", "commission_rate", "created_at")
    list_filter = ("status",)
    search_fields = ("store_name", "user__email")
    prepopulated_fields = {"slug": ("store_name",)}

from django.contrib import admin

from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("id", "link_url", "display_order", "is_active", "created_at")
    list_filter = ("is_active",)
    list_editable = ("display_order", "is_active")

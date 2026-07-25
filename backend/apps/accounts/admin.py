from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "role", "is_email_verified", "is_active", "created_at")
    list_filter = ("role", "is_active", "is_email_verified")
    ordering = ("-created_at",)
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Marketplace role", {"fields": ("role", "phone_number", "is_phone_verified", "is_email_verified")}),
    )

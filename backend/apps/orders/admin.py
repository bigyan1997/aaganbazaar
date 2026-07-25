from django.contrib import admin

from .models import Order, OrderItem, SellerOrder


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(SellerOrder)
class SellerOrderAdmin(admin.ModelAdmin):
    list_display = ("order", "seller", "status", "subtotal", "created_at")
    list_filter = ("status",)
    search_fields = ("order__order_number", "seller__store_name")
    inlines = [OrderItemInline]


class SellerOrderInline(admin.TabularInline):
    model = SellerOrder
    extra = 0
    show_change_link = True


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "buyer", "payment_method", "payment_status", "total_amount", "created_at")
    list_filter = ("payment_method", "payment_status")
    search_fields = ("order_number", "buyer__email")
    inlines = [SellerOrderInline]

from django.contrib import admin

from .models import Review, ReviewImage


class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 0


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "buyer", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("product__name", "buyer__email")
    inlines = [ReviewImageInline]

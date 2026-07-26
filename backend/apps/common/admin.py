from django import forms
from django.contrib import admin

from apps.catalog.models import Category

from .models import Banner


class BannerAdminForm(forms.ModelForm):
    # Not a model field - purely a convenience picker whose JS (see
    # BannerAdmin.Media) writes "/deals/<slug>" into link_url on change,
    # so an admin doesn't have to know or type a category's slug by hand.
    deals_category = forms.ChoiceField(
        required=False,
        label="Quick-fill: link to a category's deals page",
        help_text="Picking a category fills in the link above for you - it isn't saved itself.",
    )

    class Meta:
        model = Banner
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        categories = Category.objects.filter(is_active=True).order_by("name")
        self.fields["deals_category"].choices = [("", "---------")] + [
            (c.slug, c.name) for c in categories
        ]


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    form = BannerAdminForm
    fields = ("image", "link_url", "deals_category", "display_order", "is_active")
    list_display = ("id", "link_url", "display_order", "is_active", "created_at")
    list_filter = ("is_active",)
    list_editable = ("display_order", "is_active")

    class Media:
        js = ("common/banner_admin.js",)

from django.conf import settings
from django.db import models

from apps.common.utils import unique_slug_for


class SellerProfile(models.Model):
    """Created when a buyer applies to sell. Approving it (status ->
    approved) is a separate, deliberate admin action - see the Role
    docstring on accounts.User for why selling isn't a signup checkbox."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SUSPENDED = "suspended", "Suspended"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seller_profile"
    )
    store_name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    description = models.TextField(blank=True)
    contact_phone = models.CharField(max_length=15, blank=True)
    logo = models.ImageField(upload_to="seller-logos/", blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    # Per-seller override of settings.DEFAULT_COMMISSION_RATE. Null = use the platform default.
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.store_name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slug_for(SellerProfile, self.store_name)
        super().save(*args, **kwargs)

    @property
    def effective_commission_rate(self):
        return self.commission_rate if self.commission_rate is not None else settings.DEFAULT_COMMISSION_RATE

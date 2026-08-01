from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model. Email is the login identifier instead of username -
    matches how Nepali shoppers/sellers actually think of their account.

    role controls what a user can do at the permission-class level
    (see apps/accounts/permissions.py once we build it in Phase 2).
    A single user can only be one role at a time by design - if someone
    wants to sell, they apply for seller status, which is a deliberate
    verified action, not a checkbox at signup.
    """

    class Role(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"
        ADMIN = "admin", "Admin"

    class AuthProvider(models.TextChoices):
        EMAIL = "email", "Email"
        GOOGLE = "google", "Google"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    phone_number = models.CharField(max_length=15, blank=True)
    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    # Set once at account creation and never changed afterward - reflects
    # how the account originated, not whether Google has ever been used
    # to log in since (an email/password account stays "email" even if
    # the same address later signs in with Google too).
    auth_provider = models.CharField(max_length=10, choices=AuthProvider.choices, default=AuthProvider.EMAIL)
    avatar_url = models.URLField(blank=True)
    # Gates buyer-facing order-status emails (e.g. refund notices) - not
    # account/security mail like verification or password reset, which
    # always sends regardless of this preference.
    email_order_updates = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


class Address(models.Model):
    """A buyer's saved shipping address. Checkout still snapshots flat
    shipping_* fields onto orders.Order rather than FK'ing here, so order
    history stays accurate even if this address is later edited or deleted."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses")
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.full_name} - {self.city}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_default:
            Address.objects.filter(user_id=self.user_id).exclude(pk=self.pk).update(is_default=False)

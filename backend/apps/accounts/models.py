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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email

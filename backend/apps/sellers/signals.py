from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import SellerProfile


@receiver(post_save, sender=SellerProfile)
def sync_user_role(sender, instance, **kwargs):
    """Keeps accounts.User.role in sync with SellerProfile.status, no
    matter whether the status change happens via admin, shell, or API -
    role gates permission classes throughout the app, so it can't be
    allowed to drift from the seller profile's actual approval state."""
    from apps.accounts.models import User

    user = instance.user
    if instance.status == SellerProfile.Status.APPROVED and user.role != User.Role.SELLER:
        user.role = User.Role.SELLER
        user.save(update_fields=["role"])
    elif (
        instance.status in (SellerProfile.Status.REJECTED, SellerProfile.Status.SUSPENDED)
        and user.role == User.Role.SELLER
    ):
        user.role = User.Role.BUYER
        user.save(update_fields=["role"])

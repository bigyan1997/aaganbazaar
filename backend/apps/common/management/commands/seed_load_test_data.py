"""
Seeds a fixed set of approved sellers + products for locustfile.py to hit.
Not for production use - only ever run against a local/throwaway database.
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.catalog.models import Category, Product
from apps.sellers.models import SellerProfile

User = get_user_model()

LOAD_TEST_SELLER_EMAIL = "loadtest-seller@aaganbazaar.local"
LOAD_TEST_SELLER_PASSWORD = "LoadTestSeller1234"
PRODUCT_COUNT = 40


class Command(BaseCommand):
    help = "Seed approved seller + product catalog data for load testing (locustfile.py)."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            email=LOAD_TEST_SELLER_EMAIL, defaults={"username": "loadtest-seller"}
        )
        if created:
            user.set_password(LOAD_TEST_SELLER_PASSWORD)
            user.save()

        seller, _ = SellerProfile.objects.get_or_create(
            user=user, defaults={"store_name": "Load Test Store", "status": SellerProfile.Status.APPROVED}
        )
        if seller.status != SellerProfile.Status.APPROVED:
            seller.status = SellerProfile.Status.APPROVED
            seller.save()

        category = Category.objects.filter(is_active=True).first()
        if category is None:
            category = Category.objects.create(name="Load Test Category")

        existing = Product.objects.filter(seller=seller).count()
        for i in range(existing, PRODUCT_COUNT):
            Product.objects.create(
                seller=seller,
                category=category,
                name=f"Load Test Product {i}",
                price=Decimal("100.00") + i,
                stock_quantity=1000,  # high on purpose - load test isn't exercising the stock race path
            )

        self.stdout.write(self.style.SUCCESS(
            f"Seller ready: {LOAD_TEST_SELLER_EMAIL} / {LOAD_TEST_SELLER_PASSWORD}\n"
            f"Products: {Product.objects.filter(seller=seller).count()}"
        ))

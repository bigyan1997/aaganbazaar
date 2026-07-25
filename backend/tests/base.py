"""
Shared test utilities, fixtures, and base class for the AaganBazaar API test suite.
"""
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.cart.models import Cart, CartItem
from apps.catalog.models import Category, Product
from apps.orders.models import Order, OrderItem, SellerOrder
from apps.sellers.models import SellerProfile

User = get_user_model()

# ─── Test-safe settings overrides ────────────────────────────────────────────
# DummyCache = no-op, so throttles never fire in tests unless a test
# deliberately overrides CACHES again (see TestRateLimiting in test_security.py).

TEST_SETTINGS = {
    "CACHES": {
        "default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"},
    },
    # Empty key -> emails.py takes its console-print fallback path instead of
    # making real calls to the Resend API during test runs.
    "RESEND_API_KEY": "",
    # PBKDF2 is deliberately slow (that's the point, in production). Tests
    # hash dozens of passwords per run and don't need that cost.
    "PASSWORD_HASHERS": ["django.contrib.auth.hashers.MD5PasswordHasher"],
    "REST_FRAMEWORK": {
        "DEFAULT_AUTHENTICATION_CLASSES": ("apps.accounts.authentication.CookieJWTAuthentication",),
        "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
        "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.StandardPagination",
        "PAGE_SIZE": 20,
        "DEFAULT_THROTTLE_CLASSES": (
            "rest_framework.throttling.AnonRateThrottle",
            "rest_framework.throttling.UserRateThrottle",
            "rest_framework.throttling.ScopedRateThrottle",
        ),
        "DEFAULT_THROTTLE_RATES": {
            "anon": "100000/day",
            "user": "100000/day",
            "login": "100000/day",
            "register": "100000/day",
            "password_reset": "100000/day",
        },
        "DEFAULT_FILTER_BACKENDS": (
            "django_filters.rest_framework.DjangoFilterBackend",
            "rest_framework.filters.SearchFilter",
            "rest_framework.filters.OrderingFilter",
        ),
    },
}


@override_settings(**TEST_SETTINGS)
class BaseAPITest(APITestCase):
    """Base class with helper factories and auth utilities."""

    _counter = 0

    def setUp(self):
        super().setUp()
        # Email sending is a fire-and-forget background thread (see
        # apps/accounts/emails.py) - real in production, pure noise (and an
        # untracked side effect outliving the test) in a test run. Patched
        # where views.py imported the name (`from .emails import ...`),
        # not where it's defined - patching the origin wouldn't touch
        # views.py's already-bound reference.
        for patcher in (
            patch("apps.accounts.views.send_verification_email"),
            patch("apps.accounts.views.send_password_reset_email"),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

    @classmethod
    def _unique(cls, prefix="thing"):
        cls._counter += 1
        return f"{prefix}{cls._counter}"

    # ── Users ──

    def create_user(self, email=None, password="TestPass1234", **kwargs):
        email = email or f"{self._unique('user')}@example.com"
        username = kwargs.pop("username", self._unique("uname"))
        user = User(username=username, email=email, **kwargs)
        user.set_password(password)
        user.save()
        user._plain_password = password
        return user

    def create_superuser(self, email=None, password="AdminPass1234"):
        email = email or f"{self._unique('admin')}@example.com"
        return User.objects.create_superuser(
            username=self._unique("admin-uname"), email=email, password=password
        )

    def authenticate(self, user=None):
        """Force-authenticate the test client as the given user (bypasses
        the real cookie flow - use login_via_api() when the test is
        actually about the auth mechanism itself)."""
        if user is None:
            user = self.create_user()
        self.client.force_authenticate(user=user)
        return user

    def login_via_api(self, email, password):
        """Log in through the real endpoint. The test client persists
        cookies automatically across requests, same as a browser."""
        return self.client.post("/api/auth/login/", {"email": email, "password": password}, format="json")

    # ── Marketplace factories ──

    def create_seller(self, user=None, status=SellerProfile.Status.APPROVED, **kwargs):
        user = user or self.create_user()
        defaults = {"store_name": self._unique("Store"), "status": status}
        defaults.update(kwargs)
        return SellerProfile.objects.create(user=user, **defaults)

    def create_category(self, **kwargs):
        defaults = {"name": self._unique("Category")}
        defaults.update(kwargs)
        return Category.objects.create(**defaults)

    def create_product(self, seller=None, category=None, **kwargs):
        seller = seller or self.create_seller()
        category = category or self.create_category()
        defaults = {
            "name": self._unique("Product"),
            "price": Decimal("100.00"),
            "stock_quantity": 10,
        }
        defaults.update(kwargs)
        return Product.objects.create(seller=seller, category=category, **defaults)

    def add_to_cart(self, user, product, quantity=1):
        cart, _ = Cart.objects.get_or_create(user=user)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": quantity})
        if not created:
            item.quantity = quantity
            item.save(update_fields=["quantity"])
        return item

    def create_order(self, buyer=None, product=None, quantity=1, status=SellerOrder.Status.DELIVERED, **kwargs):
        """Bypasses the checkout API and builds an Order/SellerOrder/OrderItem
        directly - useful for tests that need an order in a specific state
        without re-driving checkout every time."""
        buyer = buyer or self.create_user()
        product = product or self.create_product()
        defaults = {
            "shipping_full_name": "Test Buyer",
            "shipping_phone": "9800000000",
            "shipping_address_line": "Test Address",
            "shipping_city": "Kathmandu",
            "shipping_district": "Kathmandu",
            "shipping_province": "Bagmati",
            "payment_method": Order.PaymentMethod.COD,
            "total_amount": product.price * quantity,
        }
        defaults.update(kwargs)
        order = Order.objects.create(buyer=buyer, **defaults)
        seller_order = SellerOrder.objects.create(
            order=order,
            seller=product.seller,
            status=status,
            commission_rate=product.seller.effective_commission_rate,
            subtotal=product.price * quantity,
        )
        order_item = OrderItem.objects.create(
            seller_order=seller_order,
            product=product,
            product_name=product.name,
            unit_price=product.price,
            quantity=quantity,
        )
        return order, seller_order, order_item

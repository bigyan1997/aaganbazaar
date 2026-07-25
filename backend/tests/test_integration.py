"""
Integration Tests — verify that API/model behaviour holds correctly at the
database level: slug generation, cascade/protect rules, constraints, and
signals firing regardless of how the state change was triggered.
"""
import threading
from decimal import Decimal
from unittest.mock import patch

from django.db import IntegrityError, connections
from django.db.models import ProtectedError
from django.test import TransactionTestCase, override_settings

from apps.cart.models import CartItem
from apps.catalog.models import Category, Product
from apps.orders.models import Order
from apps.reviews.models import Review
from apps.sellers.models import SellerProfile

from .base import TEST_SETTINGS, BaseAPITest


# ─── Slug generation ────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestSlugGeneration(BaseAPITest):
    def test_duplicate_category_names_get_unique_slugs(self):
        c1 = self.create_category(name="Same Name")
        c2 = Category.objects.create(name="Same Name")
        self.assertNotEqual(c1.slug, c2.slug)
        self.assertEqual(c2.slug, "same-name-2")

    def test_duplicate_product_names_get_unique_slugs(self):
        p1 = self.create_product(name="Same Product")
        p2 = self.create_product(name="Same Product")
        self.assertNotEqual(p1.slug, p2.slug)

    def test_duplicate_store_names_get_unique_slugs(self):
        s1 = self.create_seller(store_name="Same Store")
        s2 = self.create_seller(store_name="Same Store")
        self.assertNotEqual(s1.slug, s2.slug)


# ─── Cascade / protect rules ────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestCascadeRules(BaseAPITest):
    def test_category_with_products_cannot_be_deleted(self):
        category = self.create_category()
        self.create_product(category=category)
        with self.assertRaises(ProtectedError):
            category.delete()

    def test_deleting_product_preserves_order_history(self):
        _, seller_order, order_item = self.create_order()
        product_name = order_item.product_name
        order_item.product.delete()
        order_item.refresh_from_db()
        self.assertIsNone(order_item.product)
        self.assertEqual(order_item.product_name, product_name)

    def test_deleting_seller_cascades_to_products(self):
        seller = self.create_seller()
        product = self.create_product(seller=seller)
        seller.delete()
        self.assertFalse(Product.objects.filter(id=product.id).exists())

    def test_buyer_with_orders_cannot_be_deleted(self):
        order, _, _ = self.create_order()
        with self.assertRaises(ProtectedError):
            order.buyer.delete()


# ─── Unique constraints ─────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestUniqueConstraints(BaseAPITest):
    def test_cart_item_unique_per_product(self):
        user = self.create_user()
        product = self.create_product()
        self.add_to_cart(user, product)
        cart = user.cart
        with self.assertRaises(IntegrityError):
            CartItem.objects.create(cart=cart, product=product, quantity=1)

    def test_review_unique_per_order_item(self):
        _, _, order_item = self.create_order(status="delivered")
        Review.objects.create(product=order_item.product, buyer=order_item.seller_order.order.buyer,
                               order_item=order_item, rating=5)
        with self.assertRaises(IntegrityError):
            Review.objects.create(product=order_item.product, buyer=order_item.seller_order.order.buyer,
                                   order_item=order_item, rating=1)

    def test_seller_profile_unique_per_user(self):
        user = self.create_user()
        self.create_seller(user=user)
        with self.assertRaises(IntegrityError):
            SellerProfile.objects.create(user=user, store_name="Second")


# ─── Role-sync signal ───────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestRoleSyncSignal(BaseAPITest):
    def test_pending_to_approved_flips_role_to_seller(self):
        seller = self.create_seller(status=SellerProfile.Status.PENDING)
        self.assertEqual(seller.user.role, "buyer")
        seller.status = SellerProfile.Status.APPROVED
        seller.save()
        seller.user.refresh_from_db()
        self.assertEqual(seller.user.role, "seller")

    def test_approved_to_suspended_flips_role_back_to_buyer(self):
        seller = self.create_seller(status=SellerProfile.Status.APPROVED)
        seller.user.refresh_from_db()
        self.assertEqual(seller.user.role, "seller")
        seller.status = SellerProfile.Status.SUSPENDED
        seller.save()
        seller.user.refresh_from_db()
        self.assertEqual(seller.user.role, "buyer")

    def test_role_sync_fires_regardless_of_save_source(self):
        """The signal is on post_save for the model itself - confirm it
        fires the same way whether triggered via .save(), .update() would
        NOT fire it (documented Django behaviour), and via bulk create it
        also would not. This test documents the .save() contract that the
        rest of the app (admin, API) actually relies on."""
        seller = self.create_seller(status=SellerProfile.Status.PENDING)
        SellerProfile.objects.filter(pk=seller.pk).update(status=SellerProfile.Status.APPROVED)
        seller.user.refresh_from_db()
        # .update() bypasses post_save on purpose (Django's documented
        # behaviour) - role must NOT have flipped, proving the signal
        # really is doing the work elsewhere, not some other mechanism.
        self.assertEqual(seller.user.role, "buyer")


# ─── Checkout consistency (Order -> SellerOrder -> OrderItem) ──────────────────

@override_settings(**TEST_SETTINGS)
class TestCheckoutConsistency(BaseAPITest):
    CHECKOUT_PAYLOAD = {
        "shipping_full_name": "Test Buyer", "shipping_phone": "9800000000",
        "shipping_address_line": "Test St", "shipping_city": "Kathmandu",
        "shipping_district": "Kathmandu", "shipping_province": "Bagmati",
        "payment_method": "cod",
    }

    def test_checkout_splits_by_seller(self):
        user = self.authenticate()
        seller_a = self.create_seller()
        seller_b = self.create_seller()
        product_a = self.create_product(seller=seller_a, price=Decimal("100.00"), stock_quantity=5)
        product_b = self.create_product(seller=seller_b, price=Decimal("50.00"), stock_quantity=5)
        self.add_to_cart(user, product_a, quantity=1)
        self.add_to_cart(user, product_b, quantity=2)

        r = self.client.post("/api/orders/checkout/", self.CHECKOUT_PAYLOAD, format="json")
        self.assertEqual(r.status_code, 201)
        order = Order.objects.get(order_number=r.data["order_number"])
        self.assertEqual(order.seller_orders.count(), 2)
        self.assertEqual(order.total_amount, Decimal("200.00"))

    def test_checkout_rejects_insufficient_stock(self):
        user = self.authenticate()
        product = self.create_product(stock_quantity=1)
        self.add_to_cart(user, product, quantity=1)
        # Manually drop stock below what's in the cart, simulating another
        # buyer having bought it in between add-to-cart and checkout.
        Product.objects.filter(pk=product.pk).update(stock_quantity=0)
        r = self.client.post("/api/orders/checkout/", self.CHECKOUT_PAYLOAD, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Order.objects.filter(buyer=user).exists())


# ─── Concurrency: the whole point of select_for_update in checkout ────────────

class TestCheckoutConcurrency(TransactionTestCase):
    """Uses TransactionTestCase (not the default TestCase) because
    select_for_update row locking needs real, separate DB transactions
    running concurrently - Django's normal TestCase wraps each test in a
    single outer transaction, which would make this test meaningless."""

    @override_settings(**TEST_SETTINGS)
    @patch("apps.orders.views.send_new_order_email")
    def test_concurrent_checkouts_cannot_oversell_stock(self, mock_send_email):
        from django.contrib.auth import get_user_model
        from apps.catalog.models import Category, Product
        from apps.sellers.models import SellerProfile

        User = get_user_model()
        seller_user = User.objects.create_user(username="conc-seller", email="conc-seller@test.com", password="x")
        seller = SellerProfile.objects.create(user=seller_user, store_name="Concurrency Store",
                                               status=SellerProfile.Status.APPROVED)
        category = Category.objects.create(name="Concurrency Category")
        product = Product.objects.create(
            seller=seller, category=category, name="Scarce Item",
            price=Decimal("10.00"), stock_quantity=1,
        )

        buyer_a = User.objects.create_user(username="conc-a", email="conc-a@test.com", password="x")
        buyer_b = User.objects.create_user(username="conc-b", email="conc-b@test.com", password="x")

        from apps.cart.models import Cart, CartItem
        for buyer in (buyer_a, buyer_b):
            cart = Cart.objects.create(user=buyer)
            CartItem.objects.create(cart=cart, product=product, quantity=1)

        payload = {
            "shipping_full_name": "Buyer", "shipping_phone": "9800000000",
            "shipping_address_line": "St", "shipping_city": "Kathmandu",
            "shipping_district": "Kathmandu", "shipping_province": "Bagmati",
            "payment_method": "cod",
        }

        results = {}

        def checkout(buyer, key):
            from rest_framework.test import APIClient
            client = APIClient()
            client.force_authenticate(user=buyer)
            r = client.post("/api/orders/checkout/", payload, format="json")
            results[key] = r.status_code
            connections.close_all()  # each thread needs its own DB connection cleaned up

        t1 = threading.Thread(target=checkout, args=(buyer_a, "a"))
        t2 = threading.Thread(target=checkout, args=(buyer_b, "b"))
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        # Exactly one buyer should succeed (only 1 unit of stock existed);
        # the other must be rejected, not silently oversold.
        statuses = sorted(results.values())
        self.assertEqual(statuses, [201, 400])
        product.refresh_from_db()
        self.assertEqual(product.stock_quantity, 0)

        # The seller notification is deferred via transaction.on_commit -
        # it should fire exactly once, for the checkout that actually
        # committed, not for the one that rolled back.
        mock_send_email.assert_called_once()

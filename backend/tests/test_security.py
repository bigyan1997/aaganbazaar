"""
Security Tests — OWASP API Top-10 style checks:
  - Broken Authentication
  - Broken Object Level Authorization (IDOR / BOLA)
  - Mass Assignment
  - Injection (SQL / XSS)
  - Excessive Data Exposure
  - Security Misconfiguration
  - Rate limiting
"""
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from rest_framework.throttling import AnonRateThrottle

from apps.catalog.models import Product
from apps.sellers.models import SellerProfile

from .base import TEST_SETTINGS, BaseAPITest


# ─── Broken Authentication ─────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestBrokenAuthentication(BaseAPITest):
    PROTECTED_ENDPOINTS = [
        ("GET", "/api/auth/me/"),
        ("POST", "/api/auth/logout/"),
        ("GET", "/api/cart/"),
        ("POST", "/api/cart/items/"),
        ("GET", "/api/orders/"),
        ("POST", "/api/orders/checkout/"),
        ("GET", "/api/orders/seller/"),
        ("POST", "/api/sellers/apply/"),
        ("GET", "/api/sellers/me/"),
        ("POST", "/api/reviews/"),
    ]

    def test_protected_endpoints_reject_unauthenticated(self):
        for method, url in self.PROTECTED_ENDPOINTS:
            with self.subTest(method=method, url=url):
                handler = getattr(self.client, method.lower())
                r = handler(url, {}, format="json") if method == "POST" else handler(url)
                self.assertEqual(r.status_code, 401, f"{method} {url} should return 401, got {r.status_code}")

    def test_tampered_cookie_rejected(self):
        self.client.cookies["access_token"] = "not.a.real.jwt"
        r = self.client.get("/api/auth/me/")
        self.assertEqual(r.status_code, 401)

    def test_forged_jwt_signature_rejected(self):
        # Well-formed JWT shape, wrong signature - must not be trusted.
        forged = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
            ".eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6MX0"
            ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        )
        self.client.cookies["access_token"] = forged
        r = self.client.get("/api/auth/me/")
        self.assertEqual(r.status_code, 401)

    def test_bearer_header_alone_not_accepted(self):
        """Auth is cookie-only by design - a Bearer header (as if lifted
        from another API's convention) must not work."""
        user = self.create_user(password="Pass1234567")
        from rest_framework_simplejwt.tokens import RefreshToken
        token = str(RefreshToken.for_user(user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        r = self.client.get("/api/auth/me/")
        self.assertEqual(r.status_code, 401)


# ─── IDOR ───────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestIDOR(BaseAPITest):
    def test_cannot_edit_another_sellers_product(self):
        product = self.create_product()
        self.authenticate()
        r = self.client.patch(f"/api/products/{product.slug}/", {"price": "1.00"}, format="json")
        self.assertEqual(r.status_code, 403)
        product.refresh_from_db()
        self.assertNotEqual(product.price, Decimal("1.00"))

    def test_cannot_delete_another_sellers_product(self):
        product = self.create_product()
        self.authenticate()
        r = self.client.delete(f"/api/products/{product.slug}/")
        self.assertEqual(r.status_code, 403)
        self.assertTrue(Product.objects.filter(id=product.id).exists())

    def test_inactive_product_hidden_from_non_owner(self):
        product = self.create_product(is_active=False)
        r = self.client.get(f"/api/products/{product.slug}/")
        self.assertEqual(r.status_code, 404)

    def test_inactive_product_visible_to_owner(self):
        seller = self.create_seller()
        product = self.create_product(seller=seller, is_active=False)
        self.authenticate(seller.user)
        r = self.client.get(f"/api/products/{product.slug}/")
        self.assertEqual(r.status_code, 200)

    def test_cannot_upload_image_to_another_sellers_product(self):
        # A valid file is required here - an empty payload would 400 on
        # serializer validation before ever reaching the ownership check
        # in perform_create(), making the test pass for the wrong reason.
        from django.core.files.uploadedfile import SimpleUploadedFile
        tiny_gif = SimpleUploadedFile(
            "test.gif", b"GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,"
                        b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )
        product = self.create_product()
        self.authenticate()
        r = self.client.post(f"/api/products/{product.slug}/images/", {"image": tiny_gif}, format="multipart")
        self.assertEqual(r.status_code, 403)

    def test_cannot_modify_another_users_cart_item(self):
        owner = self.create_user()
        product = self.create_product()
        item = self.add_to_cart(owner, product)
        self.authenticate()  # different user
        r = self.client.patch(f"/api/cart/items/{item.id}/", {"quantity": 99}, format="json")
        self.assertEqual(r.status_code, 404)  # queryset-scoped, not just permission-denied

    def test_cannot_view_another_buyers_order(self):
        order, _, _ = self.create_order()
        self.authenticate()  # different buyer
        r = self.client.get(f"/api/orders/{order.order_number}/")
        self.assertEqual(r.status_code, 404)

    def test_cannot_manage_another_sellers_order(self):
        _, seller_order, _ = self.create_order()
        self.authenticate()  # unrelated user, not even a seller
        r = self.client.patch(f"/api/orders/seller/{seller_order.id}/", {"status": "confirmed"}, format="json")
        self.assertIn(r.status_code, (403, 404))

    def test_cannot_edit_another_buyers_review(self):
        _, _, order_item = self.create_order(status="delivered")
        from apps.reviews.models import Review
        review = Review.objects.create(
            product=order_item.product, buyer=order_item.seller_order.order.buyer,
            order_item=order_item, rating=5,
        )
        self.authenticate()  # different user
        r = self.client.patch(f"/api/reviews/{review.id}/", {"rating": 1}, format="json")
        self.assertEqual(r.status_code, 404)

    def test_reviewable_item_scoped_to_own_purchases_only(self):
        # A delivered purchase belonging to someone else must never make
        # the endpoint offer up their order_item id to a different user.
        _, _, order_item = self.create_order(status="delivered")
        self.authenticate()  # different buyer, never bought this product
        r = self.client.get(f"/api/products/{order_item.product.slug}/reviewable-item/")
        self.assertIsNone(r.data["order_item_id"])

    def test_cannot_delete_another_users_review_image(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        from apps.reviews.models import Review, ReviewImage

        _, _, order_item = self.create_order(status="delivered")
        buyer = order_item.seller_order.order.buyer
        review = Review.objects.create(
            product=order_item.product, buyer=buyer, order_item=order_item, rating=5,
        )
        tiny_gif = SimpleUploadedFile(
            "test.gif", b"GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,"
                        b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )
        image = ReviewImage.objects.create(review=review, image=tiny_gif)
        self.authenticate()  # different user
        r = self.client.delete(f"/api/reviews/images/{image.id}/")
        self.assertEqual(r.status_code, 404)  # queryset-scoped, not just permission-denied

    def test_cannot_delete_another_users_wishlist_item(self):
        from apps.wishlist.models import WishlistItem

        owner = self.create_user()
        product = self.create_product()
        item = WishlistItem.objects.create(user=owner, product=product)
        self.authenticate()  # different user
        r = self.client.delete(f"/api/wishlist/{item.id}/")
        self.assertEqual(r.status_code, 404)  # queryset-scoped, not just permission-denied

    def test_stock_alert_status_scoped_to_own_subscription(self):
        from apps.catalog.models import StockAlert

        subscriber = self.create_user()
        product = self.create_product(stock_quantity=0)
        StockAlert.objects.create(user=subscriber, product=product)
        self.authenticate()  # different user, never subscribed
        r = self.client.get(f"/api/products/{product.slug}/notify-me/")
        self.assertFalse(r.data["subscribed"])


# ─── Mass Assignment ────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestMassAssignment(BaseAPITest):
    def test_cannot_set_product_seller_via_payload(self):
        seller = self.create_seller()
        other_seller = self.create_seller()
        self.authenticate(seller.user)
        category = self.create_category()
        r = self.client.post(
            "/api/products/",
            {"category": category.id, "name": "X", "price": "10.00", "stock_quantity": 1, "seller": other_seller.id},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        product = Product.objects.get(id=r.data["id"])
        self.assertEqual(product.seller_id, seller.id)

    def test_register_cannot_set_role(self):
        r = self.client.post(
            "/api/auth/register/",
            {"email": "spoof@test.com", "password": "SpoofPass1234", "password2": "SpoofPass1234",
             "first_name": "A", "last_name": "B", "role": "admin"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["role"], "buyer")

    def test_register_cannot_set_email_verified(self):
        r = self.client.post(
            "/api/auth/register/",
            {"email": "spoof2@test.com", "password": "SpoofPass1234", "password2": "SpoofPass1234",
             "first_name": "A", "last_name": "B", "is_email_verified": True},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertFalse(r.data["is_email_verified"])

    def test_seller_apply_cannot_self_approve(self):
        self.authenticate()
        r = self.client.post(
            "/api/sellers/apply/", {"store_name": "Sneaky Store", "status": "approved"}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["status"], "pending")

    def test_checkout_cannot_set_buyer(self):
        user = self.authenticate()
        other = self.create_user()
        product = self.create_product(stock_quantity=5)
        self.add_to_cart(user, product)
        payload = {
            "shipping_full_name": "X", "shipping_phone": "1", "shipping_address_line": "X",
            "shipping_city": "X", "shipping_district": "X", "shipping_province": "X",
            "payment_method": "cod", "buyer": other.id,
        }
        r = self.client.post("/api/orders/checkout/", payload, format="json")
        self.assertEqual(r.status_code, 201)
        from apps.orders.models import Order
        order = Order.objects.get(order_number=r.data["order_number"])
        self.assertEqual(order.buyer_id, user.id)

    def test_seller_order_update_cannot_change_seller(self):
        seller = self.create_seller()
        other_seller = self.create_seller()
        _, seller_order, _ = self.create_order(product=self.create_product(seller=seller), status="pending")
        self.authenticate(seller.user)
        r = self.client.patch(
            f"/api/orders/seller/{seller_order.id}/",
            {"status": "confirmed", "seller": other_seller.id}, format="json",
        )
        self.assertEqual(r.status_code, 200)
        seller_order.refresh_from_db()
        self.assertEqual(seller_order.seller_id, seller.id)

    def test_review_cannot_set_buyer(self):
        _, _, order_item = self.create_order(status="delivered")
        real_buyer = order_item.seller_order.order.buyer
        impersonated = self.create_user()
        self.authenticate(real_buyer)
        r = self.client.post(
            "/api/reviews/", {"order_item": order_item.id, "rating": 5, "buyer": impersonated.id}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        from apps.reviews.models import Review
        review = Review.objects.get(id=r.data["id"])
        self.assertEqual(review.buyer_id, real_buyer.id)


# ─── Injection ──────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestInjection(BaseAPITest):
    SQL_PAYLOADS = [
        "' OR '1'='1",
        "'; DROP TABLE accounts_user; --",
        "1' UNION SELECT * FROM accounts_user --",
        "' OR 1=1 --",
    ]

    XSS_PAYLOADS = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '"><svg/onload=alert(1)>',
    ]

    def test_product_search_handles_sql_injection(self):
        for payload in self.SQL_PAYLOADS:
            with self.subTest(payload=payload):
                r = self.client.get(f"/api/products/?search={payload}")
                self.assertNotEqual(r.status_code, 500)

    def test_login_handles_sql_injection(self):
        for payload in self.SQL_PAYLOADS:
            with self.subTest(payload=payload):
                r = self.client.post("/api/auth/login/", {"email": payload, "password": payload}, format="json")
                self.assertNotEqual(r.status_code, 500)
                self.assertEqual(r.status_code, 400)

    def test_product_slug_lookup_handles_injection(self):
        for payload in self.SQL_PAYLOADS:
            with self.subTest(payload=payload):
                r = self.client.get(f"/api/products/{payload}/")
                self.assertNotEqual(r.status_code, 500)

    def test_product_description_stores_xss_as_text(self):
        seller = self.create_seller()
        self.authenticate(seller.user)
        category = self.create_category()
        for payload in self.XSS_PAYLOADS:
            with self.subTest(payload=payload):
                r = self.client.post(
                    "/api/products/",
                    {"category": category.id, "name": "XSS Test", "description": payload,
                     "price": "10.00", "stock_quantity": 1},
                    format="json",
                )
                self.assertNotEqual(r.status_code, 500)
                if r.status_code == 201:
                    product = Product.objects.get(id=r.data["id"])
                    self.assertEqual(product.description, payload)  # stored verbatim, not executed

    def test_review_comment_handles_xss(self):
        _, _, order_item = self.create_order(status="delivered")
        self.authenticate(order_item.seller_order.order.buyer)
        for payload in self.XSS_PAYLOADS:
            with self.subTest(payload=payload):
                r = self.client.post(
                    "/api/reviews/", {"order_item": order_item.id, "rating": 5, "comment": payload}, format="json"
                )
                self.assertNotEqual(r.status_code, 500)


# ─── Excessive Data Exposure ────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestExcessiveDataExposure(BaseAPITest):
    def test_password_never_in_me_response(self):
        self.authenticate()
        r = self.client.get("/api/auth/me/")
        self.assertNotIn("password", str(r.data).lower())

    def test_public_seller_detail_hides_commission_rate(self):
        seller = self.create_seller(status=SellerProfile.Status.APPROVED, commission_rate=Decimal("5.00"))
        r = self.client.get(f"/api/sellers/{seller.slug}/")
        self.assertNotIn("commission_rate", r.data)

    def test_public_seller_detail_hides_contact_phone(self):
        seller = self.create_seller(status=SellerProfile.Status.APPROVED, contact_phone="9800000000")
        r = self.client.get(f"/api/sellers/{seller.slug}/")
        self.assertNotIn("contact_phone", r.data)

    def test_other_buyers_shipping_address_not_visible(self):
        order, _, _ = self.create_order(shipping_phone="9811111111")
        self.authenticate()  # a different buyer
        r = self.client.get("/api/orders/")
        self.assertEqual(r.data["count"], 0)
        self.assertNotIn("9811111111", str(r.data))


# ─── Security Misconfiguration ──────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestSecurityConfiguration(BaseAPITest):
    def test_api_errors_are_json_not_html(self):
        r = self.client.get("/api/products/does-not-exist-at-all/")
        self.assertIn(r.status_code, (400, 404))
        self.assertEqual(r["Content-Type"].split(";")[0], "application/json")

    def test_disallowed_method_returns_405(self):
        r = self.client.delete("/api/categories/")
        self.assertEqual(r.status_code, 405)

    def test_admin_requires_auth(self):
        r = self.client.get("/admin/")
        self.assertIn(r.status_code, (302, 403))


# ─── Rate Limiting ──────────────────────────────────────────────────────────────

@override_settings(
    **{
        **TEST_SETTINGS,
        # LocMemCache so throttle history actually accumulates across
        # requests within this test - DummyCache (the suite default) never
        # accumulates, which would make this test meaningless.
        "CACHES": {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "rl-test"}},
    }
)
class TestRateLimiting(BaseAPITest):
    def test_login_rate_limit_enforced(self):
        """
        rest_framework.throttling.SimpleRateThrottle.THROTTLE_RATES is read
        from api_settings once, at class-definition time - override_settings
        does NOT reach it. Patch the class attribute directly instead, which
        is what apps.accounts.throttles.LoginRateThrottle (an AnonRateThrottle
        subclass) actually reads from at request time.
        """
        from django.core.cache import cache

        with patch.object(AnonRateThrottle, "THROTTLE_RATES", {"login": "3/day", "anon": "100000/day"}):
            cache.clear()
            statuses = []
            for _ in range(6):
                r = self.client.post(
                    "/api/auth/login/", {"email": "nobody@test.com", "password": "wrong"}, format="json"
                )
                statuses.append(r.status_code)

        self.assertIn(429, statuses, f"Never throttled after 6 requests at 3/day: {statuses}")

"""
Fuzz Tests — throw random, malformed, boundary, and unexpected input at
every write endpoint. The server must never return 500; anything else
(200/201/400/401/403/404/405/429) means it handled the garbage gracefully.
"""
from django.test import override_settings

from .base import TEST_SETTINGS, BaseAPITest

ALLOWED_STATUSES = {200, 201, 204, 400, 401, 403, 404, 405, 429}

FUZZ_STRINGS = [
    "",
    " ",
    "\t\n\r",
    "A" * 10_000,
    "你好世界",
    "𝕳𝖊𝖑𝖑𝖔",
    "🔥💀🎭",
    "../../../../etc/passwd",
    "\x00",
    "test\x00injection",
    "%s%s%s%s%s%s",
    "{{7*7}}",
    "${7*7}",
    "' OR '1'='1",
    "'; DROP TABLE accounts_user; --",
    '<script>alert(1)</script>',
    "9999999999999999999999999999",
    "-9999999999999999999999999999",
    "true",
    "null",
    "[]",
    "{}",
    "!@#$%^&*()_+-=[]{}|;:'\",.<>?/`~",
    "line1\nline2\nline3",
]

FUZZ_NUMBERS = [None, "", "abc", "-1", "0", "99999999999", "1.23.45", "1e999", "∞", "0x1F"]

FUZZ_EMAILS = ["", "notanemail", "@nodomain.com", "no@", "a" * 300 + "@example.com", "<script>@example.com"]


def assert_no_500(test, response, context=""):
    test.assertIn(response.status_code, ALLOWED_STATUSES, f"Got {response.status_code} for {context}")


@override_settings(**TEST_SETTINGS)
class TestAuthFuzz(BaseAPITest):
    def test_login_fuzz_email(self):
        for value in FUZZ_EMAILS:
            with self.subTest(email=repr(value)):
                r = self.client.post("/api/auth/login/", {"email": value, "password": "x"}, format="json")
                assert_no_500(self, r, f"login email={value!r}")

    def test_login_fuzz_password(self):
        for value in FUZZ_STRINGS[:12]:
            with self.subTest(password=repr(value[:30])):
                r = self.client.post("/api/auth/login/", {"email": "x@x.com", "password": value}, format="json")
                assert_no_500(self, r, f"login password={value[:30]!r}")

    def test_register_fuzz_all_fields(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(value=repr(value[:30])):
                r = self.client.post(
                    "/api/auth/register/",
                    {"email": value, "password": value, "password2": value, "first_name": value, "last_name": value},
                    format="json",
                )
                assert_no_500(self, r, f"register value={value[:30]!r}")

    def test_verify_email_fuzz(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(value=repr(value[:30])):
                r = self.client.post("/api/auth/verify-email/", {"uid": value, "token": value}, format="json")
                assert_no_500(self, r, f"verify-email={value[:30]!r}")

    def test_password_reset_confirm_fuzz(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(value=repr(value[:30])):
                r = self.client.post(
                    "/api/auth/password-reset/confirm/",
                    {"uid": value, "token": value, "new_password": value, "new_password2": value},
                    format="json",
                )
                assert_no_500(self, r, f"password-reset-confirm={value[:30]!r}")


@override_settings(**TEST_SETTINGS)
class TestProductFuzz(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.seller = self.create_seller()
        self.category = self.create_category()
        self.authenticate(self.seller.user)

    def test_create_product_fuzz_name(self):
        for value in FUZZ_STRINGS[:12]:
            with self.subTest(name=repr(value[:30])):
                r = self.client.post(
                    "/api/products/",
                    {"category": self.category.id, "name": value, "price": "10.00", "stock_quantity": 1},
                    format="json",
                )
                assert_no_500(self, r, f"product name={value[:30]!r}")

    def test_create_product_fuzz_price(self):
        for value in FUZZ_NUMBERS:
            with self.subTest(price=repr(value)):
                r = self.client.post(
                    "/api/products/",
                    {"category": self.category.id, "name": "X", "price": value, "stock_quantity": 1},
                    format="json",
                )
                assert_no_500(self, r, f"product price={value!r}")

    def test_create_product_fuzz_stock(self):
        for value in FUZZ_NUMBERS:
            with self.subTest(stock=repr(value)):
                r = self.client.post(
                    "/api/products/",
                    {"category": self.category.id, "name": "X", "price": "10.00", "stock_quantity": value},
                    format="json",
                )
                assert_no_500(self, r, f"product stock={value!r}")

    def test_create_product_fuzz_category(self):
        for value in FUZZ_NUMBERS + ["<script>", "electronics"]:
            with self.subTest(category=repr(value)):
                r = self.client.post(
                    "/api/products/",
                    {"category": value, "name": "X", "price": "10.00", "stock_quantity": 1},
                    format="json",
                )
                assert_no_500(self, r, f"product category={value!r}")

    def test_product_slug_lookup_fuzz(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(slug=repr(value[:30])):
                r = self.client.get(f"/api/products/{value[:200]}/")
                assert_no_500(self, r, f"product slug={value[:30]!r}")

    def test_product_search_fuzz(self):
        for value in FUZZ_STRINGS[:12]:
            with self.subTest(q=repr(value[:30])):
                r = self.client.get(f"/api/products/?search={value[:200]}")
                assert_no_500(self, r, f"product search={value[:30]!r}")


@override_settings(**TEST_SETTINGS)
class TestCartFuzz(BaseAPITest):
    def setUp(self):
        super().setUp()
        self.authenticate()
        self.product = self.create_product(stock_quantity=10)

    def test_add_to_cart_fuzz_quantity(self):
        for value in FUZZ_NUMBERS:
            with self.subTest(quantity=repr(value)):
                r = self.client.post(
                    "/api/cart/items/", {"product": self.product.id, "quantity": value}, format="json"
                )
                assert_no_500(self, r, f"cart quantity={value!r}")

    def test_add_to_cart_fuzz_product_id(self):
        for value in FUZZ_NUMBERS + ["<script>"]:
            with self.subTest(product=repr(value)):
                r = self.client.post("/api/cart/items/", {"product": value, "quantity": 1}, format="json")
                assert_no_500(self, r, f"cart product={value!r}")

    def test_cart_item_id_fuzz(self):
        for value in FUZZ_NUMBERS:
            with self.subTest(item_id=repr(value)):
                r = self.client.patch(f"/api/cart/items/{value}/", {"quantity": 1}, format="json")
                assert_no_500(self, r, f"cart item id={value!r}")


@override_settings(**TEST_SETTINGS)
class TestCheckoutFuzz(BaseAPITest):
    def setUp(self):
        super().setUp()
        user = self.authenticate()
        self.add_to_cart(user, self.create_product(stock_quantity=10))

    def test_checkout_fuzz_shipping_fields(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(value=repr(value[:30])):
                r = self.client.post(
                    "/api/orders/checkout/",
                    {
                        "shipping_full_name": value, "shipping_phone": value, "shipping_address_line": value,
                        "shipping_city": value, "shipping_district": value, "shipping_province": value,
                        "payment_method": "cod",
                    },
                    format="json",
                )
                assert_no_500(self, r, f"checkout shipping={value[:30]!r}")

    def test_checkout_fuzz_payment_method(self):
        invalid = ["", "bitcoin", "ESEWA", "<script>", "cod; DROP TABLE", None]
        for value in invalid:
            with self.subTest(payment_method=repr(value)):
                r = self.client.post(
                    "/api/orders/checkout/",
                    {
                        "shipping_full_name": "X", "shipping_phone": "1", "shipping_address_line": "X",
                        "shipping_city": "X", "shipping_district": "X", "shipping_province": "X",
                        "payment_method": value,
                    },
                    format="json",
                )
                assert_no_500(self, r, f"checkout payment_method={value!r}")

    def test_order_number_lookup_fuzz(self):
        for value in FUZZ_STRINGS[:10]:
            with self.subTest(order_number=repr(value[:30])):
                r = self.client.get(f"/api/orders/{value[:200]}/")
                assert_no_500(self, r, f"order_number={value[:30]!r}")


@override_settings(**TEST_SETTINGS)
class TestReviewFuzz(BaseAPITest):
    def test_review_fuzz_rating(self):
        _, _, order_item = self.create_order(status="delivered")
        self.authenticate(order_item.seller_order.order.buyer)
        invalid_ratings = ["", "five", "-1", "6", "0", "100", "null", "{}", "3.5", None]
        for value in invalid_ratings:
            with self.subTest(rating=repr(value)):
                r = self.client.post(
                    "/api/reviews/", {"order_item": order_item.id, "rating": value, "comment": "x"}, format="json"
                )
                assert_no_500(self, r, f"review rating={value!r}")

    def test_review_fuzz_order_item_id(self):
        self.authenticate()
        for value in FUZZ_NUMBERS + ["<script>"]:
            with self.subTest(order_item=repr(value)):
                r = self.client.post("/api/reviews/", {"order_item": value, "rating": 5}, format="json")
                assert_no_500(self, r, f"review order_item={value!r}")


@override_settings(**TEST_SETTINGS)
class TestSellerApplyFuzz(BaseAPITest):
    def test_apply_fuzz_store_name(self):
        self.authenticate()
        for value in FUZZ_STRINGS[:12]:
            with self.subTest(store_name=repr(value[:30])):
                r = self.client.post("/api/sellers/apply/", {"store_name": value}, format="json")
                assert_no_500(self, r, f"seller store_name={value[:30]!r}")

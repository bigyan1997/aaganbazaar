"""
Smoke Tests — fast, shallow checks that every route is wired up and
answers with *something* sane. Not correctness, just "is it alive."
Run this first; if it fails, nothing else is worth running yet.
"""
from django.test import override_settings

from .base import BaseAPITest, TEST_SETTINGS


@override_settings(**TEST_SETTINGS)
class TestSmoke(BaseAPITest):
    def test_health_check(self):
        r = self.client.get("/api/health/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "ok")

    def test_admin_login_page_loads(self):
        r = self.client.get("/admin/login/")
        self.assertEqual(r.status_code, 200)

    def test_categories_list_reachable(self):
        r = self.client.get("/api/categories/")
        self.assertEqual(r.status_code, 200)

    def test_products_list_reachable(self):
        r = self.client.get("/api/products/")
        self.assertEqual(r.status_code, 200)

    def test_auth_endpoints_reachable(self):
        # Wrong credentials, but the route must exist and respond, not 404.
        r = self.client.post("/api/auth/login/", {"email": "x@x.com", "password": "x"}, format="json")
        self.assertNotEqual(r.status_code, 404)

    def test_cart_requires_auth_not_404(self):
        r = self.client.get("/api/cart/")
        self.assertEqual(r.status_code, 401)

    def test_orders_requires_auth_not_404(self):
        r = self.client.get("/api/orders/")
        self.assertEqual(r.status_code, 401)

    def test_sellers_apply_requires_auth_not_404(self):
        r = self.client.post("/api/sellers/apply/", {}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_reviews_create_requires_auth_not_404(self):
        r = self.client.post("/api/reviews/", {}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_product_detail_404_for_unknown_slug(self):
        r = self.client.get("/api/products/does-not-exist/")
        self.assertEqual(r.status_code, 404)

    def test_category_and_product_visible_end_to_end(self):
        category = self.create_category(name="Smoke Category")
        product = self.create_product(category=category)
        r = self.client.get(f"/api/products/{product.slug}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["name"], product.name)

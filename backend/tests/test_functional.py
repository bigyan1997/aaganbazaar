"""
Functional Tests — verify every endpoint returns the correct HTTP status
code and payload shape for happy-path, auth-required, and common error
scenarios.
"""
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings

from apps.sellers.models import SellerProfile

from .base import BaseAPITest, TEST_SETTINGS

User = get_user_model()


# ─── Auth ──────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestAuthFunctional(BaseAPITest):
    def test_register_success_sets_cookies(self):
        r = self.client.post(
            "/api/auth/register/",
            {"email": "reg@test.com", "password": "RegPass1234", "password2": "RegPass1234",
             "first_name": "Reg", "last_name": "User"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertIn("access_token", r.cookies)
        self.assertIn("refresh_token", r.cookies)
        self.assertTrue(r.cookies["access_token"]["httponly"])

    def test_register_duplicate_email(self):
        self.create_user(email="dup@test.com")
        r = self.client.post(
            "/api/auth/register/",
            {"email": "dup@test.com", "password": "AnyPass1234", "password2": "AnyPass1234",
             "first_name": "A", "last_name": "B"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_register_password_mismatch(self):
        r = self.client.post(
            "/api/auth/register/",
            {"email": "mismatch@test.com", "password": "Pass11111", "password2": "Pass22222",
             "first_name": "A", "last_name": "B"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_register_weak_password_rejected(self):
        r = self.client.post(
            "/api/auth/register/",
            {"email": "weak@test.com", "password": "12345", "password2": "12345",
             "first_name": "A", "last_name": "B"},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_login_success(self):
        self.create_user(email="login@test.com", password="LoginPass1234")
        r = self.login_via_api("login@test.com", "LoginPass1234")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access_token", r.cookies)

    def test_login_wrong_password(self):
        self.create_user(email="bad@test.com", password="RightPass1234")
        r = self.login_via_api("bad@test.com", "WrongPass1234")
        self.assertEqual(r.status_code, 400)

    def test_login_nonexistent_user(self):
        r = self.login_via_api("nobody@test.com", "AnyPass1234")
        self.assertEqual(r.status_code, 400)

    @patch("apps.accounts.views.google_id_token.verify_oauth2_token")
    def test_google_login_creates_new_user(self, mock_verify):
        mock_verify.return_value = {
            "email": "newgoogle@test.com",
            "email_verified": True,
            "given_name": "Goog",
            "family_name": "User",
            "picture": "https://example.com/photo.jpg",
        }
        r = self.client.post("/api/auth/google/", {"credential": "fake-token"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access_token", r.cookies)
        user = User.objects.get(email="newgoogle@test.com")
        self.assertTrue(user.is_email_verified)
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.auth_provider, "google")
        self.assertEqual(user.avatar_url, "https://example.com/photo.jpg")

    @patch("apps.accounts.views.google_id_token.verify_oauth2_token")
    def test_google_login_existing_user_logs_in(self, mock_verify):
        existing = self.create_user(email="existing@test.com")
        mock_verify.return_value = {
            "email": "existing@test.com",
            "email_verified": True,
            "given_name": "Existing",
            "family_name": "User",
            "picture": "https://example.com/photo.jpg",
        }
        r = self.client.post("/api/auth/google/", {"credential": "fake-token"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(User.objects.filter(email="existing@test.com").count(), 1)
        self.assertEqual(r.data["id"], existing.id)
        existing.refresh_from_db()
        self.assertEqual(existing.auth_provider, "email")
        self.assertEqual(existing.avatar_url, "")

    @patch("apps.accounts.views.google_id_token.verify_oauth2_token")
    def test_google_login_rejects_unverified_email(self, mock_verify):
        mock_verify.return_value = {"email": "unverified@test.com", "email_verified": False}
        r = self.client.post("/api/auth/google/", {"credential": "fake-token"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertFalse(User.objects.filter(email="unverified@test.com").exists())

    @patch("apps.accounts.views.google_id_token.verify_oauth2_token")
    def test_google_login_rejects_invalid_credential(self, mock_verify):
        mock_verify.side_effect = ValueError("bad token")
        r = self.client.post("/api/auth/google/", {"credential": "garbage"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_me_requires_auth(self):
        r = self.client.get("/api/auth/me/")
        self.assertEqual(r.status_code, 401)

    def test_me_after_login(self):
        self.create_user(email="me@test.com", password="MePass1234")
        self.login_via_api("me@test.com", "MePass1234")
        r = self.client.get("/api/auth/me/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["email"], "me@test.com")

    def test_refresh_rotates_cookie(self):
        self.create_user(email="refresh@test.com", password="RefreshPass1234")
        self.login_via_api("refresh@test.com", "RefreshPass1234")
        r = self.client.post("/api/auth/refresh/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access_token", r.cookies)

    def test_refresh_without_cookie_rejected(self):
        r = self.client.post("/api/auth/refresh/")
        self.assertEqual(r.status_code, 401)

    def test_logout_clears_cookies(self):
        self.create_user(email="logout@test.com", password="LogoutPass1234")
        self.login_via_api("logout@test.com", "LogoutPass1234")
        r = self.client.post("/api/auth/logout/")
        self.assertEqual(r.status_code, 200)
        r2 = self.client.get("/api/auth/me/")
        self.assertEqual(r2.status_code, 401)

    def test_password_reset_request_always_200(self):
        r = self.client.post("/api/auth/password-reset/", {"email": "nobody@test.com"}, format="json")
        self.assertEqual(r.status_code, 200)


# ─── Catalog ────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestCatalogFunctional(BaseAPITest):
    def test_category_list(self):
        self.create_category(name="Test Cat A")
        r = self.client.get("/api/categories/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(c["name"] == "Test Cat A" for c in r.data))

    def test_category_detail(self):
        cat = self.create_category(name="Detail Cat")
        r = self.client.get(f"/api/categories/{cat.slug}/")
        self.assertEqual(r.status_code, 200)

    def test_product_list_only_active(self):
        self.create_product(name="Active Product", is_active=True)
        self.create_product(name="Inactive Product", is_active=False)
        r = self.client.get("/api/products/")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("Active Product", names)
        self.assertNotIn("Inactive Product", names)

    def test_product_create_requires_approved_seller(self):
        self.authenticate()  # a buyer with no seller profile
        cat = self.create_category()
        r = self.client.post(
            "/api/products/",
            {"category": cat.id, "name": "New", "price": "10.00", "stock_quantity": 5},
            format="json",
        )
        self.assertEqual(r.status_code, 403)

    def test_product_create_success_for_approved_seller(self):
        seller = self.create_seller(status=SellerProfile.Status.APPROVED)
        self.authenticate(seller.user)
        cat = self.create_category()
        r = self.client.post(
            "/api/products/",
            {"category": cat.id, "name": "New Product", "price": "10.00", "stock_quantity": 5},
            format="json",
        )
        self.assertEqual(r.status_code, 201)

    def test_product_update_by_owner(self):
        seller = self.create_seller()
        product = self.create_product(seller=seller)
        self.authenticate(seller.user)
        r = self.client.patch(f"/api/products/{product.slug}/", {"price": "999.00"}, format="json")
        self.assertEqual(r.status_code, 200)
        product.refresh_from_db()
        self.assertEqual(product.price, Decimal("999.00"))

    def test_product_update_by_non_owner_rejected(self):
        product = self.create_product()
        self.authenticate()  # different user
        r = self.client.patch(f"/api/products/{product.slug}/", {"price": "1.00"}, format="json")
        self.assertEqual(r.status_code, 403)

    def test_mine_filter_includes_own_inactive_products(self):
        seller = self.create_seller()
        self.create_product(seller=seller, name="Mine Active", is_active=True)
        self.create_product(seller=seller, name="Mine Inactive", is_active=False)
        self.create_product(name="Someone Else's", is_active=True)  # different seller
        self.authenticate(seller.user)
        r = self.client.get("/api/products/?mine=true")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("Mine Active", names)
        self.assertIn("Mine Inactive", names)
        self.assertNotIn("Someone Else's", names)

        # is_active must actually be present in the list payload - the
        # dashboard's Deactivate/Activate button and its toggle target both
        # read this field, and silently missing it makes every click
        # re-activate instead of toggling.
        by_name = {p["name"]: p for p in r.data["results"]}
        self.assertTrue(by_name["Mine Active"]["is_active"])
        self.assertFalse(by_name["Mine Inactive"]["is_active"])

    def test_mine_filter_requires_seller_profile(self):
        self.authenticate()  # buyer, no seller profile
        r = self.client.get("/api/products/?mine=true")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["results"], [])

    def test_mine_filter_ignored_for_anonymous(self):
        self.create_product(name="Public Product", is_active=True)
        r = self.client.get("/api/products/?mine=true")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Public Product", [p["name"] for p in r.data["results"]])

    def test_filter_by_seller_slug(self):
        seller_a = self.create_seller()
        seller_b = self.create_seller()
        self.create_product(seller=seller_a, name="From A")
        self.create_product(seller=seller_b, name="From B")
        r = self.client.get(f"/api/products/?seller={seller_a.slug}")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("From A", names)
        self.assertNotIn("From B", names)

    def test_filter_by_price_range(self):
        self.create_product(name="Cheap", price=Decimal("10.00"))
        self.create_product(name="Mid", price=Decimal("50.00"))
        self.create_product(name="Pricey", price=Decimal("200.00"))
        r = self.client.get("/api/products/?min_price=20&max_price=100")
        names = [p["name"] for p in r.data["results"]]
        self.assertEqual(names, ["Mid"])

    def test_filter_in_stock_only(self):
        self.create_product(name="In Stock", stock_quantity=5)
        self.create_product(name="Sold Out", stock_quantity=0)
        r = self.client.get("/api/products/?in_stock=true")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("In Stock", names)
        self.assertNotIn("Sold Out", names)

    def test_default_browse_excludes_out_of_stock(self):
        self.create_product(name="Available", stock_quantity=5)
        self.create_product(name="Sold Out Browse", stock_quantity=0)
        r = self.client.get("/api/products/")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("Available", names)
        self.assertNotIn("Sold Out Browse", names)

    def test_search_still_surfaces_out_of_stock(self):
        self.create_product(name="Sold Out Searchable", stock_quantity=0)
        r = self.client.get("/api/products/?search=Sold Out Searchable")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("Sold Out Searchable", names)

    def test_mine_filter_includes_out_of_stock(self):
        seller = self.create_seller()
        self.create_product(seller=seller, name="Mine Sold Out", stock_quantity=0)
        self.authenticate(seller.user)
        r = self.client.get("/api/products/?mine=true")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("Mine Sold Out", names)

    def test_product_list_includes_rating_aggregate(self):
        from apps.reviews.models import Review

        product = self.create_product(name="Rated Product")
        buyer1 = self.create_user()
        buyer2 = self.create_user()
        _, _, item1 = self.create_order(buyer=buyer1, product=product)
        _, _, item2 = self.create_order(buyer=buyer2, product=product)
        Review.objects.create(product=product, buyer=buyer1, order_item=item1, rating=4)
        Review.objects.create(product=product, buyer=buyer2, order_item=item2, rating=2)

        r = self.client.get("/api/products/")
        rated = next(p for p in r.data["results"] if p["name"] == "Rated Product")
        self.assertEqual(rated["average_rating"], 3.0)
        self.assertEqual(rated["review_count"], 2)

    def test_product_with_no_reviews_has_null_rating(self):
        self.create_product(name="Unrated Product")
        r = self.client.get("/api/products/")
        unrated = next(p for p in r.data["results"] if p["name"] == "Unrated Product")
        self.assertIsNone(unrated["average_rating"])
        self.assertEqual(unrated["review_count"], 0)

    def test_owner_can_upload_and_list_and_delete_product_image(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        tiny_gif = SimpleUploadedFile(
            "test.gif", b"GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,"
                        b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )
        seller = self.create_seller()
        product = self.create_product(seller=seller)
        self.authenticate(seller.user)

        r = self.client.post(
            f"/api/products/{product.slug}/images/",
            {"image": tiny_gif, "is_primary": "true"},
            format="multipart",
        )
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.data["is_primary"])
        image_id = r.data["id"]

        # list is a plain array, not paginated - a product's images are a
        # small bounded set, same reasoning as CategoryListView.
        r = self.client.get(f"/api/products/{product.slug}/images/")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.data, list)
        self.assertEqual(len(r.data), 1)

        r = self.client.get("/api/products/?mine=true")
        self.assertIsNotNone(r.data["results"][0]["primary_image"])

        r = self.client.delete(f"/api/products/images/{image_id}/")
        self.assertEqual(r.status_code, 204)

    def test_bulk_discount_applies_to_owned_products_only(self):
        seller = self.create_seller()
        mine1 = self.create_product(seller=seller, price=Decimal("200.00"))
        mine2 = self.create_product(seller=seller, price=Decimal("100.00"))
        not_mine = self.create_product(price=Decimal("500.00"))
        self.authenticate(seller.user)

        r = self.client.post(
            "/api/products/bulk-discount/",
            {"product_ids": [mine1.id, mine2.id, not_mine.id], "discount_percent": 20},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["updated"], 2)

        mine1.refresh_from_db()
        not_mine.refresh_from_db()
        self.assertEqual(mine1.discount_percent, 20)
        self.assertEqual(str(mine1.sale_price), "160.00")
        self.assertIsNone(not_mine.discount_percent)

    def test_bulk_discount_clears_with_null(self):
        seller = self.create_seller()
        product = self.create_product(seller=seller, discount_percent=30)
        self.authenticate(seller.user)

        r = self.client.post(
            "/api/products/bulk-discount/",
            {"product_ids": [product.id], "discount_percent": None},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        product.refresh_from_db()
        self.assertIsNone(product.discount_percent)

    def test_bulk_discount_rejects_out_of_range_percent(self):
        seller = self.create_seller()
        product = self.create_product(seller=seller)
        self.authenticate(seller.user)

        r = self.client.post(
            "/api/products/bulk-discount/", {"product_ids": [product.id], "discount_percent": 150}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_bulk_discount_requires_approved_seller(self):
        self.authenticate()  # plain buyer, no seller profile
        product = self.create_product()
        r = self.client.post(
            "/api/products/bulk-discount/", {"product_ids": [product.id], "discount_percent": 10}, format="json"
        )
        self.assertEqual(r.status_code, 403)

    def test_on_sale_filter(self):
        self.create_product(name="On sale item", discount_percent=10)
        self.create_product(name="Full price item")
        r = self.client.get("/api/products/?on_sale=true")
        names = [p["name"] for p in r.data["results"]]
        self.assertIn("On sale item", names)
        self.assertNotIn("Full price item", names)

    def test_category_deals_only_lists_categories_with_live_discounts(self):
        electronics = self.create_category(name="Electronics")
        clothing = self.create_category(name="Clothing")
        no_deals = self.create_category(name="No Deals")
        self.create_product(category=electronics, discount_percent=10)
        self.create_product(category=electronics, discount_percent=40)
        self.create_product(category=clothing, discount_percent=20)
        self.create_product(category=no_deals)
        # Out of stock and inactive discounted products shouldn't count either.
        self.create_product(category=no_deals, discount_percent=50, stock_quantity=0)
        self.create_product(category=no_deals, discount_percent=50, is_active=False)

        r = self.client.get("/api/categories/deals/")
        by_slug = {c["slug"]: c for c in r.data}
        self.assertIn(electronics.slug, by_slug)
        self.assertIn(clothing.slug, by_slug)
        self.assertNotIn(no_deals.slug, by_slug)
        self.assertEqual(by_slug[electronics.slug]["deal_count"], 2)
        self.assertEqual(by_slug[electronics.slug]["max_discount_percent"], 40)


# ─── Sellers ────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestSellerFunctional(BaseAPITest):
    def test_apply_success(self):
        self.authenticate()
        r = self.client.post("/api/sellers/apply/", {"store_name": "My Store"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["status"], "pending")

    def test_apply_twice_rejected(self):
        user = self.create_user()
        self.create_seller(user=user)
        self.authenticate(user)
        r = self.client.post("/api/sellers/apply/", {"store_name": "Second Store"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_my_profile_requires_auth(self):
        r = self.client.get("/api/sellers/me/")
        self.assertEqual(r.status_code, 401)

    def test_my_profile_404_without_application(self):
        self.authenticate()
        r = self.client.get("/api/sellers/me/")
        self.assertEqual(r.status_code, 404)

    def test_public_detail_hides_pending_sellers(self):
        seller = self.create_seller(status=SellerProfile.Status.PENDING)
        r = self.client.get(f"/api/sellers/{seller.slug}/")
        self.assertEqual(r.status_code, 404)

    def test_public_detail_shows_approved_sellers(self):
        seller = self.create_seller(status=SellerProfile.Status.APPROVED)
        r = self.client.get(f"/api/sellers/{seller.slug}/")
        self.assertEqual(r.status_code, 200)

    def test_approval_flips_user_role(self):
        seller = self.create_seller(status=SellerProfile.Status.PENDING)
        self.assertEqual(seller.user.role, "buyer")
        seller.status = SellerProfile.Status.APPROVED
        seller.save()
        seller.user.refresh_from_db()
        self.assertEqual(seller.user.role, "seller")


# ─── Cart ───────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestCartFunctional(BaseAPITest):
    def test_cart_requires_auth(self):
        r = self.client.get("/api/cart/")
        self.assertEqual(r.status_code, 401)

    def test_empty_cart_auto_created(self):
        self.authenticate()
        r = self.client.get("/api/cart/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["items"], [])
        self.assertEqual(r.data["total"], "0.00")

    def test_add_item(self):
        self.authenticate()
        product = self.create_product(price=Decimal("50.00"), stock_quantity=5)
        r = self.client.post("/api/cart/items/", {"product": product.id, "quantity": 2}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["line_total"], "100.00")

    def test_add_item_prices_at_discount(self):
        # unit_price/line_total must reflect the seller's active discount,
        # not the list price - otherwise the sale shown on the product
        # page silently doesn't apply at checkout.
        self.authenticate()
        product = self.create_product(price=Decimal("200.00"), stock_quantity=5, discount_percent=25)
        r = self.client.post("/api/cart/items/", {"product": product.id, "quantity": 2}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["unit_price"], "150.00")
        self.assertEqual(r.data["line_total"], "300.00")
        self.assertEqual(r.data["list_price"], "200.00")
        self.assertEqual(r.data["discount_percent"], 25)
        self.assertEqual(r.data["savings"], "100.00")

    def test_cart_total_savings_sums_discounted_lines(self):
        user = self.authenticate()
        discounted = self.create_product(price=Decimal("200.00"), stock_quantity=5, discount_percent=25)
        full_price = self.create_product(price=Decimal("50.00"), stock_quantity=5)
        self.add_to_cart(user, discounted, quantity=2)
        self.add_to_cart(user, full_price, quantity=1)
        r = self.client.get("/api/cart/")
        self.assertEqual(r.data["total_savings"], "100.00")

    def test_add_item_over_stock_rejected(self):
        self.authenticate()
        product = self.create_product(stock_quantity=3)
        r = self.client.post("/api/cart/items/", {"product": product.id, "quantity": 10}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_add_item_twice_increments(self):
        user = self.authenticate()
        product = self.create_product(stock_quantity=10)
        self.client.post("/api/cart/items/", {"product": product.id, "quantity": 2}, format="json")
        r = self.client.post("/api/cart/items/", {"product": product.id, "quantity": 3}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["quantity"], 5)

    def test_update_item_quantity(self):
        user = self.authenticate()
        product = self.create_product(stock_quantity=10)
        item = self.add_to_cart(user, product, quantity=1)
        r = self.client.patch(f"/api/cart/items/{item.id}/", {"quantity": 4}, format="json")
        self.assertEqual(r.status_code, 200)

    def test_remove_item(self):
        user = self.authenticate()
        product = self.create_product()
        item = self.add_to_cart(user, product)
        r = self.client.delete(f"/api/cart/items/{item.id}/")
        self.assertEqual(r.status_code, 204)

    def test_clear_cart(self):
        user = self.authenticate()
        product = self.create_product()
        self.add_to_cart(user, product)
        r = self.client.delete("/api/cart/")
        self.assertEqual(r.status_code, 204)
        r2 = self.client.get("/api/cart/")
        self.assertEqual(r2.data["items"], [])


# ─── Orders ─────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestOrderFunctional(BaseAPITest):
    CHECKOUT_PAYLOAD = {
        "shipping_full_name": "Test Buyer",
        "shipping_phone": "9800000000",
        "shipping_address_line": "Test St",
        "shipping_city": "Kathmandu",
        "shipping_district": "Kathmandu",
        "shipping_province": "Bagmati",
        "payment_method": "cod",
    }

    def test_checkout_empty_cart_rejected(self):
        self.authenticate()
        r = self.client.post("/api/orders/checkout/", self.CHECKOUT_PAYLOAD, format="json")
        self.assertEqual(r.status_code, 400)

    def test_checkout_success(self):
        user = self.authenticate()
        product = self.create_product(price=Decimal("200.00"), stock_quantity=5)
        self.add_to_cart(user, product, quantity=2)
        r = self.client.post("/api/orders/checkout/", self.CHECKOUT_PAYLOAD, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["total_amount"], "400.00")
        product.refresh_from_db()
        self.assertEqual(product.stock_quantity, 3)

    def test_checkout_charges_discounted_price(self):
        user = self.authenticate()
        product = self.create_product(price=Decimal("200.00"), stock_quantity=5, discount_percent=25)
        self.add_to_cart(user, product, quantity=2)
        r = self.client.post("/api/orders/checkout/", self.CHECKOUT_PAYLOAD, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["total_amount"], "300.00")
        item = r.data["seller_orders"][0]["items"][0]
        self.assertEqual(item["unit_price"], "150.00")

    def test_order_list_scoped_to_buyer(self):
        user = self.authenticate()
        product = self.create_product(stock_quantity=5)
        self.add_to_cart(user, product)
        self.client.post("/api/orders/checkout/", self.CHECKOUT_PAYLOAD, format="json")
        r = self.client.get("/api/orders/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 1)

    def test_seller_order_list_requires_seller_role(self):
        self.authenticate()  # plain buyer
        r = self.client.get("/api/orders/seller/")
        self.assertEqual(r.status_code, 403)

    def test_seller_order_status_transition(self):
        seller = self.create_seller()
        _, seller_order, _ = self.create_order(product=self.create_product(seller=seller), status="pending")
        self.authenticate(seller.user)
        r = self.client.patch(f"/api/orders/seller/{seller_order.id}/", {"status": "confirmed"}, format="json")
        self.assertEqual(r.status_code, 200)

    def test_seller_order_illegal_transition_rejected(self):
        seller = self.create_seller()
        _, seller_order, _ = self.create_order(product=self.create_product(seller=seller), status="pending")
        self.authenticate(seller.user)
        r = self.client.patch(f"/api/orders/seller/{seller_order.id}/", {"status": "delivered"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_seller_order_list_filters_by_status(self):
        seller = self.create_seller()
        self.create_order(product=self.create_product(seller=seller), status="pending")
        self.create_order(product=self.create_product(seller=seller), status="delivered")
        self.authenticate(seller.user)
        r = self.client.get("/api/orders/seller/?status=pending")
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["results"][0]["status"], "pending")

    @patch("apps.orders.views.send_refund_email")
    def test_seller_can_refund_a_delivered_order(self, mock_send):
        seller = self.create_seller()
        _, seller_order, _ = self.create_order(product=self.create_product(seller=seller), status="delivered")
        self.authenticate(seller.user)
        r = self.client.patch(f"/api/orders/seller/{seller_order.id}/", {"status": "refunded"}, format="json")
        self.assertEqual(r.status_code, 200)
        mock_send.assert_called_once()

    def test_cannot_refund_a_non_delivered_order(self):
        seller = self.create_seller()
        _, seller_order, _ = self.create_order(product=self.create_product(seller=seller), status="pending")
        self.authenticate(seller.user)
        r = self.client.patch(f"/api/orders/seller/{seller_order.id}/", {"status": "refunded"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_refund_does_not_restore_stock(self):
        seller = self.create_seller()
        product = self.create_product(seller=seller, stock_quantity=5)
        _, seller_order, _ = self.create_order(product=product, quantity=2, status="delivered")
        self.authenticate(seller.user)
        self.client.patch(f"/api/orders/seller/{seller_order.id}/", {"status": "refunded"}, format="json")
        product.refresh_from_db()
        self.assertEqual(product.stock_quantity, 5)  # unchanged - refunds don't auto-restock


# ─── Reviews ────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestReviewFunctional(BaseAPITest):
    def test_review_create_requires_delivered_item(self):
        buyer = self.create_user()
        _, _, order_item = self.create_order(buyer=buyer, status="pending")
        self.authenticate(buyer)
        r = self.client.post("/api/reviews/", {"order_item": order_item.id, "rating": 5}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_review_create_success(self):
        buyer = self.create_user()
        _, _, order_item = self.create_order(buyer=buyer, status="delivered")
        self.authenticate(buyer)
        r = self.client.post(
            "/api/reviews/", {"order_item": order_item.id, "rating": 5, "comment": "Great!"}, format="json"
        )
        self.assertEqual(r.status_code, 201)

    def test_review_create_by_non_buyer_rejected(self):
        _, _, order_item = self.create_order(status="delivered")
        self.authenticate()  # different user
        r = self.client.post("/api/reviews/", {"order_item": order_item.id, "rating": 5}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_product_reviews_public(self):
        _, _, order_item = self.create_order(status="delivered")
        product = order_item.product
        self.authenticate(order_item.seller_order.order.buyer)
        self.client.post("/api/reviews/", {"order_item": order_item.id, "rating": 4}, format="json")
        self.client.force_authenticate(user=None)  # back to anonymous
        r = self.client.get(f"/api/products/{product.slug}/reviews/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)

    def test_reviewable_item_requires_auth(self):
        product = self.create_product()
        r = self.client.get(f"/api/products/{product.slug}/reviewable-item/")
        self.assertEqual(r.status_code, 401)

    def test_reviewable_item_null_when_nothing_delivered(self):
        buyer = self.create_user()
        _, _, order_item = self.create_order(buyer=buyer, status="pending")
        self.authenticate(buyer)
        r = self.client.get(f"/api/products/{order_item.product.slug}/reviewable-item/")
        self.assertEqual(r.status_code, 200)
        self.assertIsNone(r.data["order_item_id"])

    def test_reviewable_item_returns_id_for_delivered_unreviewed_purchase(self):
        buyer = self.create_user()
        _, _, order_item = self.create_order(buyer=buyer, status="delivered")
        self.authenticate(buyer)
        r = self.client.get(f"/api/products/{order_item.product.slug}/reviewable-item/")
        self.assertEqual(r.data["order_item_id"], order_item.id)

    def test_reviewable_item_null_after_review_submitted(self):
        buyer = self.create_user()
        _, _, order_item = self.create_order(buyer=buyer, status="delivered")
        self.authenticate(buyer)
        self.client.post("/api/reviews/", {"order_item": order_item.id, "rating": 5}, format="json")
        r = self.client.get(f"/api/products/{order_item.product.slug}/reviewable-item/")
        self.assertIsNone(r.data["order_item_id"])

    def _make_review(self, buyer):
        _, _, order_item = self.create_order(buyer=buyer, status="delivered")
        self.authenticate(buyer)
        r = self.client.post("/api/reviews/", {"order_item": order_item.id, "rating": 5}, format="json")
        return r.data["id"]

    def _tiny_gif(self, name="test.gif"):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile(
            name,
            b"GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,"
            b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )

    def test_author_can_upload_and_list_review_images(self):
        buyer = self.create_user()
        review_id = self._make_review(buyer)
        self.authenticate(buyer)

        r = self.client.post(f"/api/reviews/{review_id}/images/", {"image": self._tiny_gif()}, format="multipart")
        self.assertEqual(r.status_code, 201)

        r = self.client.get(f"/api/reviews/{review_id}/images/")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.data, list)
        self.assertEqual(len(r.data), 1)

    def test_review_image_upload_capped_at_two(self):
        buyer = self.create_user()
        review_id = self._make_review(buyer)
        self.authenticate(buyer)

        self.client.post(f"/api/reviews/{review_id}/images/", {"image": self._tiny_gif("a.gif")}, format="multipart")
        self.client.post(f"/api/reviews/{review_id}/images/", {"image": self._tiny_gif("b.gif")}, format="multipart")
        r = self.client.post(
            f"/api/reviews/{review_id}/images/", {"image": self._tiny_gif("c.gif")}, format="multipart"
        )
        self.assertEqual(r.status_code, 400)

    def test_review_image_upload_rejected_for_non_author(self):
        buyer = self.create_user()
        review_id = self._make_review(buyer)
        self.authenticate()  # a different user

        r = self.client.post(f"/api/reviews/{review_id}/images/", {"image": self._tiny_gif()}, format="multipart")
        self.assertEqual(r.status_code, 403)

    def test_author_can_delete_review_image(self):
        buyer = self.create_user()
        review_id = self._make_review(buyer)
        self.authenticate(buyer)
        r = self.client.post(f"/api/reviews/{review_id}/images/", {"image": self._tiny_gif()}, format="multipart")
        image_id = r.data["id"]

        r = self.client.delete(f"/api/reviews/images/{image_id}/")
        self.assertEqual(r.status_code, 204)


# ─── Wishlist ───────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestWishlistFunctional(BaseAPITest):
    def test_wishlist_requires_auth(self):
        r = self.client.get("/api/wishlist/")
        self.assertEqual(r.status_code, 401)

    def test_empty_wishlist(self):
        self.authenticate()
        r = self.client.get("/api/wishlist/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, [])

    def test_add_to_wishlist(self):
        self.authenticate()
        product = self.create_product()
        r = self.client.post("/api/wishlist/", {"product": product.id}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["product_detail"]["id"], product.id)

    def test_adding_same_product_twice_is_a_no_op(self):
        self.authenticate()
        product = self.create_product()
        self.client.post("/api/wishlist/", {"product": product.id}, format="json")
        r = self.client.post("/api/wishlist/", {"product": product.id}, format="json")
        self.assertEqual(r.status_code, 201)
        r2 = self.client.get("/api/wishlist/")
        self.assertEqual(len(r2.data), 1)

    def test_remove_from_wishlist(self):
        self.authenticate()
        product = self.create_product()
        r = self.client.post("/api/wishlist/", {"product": product.id}, format="json")
        item_id = r.data["id"]
        r = self.client.delete(f"/api/wishlist/{item_id}/")
        self.assertEqual(r.status_code, 204)
        r2 = self.client.get("/api/wishlist/")
        self.assertEqual(r2.data, [])


# ─── Stock alerts ───────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestStockAlertFunctional(BaseAPITest):
    def test_notify_me_requires_auth(self):
        product = self.create_product(stock_quantity=0)
        r = self.client.post(f"/api/products/{product.slug}/notify-me/")
        self.assertEqual(r.status_code, 401)

    def test_cannot_subscribe_to_in_stock_product(self):
        self.authenticate()
        product = self.create_product(stock_quantity=5)
        r = self.client.post(f"/api/products/{product.slug}/notify-me/")
        self.assertEqual(r.status_code, 400)

    def test_subscribe_and_check_status(self):
        self.authenticate()
        product = self.create_product(stock_quantity=0)
        r = self.client.post(f"/api/products/{product.slug}/notify-me/")
        self.assertEqual(r.status_code, 201)
        r2 = self.client.get(f"/api/products/{product.slug}/notify-me/")
        self.assertTrue(r2.data["subscribed"])

    def test_unsubscribe(self):
        self.authenticate()
        product = self.create_product(stock_quantity=0)
        self.client.post(f"/api/products/{product.slug}/notify-me/")
        r = self.client.delete(f"/api/products/{product.slug}/notify-me/")
        self.assertEqual(r.status_code, 204)
        r2 = self.client.get(f"/api/products/{product.slug}/notify-me/")
        self.assertFalse(r2.data["subscribed"])

    @patch("apps.catalog.views.notify_back_in_stock")
    def test_restock_triggers_notification(self, mock_notify):
        seller = self.create_seller()
        product = self.create_product(seller=seller, stock_quantity=0)
        self.authenticate()
        self.client.post(f"/api/products/{product.slug}/notify-me/")

        self.authenticate(seller.user)
        r = self.client.patch(f"/api/products/{product.slug}/", {"stock_quantity": 5}, format="json")
        self.assertEqual(r.status_code, 200)
        mock_notify.assert_called_once()

    @patch("apps.catalog.views.notify_back_in_stock")
    def test_restocking_an_already_in_stock_product_does_not_notify(self, mock_notify):
        seller = self.create_seller()
        product = self.create_product(seller=seller, stock_quantity=5)
        self.authenticate(seller.user)
        r = self.client.patch(f"/api/products/{product.slug}/", {"stock_quantity": 10}, format="json")
        self.assertEqual(r.status_code, 200)
        mock_notify.assert_not_called()


# ─── Banners ────────────────────────────────────────────────────────────────────

@override_settings(**TEST_SETTINGS)
class TestBannerFunctional(BaseAPITest):
    def _tiny_gif(self, name="banner.gif"):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile(
            name,
            b"GIF87a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,"
            b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )

    def test_banner_list_is_public_and_unpaginated(self):
        from apps.common.models import Banner

        Banner.objects.create(image=self._tiny_gif(), display_order=1)
        r = self.client.get("/api/banners/")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.data, list)
        self.assertEqual(len(r.data), 1)

    def test_inactive_banner_excluded(self):
        from apps.common.models import Banner

        Banner.objects.create(image=self._tiny_gif(), is_active=False)
        r = self.client.get("/api/banners/")
        self.assertEqual(r.data, [])

    def test_banners_ordered_by_display_order(self):
        from apps.common.models import Banner

        Banner.objects.create(image=self._tiny_gif("b.gif"), display_order=2)
        first = Banner.objects.create(image=self._tiny_gif("a.gif"), display_order=1)
        r = self.client.get("/api/banners/")
        self.assertEqual(r.data[0]["id"], first.id)

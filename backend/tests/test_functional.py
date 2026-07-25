"""
Functional Tests — verify every endpoint returns the correct HTTP status
code and payload shape for happy-path, auth-required, and common error
scenarios.
"""
from decimal import Decimal

from django.test import override_settings

from apps.sellers.models import SellerProfile

from .base import BaseAPITest, TEST_SETTINGS


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
        r = self.client.get(f"/api/products/?seller__slug={seller_a.slug}")
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
        self.assertEqual(r.data["count"], 1)

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

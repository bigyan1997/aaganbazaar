"""
End-to-End Tests — simulate complete user journeys through the real API,
exercising multiple endpoints in sequence exactly as a real client would.
"""
from decimal import Decimal

from django.test import override_settings

from apps.sellers.models import SellerProfile

from .base import BaseAPITest, TEST_SETTINGS

CHECKOUT_PAYLOAD = {
    "shipping_full_name": "Journey Buyer",
    "shipping_phone": "9800000099",
    "shipping_address_line": "Journey Street",
    "shipping_city": "Kathmandu",
    "shipping_district": "Kathmandu",
    "shipping_province": "Bagmati",
    "payment_method": "cod",
}


@override_settings(**TEST_SETTINGS)
class TestBuyerPurchaseJourney(BaseAPITest):
    """Register -> browse -> add to cart -> checkout -> view order ->
    seller fulfills it -> buyer leaves a review."""

    def test_full_purchase_journey(self):
        # 1. A seller already exists with a product on the shelf.
        seller = self.create_seller(status=SellerProfile.Status.APPROVED)
        category = self.create_category(name="Journey Category")
        self.authenticate(seller.user)
        r = self.client.post(
            "/api/products/",
            {"category": category.id, "name": "Journey Product", "price": "500.00", "stock_quantity": 3},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        product_slug = r.data["slug"]
        self.client.force_authenticate(user=None)

        # 2. A new buyer registers.
        r = self.client.post(
            "/api/auth/register/",
            {"email": "journey-buyer@test.com", "password": "JourneyPass1234", "password2": "JourneyPass1234",
             "first_name": "Journey", "last_name": "Buyer"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)

        # 3. Browses the catalog and finds the product.
        r = self.client.get("/api/products/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(p["slug"] == product_slug for p in r.data["results"]))

        # 4. Adds it to cart.
        r = self.client.get(f"/api/products/{product_slug}/")
        product_id = r.data["id"]
        r = self.client.post("/api/cart/items/", {"product": product_id, "quantity": 2}, format="json")
        self.assertEqual(r.status_code, 201)

        # 5. Checks out.
        r = self.client.post("/api/orders/checkout/", CHECKOUT_PAYLOAD, format="json")
        self.assertEqual(r.status_code, 201)
        order_number = r.data["order_number"]
        seller_order_id = r.data["seller_orders"][0]["id"]
        order_item_id = r.data["seller_orders"][0]["items"][0]["id"]
        self.assertEqual(r.data["total_amount"], "1000.00")

        # 6. Views their order.
        r = self.client.get(f"/api/orders/{order_number}/")
        self.assertEqual(r.status_code, 200)

        # 7. The seller confirms, ships, and delivers it.
        self.client.force_authenticate(user=seller.user)
        for status_value in ("confirmed", "shipped", "delivered"):
            r = self.client.patch(f"/api/orders/seller/{seller_order_id}/", {"status": status_value}, format="json")
            self.assertEqual(r.status_code, 200, r.data)

        # 8. Buyer leaves a review once delivered.
        self.client.force_authenticate(user=None)
        self.client.post("/api/auth/login/", {"email": "journey-buyer@test.com", "password": "JourneyPass1234"},
                          format="json")
        r = self.client.post(
            "/api/reviews/", {"order_item": order_item_id, "rating": 5, "comment": "Loved it!"}, format="json"
        )
        self.assertEqual(r.status_code, 201, r.data)

        # 9. The review shows up publicly on the product.
        self.client.force_authenticate(user=None)
        r = self.client.get(f"/api/products/{product_slug}/reviews/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 1)

        # 10. Stock reflects the purchase.
        r = self.client.get(f"/api/products/{product_slug}/")
        self.assertEqual(r.data["stock_quantity"], 1)


@override_settings(**TEST_SETTINGS)
class TestSellerOnboardingJourney(BaseAPITest):
    """Register as buyer -> apply to sell -> blocked until approved ->
    admin approves -> can now list and sell a product."""

    def test_full_onboarding_journey(self):
        # 1. Register as a plain buyer.
        r = self.client.post(
            "/api/auth/register/",
            {"email": "journey-seller@test.com", "password": "SellerPass1234", "password2": "SellerPass1234",
             "first_name": "Journey", "last_name": "Seller"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["role"], "buyer")

        # 2. Applies to sell.
        r = self.client.post("/api/sellers/apply/", {"store_name": "Journey Store"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["status"], "pending")

        # 3. Blocked from creating products while pending.
        category = self.create_category()
        r = self.client.post(
            "/api/products/", {"category": category.id, "name": "Too Early", "price": "10.00", "stock_quantity": 1},
            format="json",
        )
        self.assertEqual(r.status_code, 403)

        # 4. Admin approves (via the model directly, standing in for the
        # admin panel - there's no public "approve" API endpoint by design).
        profile = SellerProfile.objects.get(store_name="Journey Store")
        profile.status = SellerProfile.Status.APPROVED
        profile.save()

        # 5. Now able to list a product immediately, no re-login needed
        # (role is read fresh from the DB per request, not baked into the JWT).
        r = self.client.post(
            "/api/products/",
            {"category": category.id, "name": "First Product", "price": "250.00", "stock_quantity": 10},
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.data)

        # 6. Product is publicly visible.
        self.client.force_authenticate(user=None)
        r = self.client.get(f"/api/products/{profile.products.first().slug}/")
        self.assertEqual(r.status_code, 200)

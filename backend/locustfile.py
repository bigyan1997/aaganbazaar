"""
Load & Stress Testing with Locust
==================================
First seed data (once, against the target DB):
    python manage.py seed_load_test_data

Install:        pip install locust
Load test:      locust -f locustfile.py --host=http://127.0.0.1:8000 --users=50 --spawn-rate=5
Stress test:    locust -f locustfile.py --host=http://127.0.0.1:8000 --users=300 --spawn-rate=30
Headless:       locust -f locustfile.py --headless --host=http://127.0.0.1:8000 \
                        --users=50 --spawn-rate=5 --run-time=60s --html=report.html

Locust's HttpUser client behaves like a browser session - cookies (our
auth mechanism) are stored and resent automatically per simulated user,
no manual token handling needed.

Three user types:
  - AnonymousBrowser : unauthenticated catalog browsing (70% of load)
  - AuthenticatedShopper : registers, carts, checks out (25% of load)
  - ApprovedSeller   : logs in as the seeded load-test seller, lists
                       products and checks their order queue (5% of load)
"""
import random
import string

from locust import HttpUser, between, task

STATES = ["Bagmati", "Gandaki", "Koshi", "Lumbini", "Madhesh"]

LOAD_TEST_SELLER_EMAIL = "loadtest-seller@aaganbazaar.local"
LOAD_TEST_SELLER_PASSWORD = "LoadTestSeller1234"


def _rand_str(n=8):
    return "".join(random.choices(string.ascii_lowercase, k=n))


def _rand_email():
    return f"load_{_rand_str(10)}@test.aaganbazaar.local"


# ─── Anonymous Browser (read-only) ──────────────────────────────────────────────

class AnonymousBrowser(HttpUser):
    """Simulates a visitor browsing the catalog without logging in."""

    wait_time = between(1, 3)
    weight = 70

    @task(5)
    def browse_products(self):
        self.client.get("/api/products/", name="/api/products/")

    @task(3)
    def browse_categories(self):
        self.client.get("/api/categories/", name="/api/categories/")

    @task(2)
    def search_products(self):
        terms = ["product", "electronics", "test", "phone"]
        self.client.get(f"/api/products/?search={random.choice(terms)}", name="/api/products/?search=X")

    @task(1)
    def paginate_products(self):
        page = random.randint(1, 3)
        self.client.get(f"/api/products/?page={page}", name="/api/products/?page=N")


# ─── Authenticated Shopper ───────────────────────────────────────────────────────

class AuthenticatedShopper(HttpUser):
    """Registers once, then browses/carts/checks out like a real buyer."""

    wait_time = between(2, 5)
    weight = 25

    def on_start(self):
        self.email = _rand_email()
        r = self.client.post(
            "/api/auth/register/",
            json={
                "email": self.email, "password": "LoadTestShopper1234", "password2": "LoadTestShopper1234",
                "first_name": "Load", "last_name": "Shopper",
            },
            name="/api/auth/register/ [setup]",
        )
        self.registered = r.status_code == 201

    @task(4)
    def view_me(self):
        if self.registered:
            self.client.get("/api/auth/me/", name="/api/auth/me/")

    @task(4)
    def browse_products(self):
        self.client.get("/api/products/", name="/api/products/")

    @task(3)
    def view_cart(self):
        if self.registered:
            self.client.get("/api/cart/", name="/api/cart/")

    @task(2)
    def add_to_cart(self):
        if not self.registered:
            return
        r = self.client.get("/api/products/", name="/api/products/ [for cart]")
        if r.status_code == 200 and r.json().get("results"):
            product = random.choice(r.json()["results"])
            self.client.post(
                "/api/cart/items/", json={"product": product["id"], "quantity": 1}, name="/api/cart/items/ [POST]"
            )

    @task(1)
    def view_orders(self):
        if self.registered:
            self.client.get("/api/orders/", name="/api/orders/")

    @task(1)
    def checkout(self):
        if not self.registered:
            return
        self.client.post(
            "/api/orders/checkout/",
            json={
                "shipping_full_name": "Load Test", "shipping_phone": "9800000000",
                "shipping_address_line": "Test Street", "shipping_city": "Kathmandu",
                "shipping_district": "Kathmandu", "shipping_province": random.choice(STATES),
                "payment_method": "cod",
            },
            name="/api/orders/checkout/",
        )


# ─── Approved Seller (write-heavy) ───────────────────────────────────────────────

class ApprovedSeller(HttpUser):
    """Logs in as the pre-seeded, pre-approved load-test seller (approval
    isn't self-service, so this account must exist beforehand - run
    `python manage.py seed_load_test_data` before starting this test)."""

    wait_time = between(2, 5)
    weight = 5

    def on_start(self):
        r = self.client.post(
            "/api/auth/login/",
            json={"email": LOAD_TEST_SELLER_EMAIL, "password": LOAD_TEST_SELLER_PASSWORD},
            name="/api/auth/login/ [setup]",
        )
        self.logged_in = r.status_code == 200
        cat_r = self.client.get("/api/categories/", name="/api/categories/ [setup]")
        self.category_id = cat_r.json()[0]["id"] if cat_r.status_code == 200 and cat_r.json() else None

    @task(3)
    def view_own_orders(self):
        if self.logged_in:
            self.client.get("/api/orders/seller/", name="/api/orders/seller/")

    @task(2)
    def create_product(self):
        if not (self.logged_in and self.category_id):
            return
        self.client.post(
            "/api/products/",
            json={
                "category": self.category_id, "name": f"Seller Load Product {_rand_str(6)}",
                "price": str(random.randint(50, 500)), "stock_quantity": random.randint(1, 50),
            },
            name="/api/products/ [POST]",
        )

    @task(1)
    def view_products_list(self):
        self.client.get("/api/products/", name="/api/products/")


# ─── Stress Test Shape ─────────────────────────────────────────────────────────
# To run a ramp-up stress test from CLI:
#
#   locust -f locustfile.py --headless \
#     --host=http://127.0.0.1:8000 \
#     --users=300 --spawn-rate=30 --run-time=120s \
#     --html=stress_report.html
#
# Thresholds to watch:
#   - p95 response time < 500ms for read endpoints (products/categories)
#   - p95 response time < 1500ms for write endpoints (checkout, product create)
#   - Error rate < 1% under 150 concurrent users

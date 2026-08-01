from decimal import Decimal

import requests
from django.conf import settings
from django.db import transaction
from django.shortcuts import redirect
from django.urls import reverse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsSeller
from apps.cart.models import Cart
from apps.catalog.models import Product

from . import esewa
from .emails import send_new_order_email, send_refund_email
from .models import Order, OrderItem, SellerOrder
from .serializers import CheckoutSerializer, OrderSerializer, SellerOrderSerializer, SellerOrderUpdateSerializer


class CheckoutView(APIView):
    """POST /api/orders/checkout/ - turns the buyer's cart into an Order,
    split per-seller into SellerOrder + OrderItem rows, then empties the
    cart. Product rows are row-locked for the duration of the transaction
    so two concurrent checkouts can't both oversell the same stock."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shipping_and_payment = serializer.validated_data

        cart = Cart.objects.filter(user=request.user).first()
        items = list(cart.items.select_related("product", "product__seller")) if cart else []
        if not items:
            raise ValidationError("Your cart is empty.")

        with transaction.atomic():
            product_ids = [i.product_id for i in items]
            locked_products = {
                p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            for item in items:
                product = locked_products[item.product_id]
                if not product.is_active:
                    raise ValidationError(f'"{product.name}" is no longer available.')
                if product.stock_quantity < item.quantity:
                    raise ValidationError(
                        f'Not enough stock for "{product.name}" (only {product.stock_quantity} left).'
                    )

            total_amount = sum(
                (locked_products[i.product_id].effective_price * i.quantity for i in items), Decimal("0.00")
            )
            order = Order.objects.create(buyer=request.user, total_amount=total_amount, **shipping_and_payment)

            by_seller = {}
            for item in items:
                by_seller.setdefault(item.product.seller_id, []).append(item)

            for seller_items in by_seller.values():
                seller = seller_items[0].product.seller
                subtotal = sum(
                    (locked_products[i.product_id].effective_price * i.quantity for i in seller_items),
                    Decimal("0.00"),
                )
                seller_order = SellerOrder.objects.create(
                    order=order,
                    seller=seller,
                    commission_rate=seller.effective_commission_rate,
                    subtotal=subtotal,
                )
                for item in seller_items:
                    product = locked_products[item.product_id]
                    OrderItem.objects.create(
                        seller_order=seller_order,
                        product=product,
                        product_name=product.name,
                        unit_price=product.effective_price,
                        quantity=item.quantity,
                    )
                    product.stock_quantity -= item.quantity
                    product.save(update_fields=["stock_quantity"])

                # Deferred until the transaction actually commits - a
                # checkout that rolls back (e.g. a concurrent stock race
                # loses) must not notify a seller about an order that
                # never really happened.
                transaction.on_commit(lambda so=seller_order: send_new_order_email(so))

            cart.items.all().delete()

        data = OrderSerializer(order).data
        if order.payment_method == Order.PaymentMethod.ESEWA:
            callback_url = request.build_absolute_uri(reverse("esewa-callback"))
            data["esewa_payment"] = esewa.build_payment_form(order, callback_url, callback_url)
        return Response(data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    """GET /api/orders/ - the buyer's own orders."""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("seller_orders__items")


class OrderDetailView(generics.RetrieveAPIView):
    """GET /api/orders/<order_number>/"""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_number"

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).prefetch_related("seller_orders__items")


class SellerOrderListView(generics.ListAPIView):
    """GET /api/orders/seller/ - orders containing this seller's products.
    ?status=pending etc. lets the dashboard show a pending-orders count
    without paging through everything."""

    serializer_class = SellerOrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]

    def get_queryset(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if profile is None:
            return SellerOrder.objects.none()
        return SellerOrder.objects.filter(seller=profile).prefetch_related("items")


class SellerOrderUpdateView(generics.UpdateAPIView):
    """PATCH /api/orders/seller/<id>/ - seller updates status/tracking_number."""

    serializer_class = SellerOrderUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get_queryset(self):
        profile = getattr(self.request.user, "seller_profile", None)
        return SellerOrder.objects.filter(seller=profile) if profile else SellerOrder.objects.none()

    def perform_update(self, serializer):
        was_refunded = serializer.instance.status == SellerOrder.Status.REFUNDED
        seller_order = serializer.save()
        if seller_order.status == SellerOrder.Status.REFUNDED and not was_refunded:
            send_refund_email(seller_order)


class EsewaCallbackView(APIView):
    """GET /api/orders/esewa/callback/?data=<base64> - eSewa redirects the
    buyer's browser here after they approve or decline payment, regardless
    of outcome (used as both success_url and failure_url). Always ends in
    a redirect back to the frontend order page - this is a browser
    navigation, not an API call a frontend would read a JSON body from."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        payload = esewa.decode_callback_payload(request.query_params.get("data", ""))
        if not payload or not esewa.signature_is_valid(payload):
            return redirect(f"{settings.FRONTEND_URL}/orders?payment=error")

        order = Order.objects.filter(
            order_number=payload.get("transaction_uuid"), payment_method=Order.PaymentMethod.ESEWA
        ).first()
        if order is None:
            return redirect(f"{settings.FRONTEND_URL}/orders?payment=error")

        # The signed redirect payload is a strong signal but still
        # buyer-browser-controlled - confirm independently with eSewa
        # before trusting it, using our own order.total_amount rather
        # than anything from the payload.
        try:
            gateway_status = esewa.fetch_gateway_status(order)
        except requests.RequestException:
            return redirect(f"{settings.FRONTEND_URL}/orders/{order.order_number}?payment=pending")

        if gateway_status != "COMPLETE":
            return redirect(f"{settings.FRONTEND_URL}/orders/{order.order_number}?payment=failed")

        if order.payment_status != Order.PaymentStatus.PAID:
            order.payment_status = Order.PaymentStatus.PAID
            order.save(update_fields=["payment_status"])
        return redirect(f"{settings.FRONTEND_URL}/orders/{order.order_number}?payment=success")

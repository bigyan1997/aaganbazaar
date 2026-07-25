from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import OrderItem, SellerOrder

from .models import Review
from .serializers import ReviewSerializer


class ProductReviewListView(generics.ListAPIView):
    """GET /api/products/<slug>/reviews/"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Review.objects.filter(product__slug=self.kwargs["product_slug"]).select_related("buyer")


class ReviewableOrderItemView(APIView):
    """GET /api/products/<slug>/reviewable-item/ - tells the buyer's own
    product page whether they have a delivered, not-yet-reviewed purchase
    of this product to review, and which order_item to attach it to. The
    review form has nowhere else obvious to live - burying it in order
    history is how a shopper never finds it."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, product_slug):
        item = (
            OrderItem.objects.filter(
                product__slug=product_slug,
                seller_order__order__buyer=request.user,
                seller_order__status=SellerOrder.Status.DELIVERED,
                review__isnull=True,
            )
            .order_by("-id")
            .first()
        )
        return Response({"order_item_id": item.id if item else None})


class ReviewCreateView(generics.CreateAPIView):
    """POST /api/reviews/"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PATCH/DELETE /api/reviews/<id>/ - author only."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(buyer=self.request.user)

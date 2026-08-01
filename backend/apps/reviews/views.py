from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import OrderItem, SellerOrder

from .models import Review, ReviewImage
from .serializers import MyReviewSerializer, ReviewImageSerializer, ReviewSerializer


class ProductReviewListView(generics.ListAPIView):
    """GET /api/products/<slug>/reviews/"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

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


class ReviewListCreateView(generics.ListCreateAPIView):
    """GET /api/reviews/ - the current buyer's own reviews (never anyone
    else's - product pages use ProductReviewListView for the public,
    per-product list). POST /api/reviews/ - create."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return MyReviewSerializer if self.request.method == "GET" else ReviewSerializer

    def get_queryset(self):
        return (
            Review.objects.filter(buyer=self.request.user)
            .select_related("product")
            .prefetch_related("product__images", "images")
        )


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PATCH/DELETE /api/reviews/<id>/ - author only."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(buyer=self.request.user)


class ReviewImageListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/reviews/<review_id>/images/ - author only, capped at
    ReviewImage.MAX_PER_REVIEW so a review can't turn into an image dump."""

    serializer_class = ReviewImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None

    def _get_review(self):
        review = get_object_or_404(Review, pk=self.kwargs["review_id"])
        if review.buyer_id != self.request.user.id:
            raise PermissionDenied("You do not own this review.")
        return review

    def get_queryset(self):
        return ReviewImage.objects.filter(review=self._get_review())

    def perform_create(self, serializer):
        review = self._get_review()
        if review.images.count() >= ReviewImage.MAX_PER_REVIEW:
            raise ValidationError(f"A review can have at most {ReviewImage.MAX_PER_REVIEW} photos.")
        serializer.save(review=review)


class ReviewImageDeleteView(generics.DestroyAPIView):
    serializer_class = ReviewImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ReviewImage.objects.filter(review__buyer=self.request.user)

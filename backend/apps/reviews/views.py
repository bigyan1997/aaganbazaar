from rest_framework import generics, permissions

from .models import Review
from .serializers import ReviewSerializer


class ProductReviewListView(generics.ListAPIView):
    """GET /api/products/<slug>/reviews/"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Review.objects.filter(product__slug=self.kwargs["product_slug"]).select_related("buyer")


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

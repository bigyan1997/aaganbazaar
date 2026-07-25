from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/wishlist/ - a buyer's own saved products. Unbounded
    pagination would be overkill for a per-user list this small."""

    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return (
            WishlistItem.objects.filter(user=self.request.user)
            .select_related("product__seller", "product__category")
            .prefetch_related("product__images")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        # Saving twice is a no-op, not an error - a buyer re-clicking an
        # already-saved heart icon shouldn't see a 400.
        item, _ = WishlistItem.objects.get_or_create(user=request.user, product=product)
        return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)


class WishlistItemDetailView(generics.DestroyAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)

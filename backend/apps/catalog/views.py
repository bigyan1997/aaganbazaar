from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend

from apps.sellers.models import SellerProfile

from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
)


def _require_approved_seller(user):
    profile = getattr(user, "seller_profile", None)
    if profile is None or profile.status != SellerProfile.Status.APPROVED:
        raise PermissionDenied("You must be an approved seller to do this.")
    return profile


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # small, fixed reference list - no page wrapper needed


class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class ProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category__slug"]
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at"]

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("seller", "category")
            .prefetch_related("images")
        )

    def get_serializer_class(self):
        return ProductWriteSerializer if self.request.method == "POST" else ProductListSerializer

    def perform_create(self, serializer):
        profile = _require_approved_seller(self.request.user)
        serializer.save(seller=profile)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Product.objects.select_related("seller", "category").prefetch_related("images")

    def get_serializer_class(self):
        return ProductWriteSerializer if self.request.method in ("PUT", "PATCH") else ProductDetailSerializer

    def get_object(self):
        obj = super().get_object()
        is_owner = obj.seller.user_id == self.request.user.id if self.request.user.is_authenticated else False
        if self.request.method == "GET":
            if not obj.is_active and not is_owner:
                from django.http import Http404

                raise Http404
        elif not is_owner:
            self.permission_denied(self.request, message="You do not own this product.")
        return obj


class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_product(self):
        product = get_object_or_404(Product, slug=self.kwargs["product_slug"])
        if product.seller.user_id != self.request.user.id:
            raise PermissionDenied("You do not own this product.")
        return product

    def get_queryset(self):
        return ProductImage.objects.filter(product=self._get_product())

    def perform_create(self, serializer):
        serializer.save(product=self._get_product())


class ProductImageDeleteView(generics.DestroyAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProductImage.objects.filter(product__seller__user=self.request.user)

from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.sellers.models import SellerProfile

from .emails import notify_back_in_stock
from .filters import ProductFilter
from .models import Category, Product, ProductImage, StockAlert
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


def _with_rating_annotations(queryset):
    # distinct=True on Count guards against row duplication if this
    # queryset ever picks up another to-many join alongside reviews.
    # The aggregate annotation drops Product's default `-created_at`
    # ordering (Django can't guarantee it survives an implicit GROUP BY),
    # so it's reasserted explicitly - otherwise pagination over this
    # queryset isn't guaranteed stable across pages. ?ordering=price still
    # overrides this later via OrderingFilter, which always wins.
    return queryset.annotate(
        average_rating=Avg("reviews__rating"), review_count=Count("reviews", distinct=True)
    ).order_by("-created_at")


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
    filterset_class = ProductFilter
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at", "discount_percent"]

    def get_queryset(self):
        base = _with_rating_annotations(
            Product.objects.select_related("seller", "category").prefetch_related("images")
        )
        # ?mine=true - a seller's own dashboard listing, including their
        # inactive products. Everyone else only ever sees active products;
        # this never exposes other sellers' inactive listings.
        if self.request.query_params.get("mine") == "true" and self.request.user.is_authenticated:
            profile = getattr(self.request.user, "seller_profile", None)
            return base.filter(seller=profile) if profile else base.none()
        return base.filter(is_active=True)

    def get_serializer_class(self):
        return ProductWriteSerializer if self.request.method == "POST" else ProductListSerializer

    def perform_create(self, serializer):
        profile = _require_approved_seller(self.request.user)
        serializer.save(seller=profile)


class ProductBulkDiscountView(APIView):
    """POST /api/products/bulk-discount/ - a seller selects several of
    their own listings and applies (or clears, with discount_percent=null)
    a percent-off discount to all of them in one action. Silently ignores
    any id in the list that isn't one of the seller's own products, rather
    than rejecting the whole batch."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = _require_approved_seller(request.user)
        product_ids = request.data.get("product_ids")
        if not isinstance(product_ids, list) or not product_ids:
            raise ValidationError("product_ids must be a non-empty list.")

        discount_percent = request.data.get("discount_percent")
        if discount_percent is not None and (
            not isinstance(discount_percent, int) or not (1 <= discount_percent <= 99)
        ):
            raise ValidationError("discount_percent must be an integer between 1 and 99, or null to clear it.")

        updated = Product.objects.filter(id__in=product_ids, seller=profile).update(
            discount_percent=discount_percent
        )
        return Response({"updated": updated})


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = _with_rating_annotations(
        Product.objects.select_related("seller", "category").prefetch_related("images")
    )

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

    def perform_update(self, serializer):
        # Captured before serializer.save() mutates the in-memory instance -
        # at this point it still reflects the row as last fetched from the DB.
        was_out_of_stock = not serializer.instance.in_stock
        product = serializer.save()
        if was_out_of_stock and product.in_stock:
            notify_back_in_stock(product)


class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None  # a product's own image set is small and bounded - no page wrapper needed

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


class StockAlertView(APIView):
    """GET/POST/DELETE /api/products/<slug>/notify-me/ - a buyer's "email
    me when this is back in stock" subscription for one product."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_product(self):
        return get_object_or_404(Product, slug=self.kwargs["product_slug"], is_active=True)

    def get(self, request, product_slug):
        product = self._get_product()
        subscribed = StockAlert.objects.filter(user=request.user, product=product).exists()
        return Response({"subscribed": subscribed})

    def post(self, request, product_slug):
        product = self._get_product()
        if product.in_stock:
            raise ValidationError("This product is already in stock.")
        StockAlert.objects.get_or_create(user=request.user, product=product)
        return Response({"subscribed": True}, status=status.HTTP_201_CREATED)

    def delete(self, request, product_slug):
        product = self._get_product()
        StockAlert.objects.filter(user=request.user, product=product).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

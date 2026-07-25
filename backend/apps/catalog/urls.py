from django.urls import path

from apps.reviews.views import ProductReviewListView, ReviewableOrderItemView

from . import views

urlpatterns = [
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("categories/<slug:slug>/", views.CategoryDetailView.as_view(), name="category-detail"),
    path("products/", views.ProductListCreateView.as_view(), name="product-list"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product-detail"),
    path(
        "products/<slug:product_slug>/images/",
        views.ProductImageListCreateView.as_view(),
        name="product-image-list",
    ),
    path("products/images/<int:pk>/", views.ProductImageDeleteView.as_view(), name="product-image-detail"),
    path(
        "products/<slug:product_slug>/reviews/",
        ProductReviewListView.as_view(),
        name="product-review-list",
    ),
    path(
        "products/<slug:product_slug>/reviewable-item/",
        ReviewableOrderItemView.as_view(),
        name="product-reviewable-item",
    ),
]

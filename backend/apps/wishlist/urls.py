from django.urls import path

from . import views

urlpatterns = [
    path("", views.WishlistListCreateView.as_view(), name="wishlist-list"),
    path("<int:pk>/", views.WishlistItemDetailView.as_view(), name="wishlist-detail"),
]

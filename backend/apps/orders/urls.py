from django.urls import path

from . import views

urlpatterns = [
    path("checkout/", views.CheckoutView.as_view(), name="checkout"),
    path("seller/", views.SellerOrderListView.as_view(), name="seller-order-list"),
    path("seller/<int:pk>/", views.SellerOrderUpdateView.as_view(), name="seller-order-update"),
    path("<str:order_number>/", views.OrderDetailView.as_view(), name="order-detail"),
    path("", views.OrderListView.as_view(), name="order-list"),
]

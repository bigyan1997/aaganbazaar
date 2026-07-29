from django.urls import path

from . import views

urlpatterns = [
    path("", views.SellerListView.as_view(), name="seller-list"),
    path("apply/", views.SellerApplyView.as_view(), name="seller-apply"),
    path("me/", views.MySellerProfileView.as_view(), name="seller-me"),
    path("<slug:slug>/", views.SellerPublicDetailView.as_view(), name="seller-public-detail"),
]

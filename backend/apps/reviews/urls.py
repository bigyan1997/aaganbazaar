from django.urls import path

from . import views

urlpatterns = [
    path("", views.ReviewCreateView.as_view(), name="review-create"),
    path("<int:pk>/", views.ReviewDetailView.as_view(), name="review-detail"),
]

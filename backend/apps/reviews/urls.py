from django.urls import path

from . import views

urlpatterns = [
    path("", views.ReviewListCreateView.as_view(), name="review-list-create"),
    path("<int:pk>/", views.ReviewDetailView.as_view(), name="review-detail"),
    path("<int:review_id>/images/", views.ReviewImageListCreateView.as_view(), name="review-image-list"),
    path("images/<int:pk>/", views.ReviewImageDeleteView.as_view(), name="review-image-detail"),
]

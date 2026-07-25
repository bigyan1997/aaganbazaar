from django.http import Http404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SellerProfile
from .serializers import SellerApplicationSerializer, SellerPublicSerializer


class SellerApplyView(APIView):
    """POST /api/sellers/apply/ - a buyer applies to become a seller. This
    is a deliberate, separate action rather than a signup checkbox - see
    the Role docstring on accounts.User."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, "seller_profile"):
            raise ValidationError("You already have a seller application on file.")
        serializer = SellerApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MySellerProfileView(generics.RetrieveAPIView):
    """GET /api/sellers/me/"""

    serializer_class = SellerApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if profile is None:
            raise Http404
        return profile


class SellerPublicDetailView(generics.RetrieveAPIView):
    """GET /api/sellers/<slug>/ - public storefront info, approved sellers only."""

    queryset = SellerProfile.objects.filter(status=SellerProfile.Status.APPROVED)
    serializer_class = SellerPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

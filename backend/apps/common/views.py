from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Banner
from .serializers import BannerSerializer


class HealthCheckView(APIView):
    """GET /api/health/ - unauthenticated liveness check for uptime monitors
    and the Railway deploy healthcheck."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class BannerListView(generics.ListAPIView):
    """GET /api/banners/ - active homepage banners, admin-managed."""

    queryset = Banner.objects.filter(is_active=True)
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]
    pagination_class = None

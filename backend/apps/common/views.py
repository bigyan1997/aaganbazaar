from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """GET /api/health/ - unauthenticated liveness check for uptime monitors
    and the Railway deploy healthcheck."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        return Response({"status": "ok"})

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .cookies import clear_auth_cookies, set_auth_cookies
from .emails import send_password_reset_email, send_verification_email
from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
    _generate_unique_username,
)
from .throttles import LoginRateThrottle, PasswordResetRateThrottle, RegisterRateThrottle
from .tokens import email_verification_token

User = get_user_model()


def _issue_tokens_response(user, data, status_code):
    refresh = RefreshToken.for_user(user)
    response = Response(data, status=status_code)
    set_auth_cookies(response, refresh.access_token, refresh)
    return response


def _build_verify_url(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    return f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"


class RegisterView(APIView):
    """POST /api/auth/register/ - always creates a buyer account. Selling
    requires a separate, deliberate seller application (see models.py)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_verification_email(user, _build_verify_url(user))
        return _issue_tokens_response(user, UserSerializer(user).data, status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/auth/login/"""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        email = str(request.data.get("email", "")).strip()
        password = str(request.data.get("password", ""))
        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({"detail": "Incorrect email or password."}, status=status.HTTP_400_BAD_REQUEST)
        return _issue_tokens_response(user, UserSerializer(user).data, status.HTTP_200_OK)


class GoogleLoginView(APIView):
    """POST /api/auth/google/ - body: {credential}. `credential` is the
    ID token Google Identity Services hands back to the frontend after
    the user picks an account - it's a JWT signed by Google, not something
    the frontend can forge. verify_oauth2_token checks that signature
    against Google's public certs plus the issuer/audience/expiry, so a
    successful return here is as trustworthy as a verified password login."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        credential = request.data.get("credential", "")
        try:
            idinfo = google_id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except (ValueError, GoogleAuthError):
            return Response({"detail": "Invalid Google credential."}, status=status.HTTP_400_BAD_REQUEST)

        if not idinfo.get("email_verified"):
            return Response({"detail": "Google account email isn't verified."}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo["email"].lower()
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            user = User(
                username=_generate_unique_username(email),
                email=email,
                first_name=idinfo.get("given_name", ""),
                last_name=idinfo.get("family_name", ""),
                is_email_verified=True,
            )
            user.set_unusable_password()
            user.save()

        return _issue_tokens_response(user, UserSerializer(user).data, status.HTTP_200_OK)


class RefreshView(APIView):
    """POST /api/auth/refresh/ - rotates the refresh token (see SIMPLE_JWT:
    ROTATE_REFRESH_TOKENS/BLACKLIST_AFTER_ROTATION) and reissues both cookies."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw_token:
            return Response({"detail": "Refresh token missing."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            old_refresh = RefreshToken(raw_token)
            user = User.objects.get(pk=old_refresh["user_id"])
        except (TokenError, User.DoesNotExist):
            return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)

        old_refresh.blacklist()
        new_refresh = RefreshToken.for_user(user)

        response = Response({"detail": "Token refreshed."})
        set_auth_cookies(response, new_refresh.access_token, new_refresh)
        return response


class LogoutView(APIView):
    """POST /api/auth/logout/ - blacklists the refresh token and clears cookies."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if raw_token:
            try:
                RefreshToken(raw_token).blacklist()
            except TokenError:
                pass
        response = Response({"detail": "Logged out."})
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    """GET /api/auth/me/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class VerifyEmailView(APIView):
    """POST /api/auth/verify-email/ - body: {uid, token}"""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid verification link."}, status=status.HTTP_400_BAD_REQUEST)

        if not email_verification_token.check_token(user, token):
            return Response({"detail": "Invalid or expired verification link."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        return Response({"detail": "Email verified."})


class ResendVerificationEmailView(APIView):
    """POST /api/auth/resend-verification/"""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response({"detail": "Email is already verified."})
        send_verification_email(user, _build_verify_url(user))
        return Response({"detail": "Verification email sent."})


class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ - body: {email}. Always returns 200
    regardless of whether the email is registered, to avoid leaking which
    emails have accounts."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_password_reset_email(user, reset_url)

        return Response({"detail": "If that email is registered, a reset link has been sent."})


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset/confirm/ - body: {uid, token, new_password, new_password2}"""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(data["uid"])))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, data["token"]):
            return Response({"detail": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successful."})

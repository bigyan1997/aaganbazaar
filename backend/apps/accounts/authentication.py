from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Reads the access token from an HttpOnly cookie instead of the
    Authorization header, so the frontend never touches the raw JWT -
    keeps it out of reach of XSS-driven token theft (see project notes).

    DRF exempts all its views from Django's CSRF middleware and only
    re-enforces CSRF for SessionAuthentication - this class is not that,
    so no CSRF token is checked here. The cookie itself is what's
    protected: HttpOnly (JS can't read it) + SameSite=Lax (browsers won't
    attach it to cross-site POST/fetch requests), set in cookies.py.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token

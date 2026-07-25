from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Limits login attempts per IP to blunt password-guessing/brute force."""

    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """Limits registration attempts per IP to blunt mass fake-account creation."""

    scope = "register"


class PasswordResetRateThrottle(AnonRateThrottle):
    """Limits password reset requests per IP to blunt email-bombing a victim."""

    scope = "password_reset"

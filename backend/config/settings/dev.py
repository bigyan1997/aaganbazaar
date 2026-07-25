from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
]
CORS_ALLOW_CREDENTIALS = True

# Cookies over plain http are fine on localhost only - never in prod.
AUTH_COOKIE_SECURE = False
AUTH_COOKIE_SAMESITE = "Lax"

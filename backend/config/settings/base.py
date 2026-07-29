"""
Base settings shared by dev.py and prod.py.
Nothing environment-specific lives here except sensible, safe defaults.
Every secret or environment-dependent value comes from .env via django-environ.
"""
from pathlib import Path
from datetime import timedelta
from decimal import Decimal
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

# SECURITY WARNING: keep the secret key used in production secret!
# No fallback value here on purpose - if .env is missing this key,
# the app fails loudly at startup rather than running with a guessable key.
SECRET_KEY = env("DJANGO_SECRET_KEY")

# Admin path is configurable so prod can move it off the well-known /admin/
# to cut down on automated scanner noise.
ADMIN_URL = env("DJANGO_ADMIN_URL", default="admin/")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    # local apps
    "apps.accounts",
    "apps.common",
    "apps.sellers",
    "apps.catalog",
    "apps.cart",
    "apps.orders",
    "apps.reviews",
    "apps.wishlist",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": env.db("DATABASE_URL")
}

# Custom user model - MUST be set before the first migration ever runs.
# Switching this later on a live database is a painful, risky migration.
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kathmandu"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Security headers (SecurityMiddleware) ---
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

# --- REST framework ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.accounts.authentication.CookieJWTAuthentication",
    ),
    # Read access is open by default (product/category browsing shouldn't require
    # login); individual views tighten this to IsAuthenticated for writes/private data.
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    # No blanket anon/user throttle here on purpose - a global "100/hour per IP"
    # applies to every request including plain public reads (categories,
    # products, banners), and a single page load can easily fire 5+ parallel
    # GETs, so it starves normal browsing rather than stopping abuse. Instead,
    # each genuinely abuse-prone view (login/register/google-login/password-
    # reset/resend-verification, see apps.accounts.throttles) declares its own
    # explicit throttle_classes - deliberate per-view opt-in, not a global default.
    "DEFAULT_THROTTLE_CLASSES": (),
    "DEFAULT_THROTTLE_RATES": {
        "login": "5/min",
        "register": "3/min",
        "password_reset": "3/hour",
    },
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
}

# --- JWT ---
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

AUTH_COOKIE_ACCESS = "access_token"
AUTH_COOKIE_REFRESH = "refresh_token"

# --- Email (Resend) ---
RESEND_API_KEY = env("RESEND_API_KEY", default="")
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# --- Google Sign-In (Google Identity Services) ---
# Client ID from console.cloud.google.com - APIs & Services > Credentials.
# Used to verify that a Google ID token was actually issued for this app.
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")

# --- Marketplace ---
# Percentage taken on a sale when a seller doesn't have their own override
# (SellerProfile.commission_rate). Placeholder - set to an actual figure
# before launch, this isn't a real competitive/business decision.
DEFAULT_COMMISSION_RATE = env("DEFAULT_COMMISSION_RATE", default="10.00", cast=Decimal)

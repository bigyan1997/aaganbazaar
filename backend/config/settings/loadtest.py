"""
Dev settings + loosened rate limits, for local load/stress testing only.

Locust's simulated users all share one local IP, so the real anon/user
throttle rates (tuned for genuine distributed traffic) would dominate the
results and hide actual server throughput. Never point this at anything
but a local throwaway run - it's not a security relaxation for real use,
just a measurement tool.

Usage:
    DJANGO_SETTINGS_MODULE=config.settings.loadtest python manage.py runserver 127.0.0.1:8006
    locust -f locustfile.py --host=http://127.0.0.1:8006 ...
"""
from .dev import *  # noqa

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        "anon": "1000000/day",
        "user": "1000000/day",
        "login": "1000000/day",
        "register": "1000000/day",
        "password_reset": "1000000/day",
    },
}

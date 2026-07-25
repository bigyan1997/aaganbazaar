from django.apps import AppConfig


class SellersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sellers"

    def ready(self):
        from . import signals  # noqa: F401

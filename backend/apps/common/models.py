from django.db import models


class Banner(models.Model):
    """A homepage hero banner, managed entirely through the Django admin -
    no seller/buyer-facing UI touches this. Multiple active banners rotate
    as a carousel on the homepage, ordered by display_order."""

    image = models.ImageField(upload_to="banners/")
    link_url = models.CharField(max_length=500, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-created_at"]

    def __str__(self):
        return f"Banner #{self.pk}"

from django.utils.text import slugify


def unique_slug_for(model, value, slug_field="slug"):
    """Slugify `value` and, if it collides with an existing row, append
    -2, -3, ... until it's unique. Shared by every model that needs a
    unique slug (Category, Product, SellerProfile) so the collision
    logic only lives in one place."""
    field_max_length = model._meta.get_field(slug_field).max_length
    base = slugify(value)[:field_max_length]
    slug = base
    n = 1
    while model.objects.filter(**{slug_field: slug}).exists():
        n += 1
        suffix = f"-{n}"
        slug = f"{base[: field_max_length - len(suffix)]}{suffix}"
    return slug

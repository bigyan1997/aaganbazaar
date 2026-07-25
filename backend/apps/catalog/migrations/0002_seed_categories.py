from django.db import migrations

# Placeholder categories for the homepage's 8-category grid - rename/replace
# via the admin once real category names are decided.
CATEGORIES = [
    "Electronics",
    "Fashion & Apparel",
    "Home & Kitchen",
    "Beauty & Personal Care",
    "Groceries & Essentials",
    "Mobile & Accessories",
    "Books & Stationery",
    "Sports & Outdoors",
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    from django.utils.text import slugify

    for order, name in enumerate(CATEGORIES):
        Category.objects.get_or_create(slug=slugify(name), defaults={"name": name, "display_order": order})


def remove_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    from django.utils.text import slugify

    Category.objects.filter(slug__in=[slugify(name) for name in CATEGORIES]).delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0001_initial")]
    operations = [migrations.RunPython(seed_categories, remove_categories)]

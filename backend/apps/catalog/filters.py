import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    # in_stock isn't a DB column (it's a model @property), so it needs a
    # method filter rather than a plain field lookup.
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["category__slug", "seller__slug", "min_price", "max_price", "in_stock"]

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock_quantity__gt=0) if value else queryset

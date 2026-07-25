from django.conf import settings

from apps.common.emails import email_button, send_email, wrap_email

from .models import StockAlert


def notify_back_in_stock(product):
    alerts = list(StockAlert.objects.filter(product=product).select_related("user"))
    if not alerts:
        return

    body = f"""
<p style="font-size:14px;color:#333;line-height:1.7;">
  Good news - <strong>{product.name}</strong> is back in stock on Aaganbazaar.
</p>
{email_button("View product", f"{settings.FRONTEND_URL}/products/{product.slug}")}"""
    html = wrap_email("Back in stock", body)
    subject = f"{product.name} is back in stock"
    for alert in alerts:
        send_email(alert.user.email, subject, html)

    StockAlert.objects.filter(product=product).delete()

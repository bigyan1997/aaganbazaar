from django.conf import settings

from apps.common.emails import email_button, send_email, wrap_email


def send_new_order_email(seller_order):
    seller = seller_order.seller
    rows = "".join(
        f"""<tr>
  <td style="padding:6px 0;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">{item.product_name} × {item.quantity}</td>
  <td style="padding:6px 0;font-size:13px;color:#333;text-align:right;border-bottom:1px solid #f0f0f0;">Rs. {item.line_total}</td>
</tr>"""
        for item in seller_order.items.all()
    )
    body = f"""
<p style="font-size:14px;color:#333;line-height:1.7;">Hi {seller.user.first_name or seller.store_name},</p>
<p style="font-size:14px;color:#333;line-height:1.7;">
  You've got a new order on Aaganbazaar - <strong>{seller_order.order.order_number}</strong>.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">{rows}</table>
<p style="font-size:14px;color:#12204A;font-weight:700;">Subtotal: Rs. {seller_order.subtotal}</p>
{email_button("View order", f"{settings.FRONTEND_URL}/seller/orders")}
<p style="font-size:12px;color:#999;">Confirm or ship it from your seller dashboard.</p>"""
    send_email(
        seller.user.email,
        f"New order {seller_order.order.order_number} on Aaganbazaar",
        wrap_email("New order received", body),
    )


def send_refund_email(seller_order):
    buyer = seller_order.order.buyer
    if not buyer.email_order_updates:
        return
    body = f"""
<p style="font-size:14px;color:#333;line-height:1.7;">Hi {buyer.first_name or buyer.email},</p>
<p style="font-size:14px;color:#333;line-height:1.7;">
  Your order <strong>{seller_order.order.order_number}</strong> from {seller_order.seller.store_name}
  has been marked as refunded.
</p>
<p style="font-size:14px;color:#12204A;font-weight:700;">Refund amount: Rs. {seller_order.subtotal}</p>
{email_button("View order", f"{settings.FRONTEND_URL}/orders/{seller_order.order.order_number}")}
<p style="font-size:12px;color:#999;">If you paid online, the refund will be processed to your original payment method.</p>"""
    send_email(
        buyer.email,
        f"Refund processed for order {seller_order.order.order_number}",
        wrap_email("Refund processed", body),
    )

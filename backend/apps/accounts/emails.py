import threading

import resend
from django.conf import settings


def _wrap(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F2E0D0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 12px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;width:100%;">
        <tr><td style="background:#12204A;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;">Aagan<span style="color:#E8551E;">bazaar</span></span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px;">
          <h1 style="font-size:20px;color:#12204A;margin:0 0 12px;">{title}</h1>
          {body_html}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _button(label: str, url: str) -> str:
    return f"""
<div style="text-align:center;margin:24px 0;">
  <a href="{url}" style="display:inline-block;background:#E8551E;color:#ffffff;padding:14px 32px;
     border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">{label}</a>
</div>"""


def _send(to: str, subject: str, html: str):
    def _do_send():
        if settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY
            try:
                response = resend.Emails.send({
                    "from": "Aaganbazaar <noreply@aaganbazaar.com>",
                    "to": [to],
                    "subject": subject,
                    "html": html,
                })
                print(f"[EMAIL OK] {subject} -> {to} | id={getattr(response, 'id', response)}", flush=True)
            except Exception as e:
                print(f"[EMAIL ERROR] {subject} -> {to}: {e}", flush=True)
        else:
            # No API key configured (e.g. local dev without .env set up) - print instead of sending.
            print(f"[EMAIL:CONSOLE] {subject} -> {to}\n{html}", flush=True)

    threading.Thread(target=_do_send, daemon=True).start()


def send_verification_email(user, verify_url: str):
    body = f"""
<p style="font-size:14px;color:#333;line-height:1.7;">Hi {user.first_name or 'there'},</p>
<p style="font-size:14px;color:#333;line-height:1.7;">
  Thanks for joining Aaganbazaar. Verify your email address to activate your account.
</p>
{_button("Verify my email", verify_url)}
<p style="font-size:12px;color:#999;">If you didn't create this account, you can ignore this email.</p>"""
    _send(user.email, "Verify your Aaganbazaar email address", _wrap("Verify your email", body))


def send_password_reset_email(user, reset_url: str):
    body = f"""
<p style="font-size:14px;color:#333;line-height:1.7;">Hi {user.first_name or 'there'},</p>
<p style="font-size:14px;color:#333;line-height:1.7;">
  We received a request to reset your Aaganbazaar password. This link expires in 1 hour.
</p>
{_button("Reset my password", reset_url)}
<p style="font-size:12px;color:#999;">If you didn't request this, you can safely ignore this email.</p>"""
    _send(user.email, "Reset your Aaganbazaar password", _wrap("Reset your password", body))

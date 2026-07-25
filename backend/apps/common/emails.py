import threading

import resend
from django.conf import settings


def wrap_email(title: str, body_html: str) -> str:
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


def email_button(label: str, url: str) -> str:
    return f"""
<div style="text-align:center;margin:24px 0;">
  <a href="{url}" style="display:inline-block;background:#E8551E;color:#ffffff;padding:14px 32px;
     border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">{label}</a>
</div>"""


def send_email(to: str, subject: str, html: str):
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

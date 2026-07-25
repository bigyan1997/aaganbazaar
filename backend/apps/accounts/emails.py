from apps.common.emails import email_button, send_email, wrap_email


def send_verification_email(user, verify_url: str):
    body = f"""
<p style="font-size:14px;color:#333;line-height:1.7;">Hi {user.first_name or 'there'},</p>
<p style="font-size:14px;color:#333;line-height:1.7;">
  Thanks for joining Aaganbazaar. Verify your email address to activate your account.
</p>
{email_button("Verify my email", verify_url)}
<p style="font-size:12px;color:#999;">If you didn't create this account, you can ignore this email.</p>"""
    send_email(user.email, "Verify your Aaganbazaar email address", wrap_email("Verify your email", body))


def send_password_reset_email(user, reset_url: str):
    body = f"""
<p style="font-size:14px;color:#333;line-height:1.7;">Hi {user.first_name or 'there'},</p>
<p style="font-size:14px;color:#333;line-height:1.7;">
  We received a request to reset your Aaganbazaar password. This link expires in 1 hour.
</p>
{email_button("Reset my password", reset_url)}
<p style="font-size:12px;color:#999;">If you didn't request this, you can safely ignore this email.</p>"""
    send_email(user.email, "Reset your Aaganbazaar password", wrap_email("Reset your password", body))

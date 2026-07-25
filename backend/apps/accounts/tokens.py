from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """Single-use link token for email verification. Folding
    is_email_verified into the hash makes the token self-invalidating
    once used, with no extra DB column needed."""

    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{timestamp}{user.is_email_verified}"


email_verification_token = EmailVerificationTokenGenerator()

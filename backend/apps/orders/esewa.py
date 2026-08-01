"""eSewa ePay v2 integration helpers.

Flow: CheckoutView creates the Order as usual (payment_status=pending),
then for payment_method=esewa also returns signed form fields the
frontend auto-submits (a real browser POST, not fetch/XHR - that's how
eSewa's hosted payment page works) to ESEWA_FORM_URL. eSewa redirects the
buyer's browser back to EsewaCallbackView regardless of outcome. That view
never trusts the redirect payload by itself - it recomputes the HMAC
signature *and* independently calls eSewa's server-to-server status API
using our own record of the order's amount before marking anything paid.
"""

import base64
import hashlib
import hmac
import json

import requests
from django.conf import settings

SIGNED_FIELDS = ("total_amount", "transaction_uuid", "product_code")

# eSewa's documented status values: PENDING, COMPLETE, FULL_REFUND,
# PARTIAL_REFUND, AMBIGUOUS, NOT_FOUND, CANCELED. Only these two mean the
# attempt definitively did not (and will not) succeed - PENDING/AMBIGUOUS
# genuinely haven't resolved yet, and *_REFUND means money moved at some
# point, so none of those should be treated as a plain failure.
FAILED_GATEWAY_STATUSES = {"CANCELED", "NOT_FOUND"}


def _signature(total_amount, transaction_uuid, product_code):
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    digest = hmac.new(settings.ESEWA_SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
    return base64.b64encode(digest).decode()


def build_payment_form(order, success_url, failure_url):
    """Field set + target URL for the frontend to auto-submit as a POST
    form. order_number doubles as eSewa's transaction_uuid - it's already
    globally unique, so no extra field on Order is needed."""
    total_amount = str(order.total_amount)
    return {
        "action_url": settings.ESEWA_FORM_URL,
        "fields": {
            "amount": total_amount,
            "tax_amount": "0",
            "total_amount": total_amount,
            "transaction_uuid": order.order_number,
            "product_code": settings.ESEWA_PRODUCT_CODE,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": success_url,
            "failure_url": failure_url,
            "signed_field_names": ",".join(SIGNED_FIELDS),
            "signature": _signature(total_amount, order.order_number, settings.ESEWA_PRODUCT_CODE),
        },
    }


def decode_callback_payload(raw_data):
    """The `data` query param eSewa redirects back with - base64-encoded
    JSON. Returns None if it isn't well-formed rather than raising, since
    this is untrusted input from a browser redirect."""
    try:
        return json.loads(base64.b64decode(raw_data))
    except Exception:
        return None


def signature_is_valid(payload):
    expected = _signature(
        payload.get("total_amount"), payload.get("transaction_uuid"), payload.get("product_code")
    )
    return hmac.compare_digest(expected, payload.get("signature", ""))


def fetch_gateway_status(order):
    """Server-to-server confirmation, keyed off our own order.total_amount
    - never the redirect payload's amount - so a tampered client-side
    payload can't be used to confirm a different (lower) amount than what
    the order actually charges."""
    response = requests.get(
        settings.ESEWA_STATUS_URL,
        params={
            "product_code": settings.ESEWA_PRODUCT_CODE,
            "total_amount": str(order.total_amount),
            "transaction_uuid": order.order_number,
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json().get("status")

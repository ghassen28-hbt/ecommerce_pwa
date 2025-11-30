# notifications/utils.py
import json
from urllib.parse import urlparse

from django.conf import settings
from pywebpush import webpush, WebPushException

from .models import PushSubscription


def _get_aud_from_endpoint(endpoint: str) -> str | None:
    """Retourne 'aud' pour VAPID à partir de l'endpoint FCM."""
    try:
        parsed = urlparse(endpoint)
        return f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        return None


def _send_payload_to_subscriptions(subscriptions, payload: dict) -> tuple[int, list[str]]:
    """
    Envoie un payload webpush à une liste de PushSubscription.
    Retourne (nombre_envoyé, liste_erreurs).
    """
    success = 0
    errors: list[str] = []

    for sub in subscriptions:
        aud = _get_aud_from_endpoint(sub.endpoint)
        if not aud:
            errors.append(f"Endpoint invalide: {sub.endpoint}")
            continue

        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=settings.WEBPUSH_VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": settings.WEBPUSH_VAPID_CLAIMS,
                    "aud": aud,
                },
            )
            success += 1
        except WebPushException as e:
            # si l'abonnement est mort (404/410), on le supprime
            if getattr(e, "response", None) is not None and e.response.status_code in (404, 410):
                sub.delete()
            errors.append(str(e))

    return success, errors


def send_push_for_notification(notification) -> tuple[int, list[str]]:
    """
    Envoie une push pour une instance de Notification.

    - Si notification.user est défini → envoie à tous ses PushSubscription
    - Si notification.user est None → broadcast à tous les abonnés
    """
    # 1) Construire le payload à partir de l'objet Notification
    url = notification.url or "http://127.0.0.1:5173/"
    payload = {
        "title": notification.title,
        "body": notification.message,
        "url": url,
        "type": notification.type,
        "id": notification.id,
    }

    if notification.user:
        subs = PushSubscription.objects.filter(user=notification.user)
    else:
        subs = PushSubscription.objects.all()  # 👈 broadcast

    return _send_payload_to_subscriptions(subs, payload)

    # notifications/utils.py

from django.conf import settings
from .models import Notification
from .views import send_push_for_notification  # si la fonction est là

def notify_order_validated(order):
    """
    Crée une Notification + envoie un push pour une commande validée.
    """
    user = order.user

    # URL vers le détail de la commande sur le front
    frontend_order_url = getattr(
        settings,
        "FRONTEND_ORDER_URL",
        "http://127.0.0.1:5173/orders"   # adapte si besoin
    )
    url = f"{frontend_order_url}/{order.id}"

    notif = Notification.objects.create(
        user=user,
        title="Commande validée ✅",
        message=f"Merci {user.username}, ta commande #{order.id} est confirmée.",
        type="order",
        url=url,
    )

    # réutilise ta fonction qui parcourt PushSubscription et envoie le push
    sent, errors = send_push_for_notification(notif)
    return sent, errors

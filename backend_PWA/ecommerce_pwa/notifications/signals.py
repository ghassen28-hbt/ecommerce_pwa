# notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification
from .utils import send_push_for_notification


@receiver(post_save, sender=Notification)
def notification_post_save(sender, instance: Notification, created: bool, **kwargs):
    """
    À chaque fois qu'une Notification est créée, on envoie la push correspondante.
    """
    if not created:
        return

    # Tu peux mettre des conditions ici si tu ne veux pas tout envoyer
    # ex: if instance.type in ["promo", "order"]: ...
    success, errors = send_push_for_notification(instance)
    print(f"[PUSH] Notification #{instance.id} → {success} envois, erreurs={errors}")

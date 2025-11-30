# notifications/serializers.py
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer en LECTURE pour envoyer les notifications au frontend.
    Le client ne crée/modifie pas directement une notification.
    """

    class Meta:
        model = Notification
        # Champs visibles côté React
        fields = [
            "id",
            "title",
            "message",
            "type",
            "is_read",
            "created_at",
            "sent_at",
            "url",
        ]
        read_only_fields = fields  # tout en read-only côté client


class NotificationReadSerializer(serializers.ModelSerializer):
    """
    Serializer minimal pour marquer une notification comme lue.
    On ne permet de modifier QUE le champ is_read.
    """

    class Meta:
        model = Notification
        fields = ["is_read"]

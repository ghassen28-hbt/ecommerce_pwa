from django.db import models
from django.contrib.auth.models import User

class Notification(models.Model):
    """
    Modèle représentant une notification envoyée à un utilisateur (client).
    Utilisé pour tracer les pushs, les alertes, les promos, etc.
    """

    # 🧑‍💻 Utilisateur concerné
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, 
        related_name="notifications",
        null=True,
        blank=True,
        help_text="Laisser vide pour envoyer la notification à tous les utilisateurs.",
        
    )

    # 📨 Titre et message
    title = models.CharField(max_length=150)
    message = models.TextField()

    # 📎 Type de notification (facultatif mais utile pour filtrer)
    type = models.CharField(
        max_length=50,
        choices=[
            ("promo", "Promotion"),
            ("order", "Commande"),
            ("system", "Système"),
            ("custom", "Personnalisée"),
        ],
        default="custom",
    )

    # 📅 Statuts et suivi
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    # 🔗 Lien optionnel (vers un produit, une page, etc.)
    url = models.URLField(blank=True, null=True)

    # 🔑 Class Meta : configuration de la table
    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.title} → {self.user.username if self.user else 'Tous les utilisateurs'}"


class PushSubscription(models.Model):
    """
    Stocke les abonnements push navigateur (pour pywebpush).
    Chaque enregistrement correspond à un appareil / navigateur unique.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="push_subscriptions",
    )
    endpoint = models.TextField(unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PushSub {self.user or 'anonyme'}"
from django import forms
from django.contrib import admin
from django.contrib.auth.models import User

from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "type", "is_read", "created_at")
    list_filter = ("type", "is_read", "created_at")
    search_fields = ("title", "message", "user__username")
 

class NotificationAdminForm(forms.ModelForm):
    # 🔥 Champ user avec label custom pour le "vide"
    user = forms.ModelChoiceField(
        queryset=User.objects.all(),
        required=False,
        empty_label="Tous les utilisateurs (broadcast)",  # 👈 ici le texte que tu veux
    )

    class Meta:
        model = Notification
        fields = "__all__"
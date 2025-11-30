from django.db import models
from django.contrib.auth.models import User

class Customer(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    # autoriser temporairement null/blank pour éviter l'échec de migration sur les lignes existantes
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="customer",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.email})"

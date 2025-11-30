from django.db import models
from django.contrib.auth.models import User


from catalog.models import Product   

class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("paid", "Payée"),
        ("shipped", "Expédiée"),
        ("delivered", "Livrée"),
        ("canceled", "Annulée"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # ex : adresse simplifiée (optionnel)
    shipping_address = models.CharField(max_length=255, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"

    def recalc_total(self):
        total = sum(item.quantity * item.unit_price for item in self.items.all())
        self.total_amount = total
        self.save()
        return total


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

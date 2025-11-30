from django.db import models


class Category(models.Model):
    """
    Catégorie de produits (ex : Chaussures, Vêtements…)
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['name']  # tri alphabétique
        db_table = "category"  # nom de la table dans la BD

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Produit vendu dans la boutique.
    """
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image_url = models.URLField(blank=True, null=True)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products'
    )

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ['name']
        db_table = "product"

    def __str__(self):
        return self.name


class Customer(models.Model):
    """
    Client qui passe une commande.
    """
    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30)
    address = models.TextField()

    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
        ordering = ['full_name']
        db_table = "customer"

    def __str__(self):
        return self.full_name


class Order(models.Model):
    """
    Commande passée par un client.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    class Meta:
        verbose_name = "Order"
        verbose_name_plural = "Orders"
        ordering = ['-created_at']  # les commandes récentes en premier
        db_table = "order"

    def __str__(self):
        return f"Order #{self.id} - {self.customer.full_name}"


class OrderItem(models.Model):
    """
    Ligne d'une commande (produit + quantité + prix au moment de la commande).
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = "Order item"
        verbose_name_plural = "Order items"
        ordering = ['order']
        db_table = "order_item"

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class PushSubscription(models.Model):
    """
    Abonnement aux notifications push (PWA).
    """
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
        blank=True,
        null=True,
    )
    endpoint = models.TextField()
    p256dh_key = models.TextField()
    auth_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Push subscription"
        verbose_name_plural = "Push subscriptions"
        ordering = ['-created_at']
        db_table = "push_subscription"

    def __str__(self):
        return f"Push sub #{self.id}"

from rest_framework import serializers
from .models import Category, Product, Customer, Order, OrderItem, PushSubscription
#serializers vient de Django REST Framework
#On importe tous les modèles qu’on va transformer en JSON.

#Serializer pour GET (lecture)--> mode “read_only”.
    #convertir des objets Python / modèles Django en JSON
    #utilisé quand le frontend demande des données (ex : liste des produits)
    #dans ce cas :
        #le serializer prend un modèle Django et retourne du JSON lisible par le frontend.


# -------------------------------------------------------------------
# CATEGORY SERIALIZER
# Utilisé pour : API GET /api/categories/
# Type : GET uniquement
# Rôle : Transformer chaque catégorie en JSON pour le frontend.
# Le frontend ne crée pas de catégories, donc pas de POST ici.
# -------------------------------------------------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


# -------------------------------------------------------------------
# PRODUCT SERIALIZER
# Utilisé pour : API GET /api/products/ et GET /api/products/<id>/
# Type : GET uniquement
# Rôle : Retourner toutes les informations des produits au frontend.
# Le backend admin (Django Admin) gère la création des produits,
# donc on n’a pas besoin du POST pour le frontend.
# -------------------------------------------------------------------
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'price',
            'image_url',
            'stock',
            'category',
        ]


# -------------------------------------------------------------------
# CUSTOMER SERIALIZER
# Utilisé pour : API POST /api/orders/
# Type : POST uniquement
# Rôle : Lorsqu'un client passe une commande, son JSON
# (nom, email, téléphone, adresse) arrive au backend.
# Ce serializer transforme ce JSON en objet Customer.
#
# Le frontend n’affiche pas la liste des clients, donc pas de GET.
# -------------------------------------------------------------------
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['full_name', 'email', 'phone', 'address']


# -------------------------------------------------------------------
# ORDER ITEM SERIALIZER
# Utilisé pour :
# - API POST /api/orders/ (pour créer les lignes de commande)
# - API GET interne pour afficher les items d’une commande
# Type : GET + POST
#
# Rôle POST :
#   Transforme les données reçues du frontend :
#     { "product": 1, "quantity": 2 }
#   en objets OrderItem.
#
# Rôle GET :
#   Permet d’afficher les items d’une commande via OrderSerializer.
# -------------------------------------------------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'unit_price']


# -------------------------------------------------------------------
# ORDER SERIALIZER
# Utilisé pour : API GET (si un jour tu ajoutes /api/orders/<id>/)
# Type : GET uniquement (lecture)
#
# Rôle :
#   Représenter une commande complète avec :
#     - infos client (CustomerSerializer)
#     - lignes de commande (OrderItemSerializer)
#     - total, date, status
#
# Ce serializer N’EST PAS utilisé pour le POST, car créer une
# commande nécessite une logique spéciale dans views.py.
# -------------------------------------------------------------------
class OrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer()
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'created_at', 'status', 'total_amount', 'items']


# -------------------------------------------------------------------
# PUSH SUBSCRIPTION SERIALIZER
# Utilisé pour : API POST /api/push/subscribe/
# Type : POST uniquement
#
# Rôle :
#   Lorsque le navigateur du client s’abonne aux notifications PWA,
#   il envoie un JSON avec endpoint + clés.
#   Ce serializer valide ces champs et crée un objet PushSubscription.
#
# Le GET n'est pas utilisé pour ce modèle.
# -------------------------------------------------------------------
class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ['id', 'endpoint', 'p256dh_key', 'auth_key', 'customer']
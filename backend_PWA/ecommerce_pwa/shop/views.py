from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from .models import Category, Product, Customer, Order, OrderItem, PushSubscription
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    CustomerSerializer,
    OrderSerializer,
    OrderItemSerializer,
    PushSubscriptionSerializer,
)

def home(request):
    return HttpResponse("hala rayes kolou tamem machy hal ")
# -------------------------------------------------------------------
# CategoryViewSet
# API liée :
#   - GET /api/categories/          -> liste des catégories
#   - GET /api/categories/<id>/    -> (optionnel) détail d'une catégorie
#
# Type :
#   - GET uniquement (lecture)
#
# Rôle :
#   Fournir au frontend la liste des catégories pour filtrer les produits.
# -------------------------------------------------------------------
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les catégories.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer


# -------------------------------------------------------------------
# ProductViewSet
# API liée :
#   - GET /api/products/            -> liste des produits
#   - GET /api/products/<id>/      -> détail d'un produit
#
# Paramètres possibles :
#   - ?category=<id>   -> filtrer par catégorie
#   - ?search=mot      -> chercher par nom
#
# Type :
#   - GET uniquement
#
# Rôle :
#   Fournir au frontend le catalogue des produits (avec filtres),
#   et le détail d'un produit pour la page "fiche produit".
# -------------------------------------------------------------------
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les produits.
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer

    def get_queryset(self):
        """
        Filtre les produits selon la catégorie ou un mot-clé de recherche.
        Exemple :
          /api/products/?category=1
          /api/products/?search=nike
        """
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        search = self.request.query_params.get('search')

        if category_id:
            qs = qs.filter(category_id=category_id)
        if search:
            qs = qs.filter(name__icontains=search)

        return qs


# -------------------------------------------------------------------
# CreateOrderAPIView
# API liée :
#   - POST /api/orders/
#
# Type :
#   - POST uniquement (création)
#
# Corps JSON attendu :
# {
#   "customer": {
#     "full_name": "Ali",
#     "email": "ali@example.com",
#     "phone": "12345678",
#     "address": "Tunis"
#   },
#   "items": [
#     { "product": 1, "quantity": 2 },
#     { "product": 3, "quantity": 1 }
#   ]
# }
#
# Rôle :
#   - Valider les infos du client
#   - Vérifier que les produits existent
#   - Créer une commande + OrderItems
#   - Calculer le total
#   - Retourner un message de succès + id de commande
#
# Cette vue illustre bien l'utilisation des serializers côté POST.
# -------------------------------------------------------------------
class CreateOrderAPIView(APIView):

    def post(self, request, *args, **kwargs):
        data = request.data

        # 1) Récupérer et valider les données du client
        customer_data = data.get('customer')
        if not customer_data:
            return Response(
                {"error": "Le champ 'customer' est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer_serializer = CustomerSerializer(data=customer_data)
        if not customer_serializer.is_valid():
            # Si les données client sont invalides → on retourne les erreurs
            return Response(customer_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # On sauvegarde le client en base
        customer = customer_serializer.save()

        # 2) Récupérer la liste des items (produits commandés)
        items_data = data.get('items', [])
        if not items_data:
            return Response(
                {"error": "Le champ 'items' est obligatoire et ne peut pas être vide."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3) Créer la commande (Order) avec total = 0 au départ
        order = Order.objects.create(
            customer=customer,
            status='pending',
            total_amount=0
        )

        total = 0

        # 4) Pour chaque item, vérifier le produit et créer un OrderItem
        for item in items_data:
            product_id = item.get('product')
            quantity = item.get('quantity', 1)

            # Vérifier que le produit existe et est actif
            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except Product.DoesNotExist:
                order.delete()  # annuler la commande si produit invalide
                return Response(
                    {"error": f"Le produit avec id {product_id} n'existe pas ou est inactif."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Prix unitaire pris depuis le modèle Product
            unit_price = product.price

            # Créer la ligne de commande
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price
            )

            # Ajouter au total
            total += unit_price * quantity

        # 5) Mettre à jour le total de la commande
        order.total_amount = total
        order.save()

        # 6) Réponse envoyée au frontend
        return Response(
            {
                "orderId": order.id,
                "status": order.status,
                "total": str(order.total_amount),
                "message": "Commande enregistrée avec succès"
            },
            status=status.HTTP_201_CREATED
        )


# -------------------------------------------------------------------
# PushSubscriptionAPIView
# API liée :
#   - POST /api/push/subscribe/
#
# Type :
#   - POST uniquement
#
# Corps JSON attendu :
# {
#   "endpoint": "...",
#   "p256dh_key": "...",
#   "auth_key": "...",
#   "customer": 1   (optionnel)
# }
#
# Rôle :
#   - Enregistrer un abonnement aux notifications push PWA
#   - Permettra plus tard d'envoyer des notifications (via un script serveur)
# -------------------------------------------------------------------
class PushSubscriptionAPIView(APIView):

    def post(self, request, *args, **kwargs):
        serializer = PushSubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Subscription saved"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

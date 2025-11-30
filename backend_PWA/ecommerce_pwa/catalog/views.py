from django.shortcuts import render

# Create your views here.
#ce fichier pour le logique metier de l'application 
""" reçoit une requête HTTP (GET, POST, etc.)

exécute de la logique métier (lire DB, créer une commande, etc.)

renvoie une réponse HTTP (JSON pour une API)."""

from rest_framework import viewsets
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from rest_framework.permissions import AllowAny

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les catégories.

    URL générées (via router) :
      - GET /api/categories/        -> liste des catégories
      - GET /api/categories/<id>/   -> détail d'une catégorie

    Rôle :
      - Donner au frontend les catégories disponibles pour filtrer les produits.
      - Aucune création/modification via cette API publique.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les produits.

    URL générées :
      - GET /api/products/          -> liste des produits actifs
      - GET /api/products/<id>/     -> détail d'un produit

    Filtres possibles via query params :
      - /api/products/?category=2   -> produits d'une catégorie
      - /api/products/?search=rtx   -> recherche par nom

    Rôle :
      - Fournir le catalogue à la page React (Home, catégorie, détails).
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Permet de filtrer dynamiquement les produits
        selon les paramètres de la requête HTTP.
        """
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        

        if category_id:
            qs = qs.filter(category_id=category_id)
        if search:
            qs = qs.filter(name__icontains=search)

        return qs

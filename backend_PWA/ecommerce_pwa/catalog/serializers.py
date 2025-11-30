#pour transformer les models ou les objets django en JSON et pour trondsformer les JSON en objets django le fichier serializers.py faire la serialization et la deserialization

from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer read-only pour les catégories.

    Rôle :
      - Exposer les catégories au frontend (React) via JSON.
      - Ne permet PAS de créer/modifier des catégories via l'API publique.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']
        # Tous les champs deviennent read-only : le frontend ne pourra pas les écrire
        read_only_fields = fields


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer read-only pour les produits.

    Rôle :
      - Envoyer la liste des produits / détails au frontend.
      - Empêcher toute création ou modification de produit depuis React.
    """

    # Option : exposer le nom de la catégorie directement (plus pratique côté UI)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'price',
            'stock',
            'is_active',
            'image_url',
            'category',       # id de la catégorie
            'category_name',  # nom de la catégorie (dérivé)
        ]
        read_only_fields = fields
        # Tous les champs deviennent read-only : le frontend ne pourra pas les écrire
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductViewSet,
    CreateOrderAPIView,
    PushSubscriptionAPIView
)

"""
Ce fichier gère les URLs de TON application e-commerce (shop).

Il contient TOUTES les routes API :
- produits
- catégories
- commandes
- abonnements push
"""

# ---------------------------------------------------------
# 1) ROUTER de Django REST Framework
#
# Le router sert à générer automatiquement les URLs GET
# pour les ViewSets (CategoryViewSet et ProductViewSet).
#
# Exemple de routes générées automatiquement :
#   /api/categories/
#   /api/categories/<id>/
#   /api/products/
#   /api/products/<id>/
# ---------------------------------------------------------
router = DefaultRouter()

# Route GET pour les catégories
router.register(
    r'categories',       # URL -> /api/categories/
    CategoryViewSet,     # Vue associée
    basename='categories'
)

# Route GET pour les produits
router.register(
    r'products',         # URL -> /api/products/
    ProductViewSet,      # Vue associée
    basename='products'
)


# ---------------------------------------------------------
# 2) URLS EXPLICITES (pour POST)
#
# Certaines APIs ne peuvent PAS être générées automatiquement
# (comme les POST pour les commandes ou push notifications),
# donc on les écrit manuellement.
# ---------------------------------------------------------
urlpatterns = [
    # ----------------------------------------------
    # Route GET pour produits et catégories
    # générée PAR le router automatiquement
    # ----------------------------------------------
    path('', include(router.urls)),

    # ----------------------------------------------
    # API POST pour créer une commande
    # URL : /api/orders/
    #
    # Vue : CreateOrderAPIView
    # Cette vue :
    #   - valide les données client
    #   - crée une commande
    #   - crée les OrderItems
    #   - calcule le total
    # ----------------------------------------------
    path('orders/', CreateOrderAPIView.as_view(), name='create-order'),

    # ----------------------------------------------
    # API POST pour PUSH SUBSCRIPTION
    # URL : /api/push/subscribe/
    #
    # Vue : PushSubscriptionAPIView
    # Cette vue :
    #   - reçoit les clés envoyées par le navigateur PWA
    #   - sauvegarde l'abonnement
    #   - permettra d'envoyer des notifications plus tard
    # ----------------------------------------------
    path('push/subscribe/', PushSubscriptionAPIView.as_view(), name='push-subscribe'),
]

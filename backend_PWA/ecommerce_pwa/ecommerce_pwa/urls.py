
from notifications.views import save_subscription, send_test_push
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


"""
Ce fichier gère toutes les URLs globales du projet Django.
Il redirige vers les fichiers urls.py des différentes applications.
"""

urlpatterns = [
    # Interface d'administration Django
    path('admin/', admin.site.urls),

    # Routes de chaque application
    path("api/customers/", include("customers.urls")),
    path('api/', include('catalog.urls')),         # Produits / Catégories
    #path('api/', include('customers.urls')),       # Clients / Login
    path("api/orders/", include("orders.urls", namespace="orders")),       # Commandes
     path("api/notifications/", include("notifications.urls", namespace="notifications")),   # Notifications Push

      #  AUTH JWT
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    path("api/save-subscription/", save_subscription, name="save_subscription"),
    path("api/send-test-push/", send_test_push, name="send_test_push"),
]

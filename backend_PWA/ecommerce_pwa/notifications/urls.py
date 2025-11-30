# notifications/urls.py
from django.urls import path
from .views import NotificationListAPIView, NotificationMarkReadAPIView,notify_cart_add
from . import views
app_name = "notifications"

urlpatterns = [
    # Liste des notifications du user connecté
    # GET  /api/notifications/
    path("", NotificationListAPIView.as_view(), name="list"),
    path("notify-cart-add/", views.notify_cart_add, name="notify-cart-add"),
    # Marquer une notification comme lue
    # POST /api/notifications/<id>/read/
    path("<int:pk>/read/", NotificationMarkReadAPIView.as_view(), name="mark-read"),
]

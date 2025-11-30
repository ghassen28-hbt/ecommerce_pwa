# notifications/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.views.decorators.csrf import csrf_exempt
from .models import Notification
from .serializers import NotificationSerializer, NotificationReadSerializer
from .models import PushSubscription
from django.http import JsonResponse   
import json
from pywebpush import webpush, WebPushException
from django.conf import settings 
from urllib.parse import urlparse
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from catalog.models import Product
from notifications.utils import send_push_for_notification
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

User = get_user_model()



class NotificationListAPIView(APIView):
    """
    GET /api/notifications/
    → Retourne les notifications du user connecté (triées du plus récent au plus ancien)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Notifications du user connecté
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")
        serializer = NotificationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkReadAPIView(APIView):
    """
    POST /api/notifications/<id>/read/
    → Marque UNE notification comme lue pour le user connecté.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = NotificationReadSerializer(
            notif, data={"is_read": True}, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Notification marquée comme lue."},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@csrf_exempt
def save_subscription(request):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    import json
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.tokens import AccessToken

    User = get_user_model()

    try:
        data = json.loads(request.body)
        endpoint = data.get("endpoint")
        keys = data.get("keys", {}) or {}
        p256dh = keys.get("p256dh")
        auth = keys.get("auth")
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    if not endpoint or not p256dh or not auth:
        return JsonResponse({"error": "Abonnement incomplet"}, status=400)

    # 🔐 récupérer l'utilisateur depuis le JWT (si présent)
    user = None
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ", 1)[1]
        try:
            access = AccessToken(token_str)
            user_id = access.payload.get("user_id")
            if user_id is not None:
                user = User.objects.get(id=user_id)
        except Exception as e:
            print("Erreur décodage JWT:", e)

    # ⚠️ ON NE LAISSE PLUS L’ANCIEN USER
    sub, created = PushSubscription.objects.get_or_create(
        endpoint=endpoint,
        defaults={"p256dh": p256dh, "auth": auth},
    )

    sub.p256dh = p256dh
    sub.auth = auth
    sub.user = user          # 👈 le dernier user connecté “gagne”
    sub.save()

    print(">>> Subscription sauvegardée:", sub.user, sub.endpoint[:40])
    return JsonResponse({"status": "ok"})


def _get_aud_from_endpoint(endpoint):
    parsed = urlparse(endpoint)
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"



def send_test_push(request):
    success = 0
    errors = []

    for sub in PushSubscription.objects.all():

        # 1) Construire le titre / message (perso ou générique)
        if sub.user:
            title = f"Salut {sub.user.username} 👋"
            body = "Merci d'être connecté ! Voici une notification personnalisée."

            notif = Notification.objects.create(
            user=sub.user,          # peut être None si pas connecté
            title=title,
            message=body,
            type="system",          # ou "promo" / "custom" etc.
           
            sent_at=timezone.now(), # optionnel
        )

        else:
            title = "Bonjour 🔥"
            body = "Créez un compte pour recevoir nos offres personnalisées 🔔"

        url = "http://127.0.0.1:5173/"  # la même que pour le push

        payload = {
            "title": title,
            "body": body,
            "url": url,
        }

        # 2) SAUVEGARDER EN BASE dans ton modèle Notification
       
        # 3) Envoyer la notif push comme avant
        aud = _get_aud_from_endpoint(sub.endpoint)
        if not aud:
            errors.append(f"Endpoint invalide: {sub.endpoint}")
            continue

        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=settings.WEBPUSH_VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": settings.WEBPUSH_VAPID_CLAIMS,
                    "aud": aud,
                },
            )
            success += 1
        except WebPushException as e:
            # Abonnement mort → on le supprime
            if hasattr(e, "response") and e.response is not None and e.response.status_code in (404, 410):
                sub.delete()
            errors.append(str(e))

    return JsonResponse({"status": "sent", "count": success, "errors": errors})



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notify_cart_add(request):
    """
    Envoie une notification push quand un produit est ajouté au panier.
    """
    product_id = request.data.get("product_id")
    product_name = request.data.get("product_name")

    product = get_object_or_404(Product, pk=product_id)

    user = request.user
    

    # URL vers ton panier côté front
    frontend_cart_url = getattr(
        settings,
        "FRONTEND_CART_URL",
        "http://127.0.0.1:5173/panier"
    )

    # 1) Créer la Notification en base
    notif = Notification.objects.create(
        user=user,
        title="Produit ajouté au panier 🛒",
        message=f"{product_name or product.name} a été ajouté à votre panier.",
        type="order",
        url=frontend_cart_url,
    )

    # 2) Envoi push
    sent, errors = send_push_for_notification(notif)

    return Response({
        "status": "ok",
        "sent": sent,
        "errors": errors,
    })
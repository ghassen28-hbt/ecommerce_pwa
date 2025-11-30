from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.conf import settings
from notifications.utils import notify_order_validated
from .models import Order, OrderItem
from catalog.models import Product  # adapte
from .serializers import OrderSerializer
from decimal import Decimal
from notifications.models import Notification
from notifications.utils import send_push_for_notification  # si tu as déjà ça


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    """
    Crée une commande à partir des items envoyés par le front :
    items = [{ "product_id": 1, "quantity": 2 }, ...]
    """
    user = request.user
    items_data = request.data.get("items", [])

    if not items_data:
        return Response(
            {"detail": "Le panier est vide."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # On protège toute la création dans une transaction
    with transaction.atomic():
        order = Order.objects.create(user=user, status="pending")

        total = Decimal("0.00")

        for item in items_data:
            product_id = item.get("product_id")
            quantity = int(item.get("quantity", 1))

            # On verrouille la ligne produit pour éviter 2 commandes en même temps
            product = Product.objects.select_for_update().get(pk=product_id)

            # 1) Vérifier le stock dispo
            if product.stock < quantity:
                # En levant une erreur ici, la transaction est rollback
                return Response(
                    {
                        "detail": f"Stock insuffisant pour {product.name}",
                        "available": product.stock,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # 2) Créer la ligne de commande
            line_total = Decimal(str(product.price)) * quantity

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=product.price,
                #line_total=line_total,
            )

            # 3) Mettre à jour le stock
            product.stock -= quantity
            product.save(update_fields=["stock"])

            # 4) Mettre à jour le total global
            total += line_total

        # 5) Sauvegarder le total final
        order.total_amount = total
        order.status = "confirmed"   # par exemple
        order.save(update_fields=["total_amount", "status"])

        # 6) (Optionnel) Créer une notification + push
        try:
            frontend_orders_url = getattr(
                settings,
                "FRONTEND_ORDERS_URL",
                "http://127.0.0.1:5173/orders",  # adapte à ton front
            )

            notif = Notification.objects.create(
                user=user,
                title="Commande validée ✅",
                message=f"Votre commande #{order.id} a été confirmée.",
                type="order",
                url=frontend_orders_url,
            )

            send_push_for_notification(notif)
        except Exception as e:
            # on log juste, on ne casse pas la commande si la notif échoue
            print("[ORDER] Erreur lors de l'envoi de la notif push:", e)

    # Réponse au front
    return Response(
        {
            "id": order.id,
            "total": str(order.total_amount),
            "status": order.status,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_my_orders(request):
    """
    Retourne la liste des commandes de l'utilisateur connecté.
    """
    qs = Order.objects.filter(user=request.user).order_by("-created_at")
    serializer = OrderSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    """
    Crée une commande à partir du panier, puis envoie une notif push.
    """
    serializer = OrderSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # On lie l’Order à l’utilisateur connecté
    order = serializer.save(user=request.user)

    # 👉 Envoi de la notification push
    notify_order_validated(order)

    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    """
    Retourne une commande + ses items pour l'utilisateur connecté.
    """
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({"detail": "Commande introuvable."}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderSerializer(order)
    return Response(serializer.data)
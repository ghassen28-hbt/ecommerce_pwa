# customers/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.models import User

from .models import Customer
from .serializers import (
    CustomerSerializer,
    SignupSerializer,
    LoginSerializer,
)


class SignupAPIView(APIView):
    """
    Endpoint d'inscription client.

    POST /api/customers/signup/

    Corps JSON attendu :
    {
      "full_name": "Ali",
      "email": "ali@example.com",
      "password": "monmotdepasse",
      "phone": "50123456",
      "address": "Tunis"
    }
    """

    def post(self, request, *args, **kwargs):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            # On renvoie le profil customer complet
            data = CustomerSerializer(customer).data
            return Response(data, status=status.HTTP_201_CREATED)

        # Si validation échoue → erreurs détaillées
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(APIView):
    """
    Endpoint de login client.

    POST /api/customers/login/

    Corps JSON attendu :
    {
      "email": "ali@example.com",
      "password": "monmotdepasse"
    }

    Réponse typique :
    {
      "user_id": 3,
      "customer_id": 2,
      "full_name": "Ali Gamer",
      "email": "ali@example.com"
      // plus tard : "token": "..." si tu ajoutes JWT
    }
    """

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]

        # Récupérer le customer lié (si existe)
        try:
            customer = user.customer
        except Customer.DoesNotExist:
            customer = None

        response_data = {
            "user_id": user.id,
            "customer_id": customer.id if customer else None,
            "full_name": customer.full_name if customer else (user.get_full_name() or user.username),
            "email": user.email,
        }

        return Response(response_data, status=status.HTTP_200_OK)



#------------------
class MeCustomerAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # request.user vient du JWT
        try:
            customer = Customer.objects.get(user=request.user)
        except Customer.DoesNotExist:
            return Response(
                {"detail": "Customer introuvable pour cet utilisateur."},
                status=404
            )

        serializer = CustomerSerializer(customer)
        # Tu peux enrichir un peu la réponse
        data = serializer.data
        data["user_id"] = request.user.id
        data["customer_id"] = customer.id
        return Response(data)
# customers/serializers.py


from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """
    Sérialiseur de base pour exposer un customer au frontend.
    On expose aussi l'ID du User lié.
    """

    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = Customer
        fields = ["id", "user_id", "full_name", "email", "phone", "address"]


class SignupSerializer(serializers.Serializer):
    """
    Sérialiseur pour gérer l'inscription (signup).

    Champs attendus côté frontend :
    {
      "full_name": "Ali Gamer",
      "email": "ali@example.com",
      "password": "monmotdepasse",
      "phone": "50123456",
      "address": "Tunis"
    }
    """

    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_email(self, value):
        """
        Vérifier que l'email n'est pas déjà utilisé par un User ou un Customer.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un compte avec cet email existe déjà.")
        if Customer.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un client avec cet email existe déjà.")
        return value

    def create(self, validated_data):
        """
        Création d'un User + Customer associés.
        Mot de passe hashé automatiquement (create_user).
        """
        full_name = validated_data["full_name"]
        email = validated_data["email"]
        password = validated_data["password"]
        phone = validated_data.get("phone", "")
        address = validated_data.get("address", "")

        # Générer un username simple à partir de l'email (avant @)
        username = email.split("@")[0]

        # 1) Créer le User Django (mot de passe hashé)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        # Optionnel : remplir first_name avec full_name
        user.first_name = full_name
        user.save()

        # 2) Créer le Customer lié
        customer = Customer.objects.create(
            user=user,
            full_name=full_name,
            email=email,
            phone=phone,
            address=address,
        )

        return customer


class LoginSerializer(serializers.Serializer):
    """
    Sérialiseur pour le login.

    Champs attendus :
    {
      "email": "ali@example.com",
      "password": "monmotdepasse"
    }
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate

        email = attrs.get("email")
        password = attrs.get("password")

        # On récupère le user par email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Email ou mot de passe invalide.")

        # Vérifier le mot de passe
        if not user.check_password(password):
            raise serializers.ValidationError("Email ou mot de passe invalide.")

        # Attacher l'user validé aux données
        attrs["user"] = user
        return attrs

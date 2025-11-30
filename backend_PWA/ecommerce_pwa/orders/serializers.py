from rest_framework import serializers
from .models import Order, OrderItem
from catalog.models import Product  


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "created_at",
            "status",
            "total_amount",
            "shipping_address",
            "note",
            "items",
        ]
        read_only_fields = ["user", "created_at", "total_amount", "status"]

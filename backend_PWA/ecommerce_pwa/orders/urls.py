from django.urls import path
from .views import create_order, list_my_orders, order_detail

app_name = "orders"

urlpatterns = [
    path("", list_my_orders, name="list"),               # GET /api/orders/
    path("create/", create_order, name="create"),  
    path("<int:pk>/", order_detail, name="detail"),       # POST /api/orders/create/
]

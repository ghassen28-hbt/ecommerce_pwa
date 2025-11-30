

from django.urls import path
from .views import SignupAPIView, LoginAPIView , MeCustomerAPIView

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="customer-signup"),
    path("login/", LoginAPIView.as_view(), name="customer-login"),
    path("me/", MeCustomerAPIView.as_view(), name="customers-me"),
]

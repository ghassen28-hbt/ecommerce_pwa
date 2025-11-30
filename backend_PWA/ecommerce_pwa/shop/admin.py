from django.contrib import admin
from .models import Category, Product, Customer, Order, OrderItem, PushSubscription


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'is_active', 'category')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)
    list_editable = ('price', 'stock', 'is_active')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email')
    search_fields = ('full_name', 'phone', 'email')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'created_at', 'status', 'total_amount')
    list_filter = ('status', 'created_at')
    search_fields = ('customer__full_name',)
    inlines = [OrderItemInline]


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'endpoint', 'created_at')
    search_fields = ('customer__full_name', 'endpoint')

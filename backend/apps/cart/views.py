from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartItemSerializer, CartSerializer


def _get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    """GET /api/cart/ | DELETE /api/cart/ (clear everything)"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = _get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)

    def delete(self, request):
        cart = _get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartItemListCreateView(APIView):
    """POST /api/cart/items/ - add a product to the cart. Adding a product
    already in the cart increments its quantity instead of duplicating."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = _get_or_create_cart(request.user)
        product = serializer.validated_data["product"]
        quantity = serializer.validated_data.get("quantity", 1)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": quantity})
        final_quantity = quantity if created else item.quantity + quantity

        if final_quantity > product.stock_quantity:
            if created:
                item.delete()
            raise ValidationError(f"Only {product.stock_quantity} left in stock.")

        if not created:
            item.quantity = final_quantity
            item.save(update_fields=["quantity"])

        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(generics.UpdateAPIView, generics.DestroyAPIView):
    """PATCH/DELETE /api/cart/items/<id>/"""

    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

    def perform_update(self, serializer):
        quantity = serializer.validated_data.get("quantity")
        if quantity is not None and quantity > serializer.instance.product.stock_quantity:
            raise ValidationError(f"Only {serializer.instance.product.stock_quantity} left in stock.")
        serializer.save()

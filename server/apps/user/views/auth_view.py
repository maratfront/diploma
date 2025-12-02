from drf_spectacular.utils import extend_schema
from rest_framework import (
    generics,
    permissions
)
from apps.user.serializers import AuthSerializer


@extend_schema(tags=['Пользователь'])
class AuthView(generics.RetrieveAPIView):
    """
    Получение логина пользователя
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuthSerializer

    def get_object(self):
        return self.request.user

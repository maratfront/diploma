from drf_spectacular.utils import extend_schema
from rest_framework import (
    generics,
    permissions
)
from apps.user.serializers import UpdateSerializer


@extend_schema(tags=['Пользователь'])
class UpdateView(generics.UpdateAPIView):
    """
    Обновление данных пользователя.
    Поддерживает PUT (полное обновление) и PATCH (частичное обновление).
    Пользователь может обновлять только свои данные.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UpdateSerializer

    def get_object(self):
        return self.request.user

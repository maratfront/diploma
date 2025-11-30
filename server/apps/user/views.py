from drf_spectacular.utils import extend_schema
from .models import User
from rest_framework.response import Response
from rest_framework import (
    generics,
    permissions,
    status
)
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    AuthSerializer,
    RegisterSerializer,
    UpdateSerializer
)


@extend_schema(tags=['Пользователь'])
class AuthView(generics.RetrieveAPIView):
    """
    Получение логина пользователя
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuthSerializer

    def get_object(self):
        return self.request.user


@extend_schema(tags=['Пользователь'])
class RegisterView(generics.CreateAPIView):
    """
    Регистрация нового пользователя по логину и паролю
    """
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        data = {
            "id": user.id,
            "email": user.email,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

        return Response(data, status=status.HTTP_201_CREATED)


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
        """
        Возвращает текущего аутентифицированного пользователя.
        """
        return self.request.user

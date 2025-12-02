from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.generics import ListAPIView
from apps.security.models import CryptoCategory
from apps.security.serializers import CryptoCategorySerializer


@extend_schema(
    tags=['Обучающие материалы'],
    summary='Список категорий криптографии для базы знаний',
)
class CryptoCategoryListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CryptoCategorySerializer
    queryset = CryptoCategory.objects.all()

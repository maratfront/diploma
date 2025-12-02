from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.generics import ListAPIView
from apps.security.models import CryptoAlgorithm
from apps.security.serializers import CryptoAlgorithmSerializer


@extend_schema(
    tags=['Обучающие материалы'],
    summary='Список криптоалгоритмов для базы знаний',
)
class CryptoAlgorithmListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CryptoAlgorithmSerializer
    queryset = CryptoAlgorithm.objects.select_related('category').all()

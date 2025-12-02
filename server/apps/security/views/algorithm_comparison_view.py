from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.generics import ListAPIView
from apps.security.serializers import AlgorithmComparisonSerializer
from apps.security.models import AlgorithmComparison


@extend_schema(tags=['Алгоритмы для сравнения'])
class AlgorithmComparisonListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AlgorithmComparisonSerializer
    queryset = AlgorithmComparison.objects.all()

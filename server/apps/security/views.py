from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework import permissions
from .models import AlgorithmComparison
from .serializers import AlgorithmComparisonSerializer


@extend_schema(tags=['Алгоритмы для сравнения'])
class AlgorithmComparisonListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AlgorithmComparisonSerializer
    queryset = AlgorithmComparison.objects.all()

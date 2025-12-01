from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from .crypto_service import CryptoEngine, CryptoServiceError
from .models import AlgorithmComparison
from .serializers import AlgorithmComparisonSerializer, CryptoRequestSerializer


@extend_schema(tags=['Алгоритмы для сравнения'])
class AlgorithmComparisonListView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AlgorithmComparisonSerializer
    queryset = AlgorithmComparison.objects.all()


@extend_schema(
    tags=['Криптооперации'],
    summary='Шифрование или расшифровка данных',
    request=CryptoRequestSerializer,
)
class CryptoProcessView(APIView):
    """
    Simple endpoint that mirrors the client-side crypto implementation so
    payloads can be verified or processed on the backend.
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        serializer = CryptoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        engine = CryptoEngine(algorithm=data['algorithm'], key=data.get('key'))

        try:
            if data['operation'] == 'encrypt':
                result = engine.encrypt(data['payload'])
            else:
                result = engine.decrypt(data['payload'])
        except CryptoServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "operation": data['operation'],
                "algorithm": data['algorithm'],
                "result": result,
            },
            status=status.HTTP_200_OK,
        )

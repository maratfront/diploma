from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from apps.security.crypto_service import CryptoEngine, CryptoServiceError
from apps.security.serializers import CryptoRequestSerializer


@extend_schema(
    tags=['Криптооперации'],
    summary='Шифрование, расшифровка, хэширование, цифровые подписи',
    request=CryptoRequestSerializer,
)
class CryptoProcessView(APIView):
    """
    Unified endpoint for all cryptographic operations.
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        serializer = CryptoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        engine = CryptoEngine(
            algorithm=data['algorithm'], 
            key=data.get('key'),
            is_binary=data.get('is_binary', False),
            operation=data['operation'],
            params=data.get('params')
        )

        try:
            payload = data.get('payload', '')
            result = engine.process(payload)
            
            response_data = {
                "operation": data['operation'],
                "algorithm": data['algorithm'],
                **result
            }
            
            if data.get('is_binary', False):
                response_data["is_binary"] = True
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except CryptoServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

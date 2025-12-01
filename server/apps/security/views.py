from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from .crypto_service import (
    CryptoEngine,
    CryptoServiceError,
    RSAKeyPair,
    RSASignatureError,
    generate_rsa_keypair,
    sign_message_rsa_pss,
    verify_message_rsa_pss,
)
from .models import AlgorithmComparison, UserOperationHistory
from .serializers import (
    AlgorithmComparisonSerializer,
    CryptoRequestSerializer,
    RSAGenerateKeyPairResponseSerializer,
    RSASignRequestSerializer,
    RSASignResponseSerializer,
    RSAVerifyRequestSerializer,
    RSAVerifyResponseSerializer,
    UserOperationHistorySerializer,
)


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


@extend_schema(
    tags=['Цифровые подписи'],
    summary='Генерация пары RSA ключей для цифровой подписи',
    responses={200: RSAGenerateKeyPairResponseSerializer},
)
class RSAGenerateKeyPairView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        keypair: RSAKeyPair = generate_rsa_keypair()
        data = {
            "public_key": keypair.public_key_b64,
            "private_key": keypair.private_key_b64,
        }
        serializer = RSAGenerateKeyPairResponseSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Цифровые подписи'],
    summary='Создание цифровой подписи (RSA-PSS, SHA-256)',
    request=RSASignRequestSerializer,
    responses={200: RSASignResponseSerializer},
)
class RSASignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        serializer = RSASignRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            signature_b64 = sign_message_rsa_pss(
                message=data["message"],
                private_key_b64=data["private_key"],
            )
        except RSASignatureError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = RSASignResponseSerializer(data={"signature": signature_b64})
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Цифровые подписи'],
    summary='Проверка цифровой подписи (RSA-PSS, SHA-256)',
    request=RSAVerifyRequestSerializer,
    responses={200: RSAVerifyResponseSerializer},
)
class RSAVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def post(request):
        serializer = RSAVerifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            is_valid = verify_message_rsa_pss(
                message=data["message"],
                signature_b64=data["signature"],
                public_key_b64=data["public_key"],
            )
        except RSASignatureError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = RSAVerifyResponseSerializer(data={"is_valid": is_valid})
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=['История операций'],
    summary='История криптографических операций пользователя',
)
class UserOperationHistoryView(APIView):
    """
    Просмотр и управление историей криптографических операций текущего пользователя.

    - GET: вернуть последние N операций (по умолчанию 100)
    - POST: добавить новую операцию
    - DELETE: полностью очистить историю пользователя
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        limit = 100
        queryset = (
            UserOperationHistory.objects.filter(user=request.user)
            .order_by('-timestamp')[:limit]
        )
        serializer = UserOperationHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserOperationHistorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        UserOperationHistory.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

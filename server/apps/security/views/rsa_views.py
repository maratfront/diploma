from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from apps.security.crypto_service import (
    RSAKeyPair,
    RSASignatureError,
    generate_rsa_keypair,
    sign_message_rsa_pss,
    verify_message_rsa_pss,
)
from apps.security.serializers import (
    RSAGenerateKeyPairResponseSerializer,
    RSASignRequestSerializer,
    RSASignResponseSerializer,
    RSAVerifyRequestSerializer,
    RSAVerifyResponseSerializer
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

from rest_framework import serializers


class RSAGenerateKeyPairResponseSerializer(serializers.Serializer):
    public_key = serializers.CharField(help_text="Открытый ключ RSA в кодировке Base64 (DER)")
    private_key = serializers.CharField(help_text="Приватный ключ RSA в кодировке Base64 (DER, PKCS#8)")


class RSASignRequestSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Сообщение, которое необходимо подписать")
    private_key = serializers.CharField(help_text="Приватный ключ RSA в кодировке Base64 (DER, PKCS#8)")


class RSASignResponseSerializer(serializers.Serializer):
    signature = serializers.CharField(help_text="Цифровая подпись в кодировке Base64")


class RSAVerifyRequestSerializer(serializers.Serializer):
    message = serializers.CharField(help_text="Сообщение для проверки подписи")
    signature = serializers.CharField(help_text="Подпись в кодировке Base64")
    public_key = serializers.CharField(help_text="Открытый ключ RSA в кодировке Base64 (DER)")


class RSAVerifyResponseSerializer(serializers.Serializer):
    is_valid = serializers.BooleanField(help_text="Результат проверки подписи")

from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers
from apps.security.models import (
    AlgorithmComparison,
    UserOperationHistory,
    WebImplementationExample,
    CryptoCategory,
    CryptoAlgorithm,
)


class CryptoRequestSerializer(serializers.Serializer):
    OPERATION_CHOICES = (
        ("encrypt", "encrypt"),
        ("decrypt", "decrypt"),
    )

    ALGORITHM_CHOICES = (
        ("aes-gcm", "aes-gcm"),
        ("chacha20", "chacha20"),
        ("blowfish", "blowfish"),
        ("twofish", "twofish"),
        ("caesar", "caesar"),
        ("base64", "base64"),
    )

    operation = serializers.ChoiceField(choices=OPERATION_CHOICES)
    algorithm = serializers.ChoiceField(choices=ALGORITHM_CHOICES)
    payload = serializers.CharField()
    key = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        algorithm = attrs["algorithm"]
        key = attrs.get("key", "")
        if algorithm not in {"base64"} and algorithm != "caesar" and not key:
            raise serializers.ValidationError("Необходим ключ для выбранного алгоритма")
        if algorithm == "caesar" and not key:
            attrs["key"] = "3"
        return attrs


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


@extend_schema_serializer(component_name='AlgorithmComparison')
class AlgorithmComparisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlgorithmComparison
        fields = [
            'id',
            'name',
            'security',
            'speed',
            'key_size',
            'type',
            'year',
            'explanation',
            'use_case'
        ]
        read_only_fields = fields


@extend_schema_serializer(component_name='UserOperationHistory')
class UserOperationHistorySerializer(serializers.ModelSerializer):
    """
    Сериализатор истории операций.

    На фронтенд отдаем поля в том же виде, как они сейчас хранятся в localStorage:
    - type
    - algorithm
    - input
    - output
    - timestamp
    """

    type = serializers.CharField(source='operation_type')
    input = serializers.CharField(source='input_data')
    output = serializers.CharField(source='output_data')

    class Meta:
        model = UserOperationHistory
        fields = [
            'id',
            'type',
            'algorithm',
            'input',
            'output',
            'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']


class WebImplementationExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebImplementationExample
        fields = [
            'id',
            'key',
            'title',
            'description',
            'code',
        ]
        read_only_fields = ['id']


class CryptoCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoCategory
        fields = [
            'id',
            'key',
            'title',
            'description',
            'icon',
            'color',
        ]
        read_only_fields = ['id']


class CryptoAlgorithmSerializer(serializers.ModelSerializer):
    category_key = serializers.CharField(source='category.key', read_only=True)

    class Meta:
        model = CryptoAlgorithm
        fields = [
            'id',
            'category',
            'category_key',
            'name',
            'key_size',
            'security',
            'speed',
            'description',
            'technical_details',
            'vulnerabilities',
            'simple_explanation',
            'real_world_example',
            'applications',
            'advantages',
            'disadvantages',
        ]
        read_only_fields = ['id', 'category_key']

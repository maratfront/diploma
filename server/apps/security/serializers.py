from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers
from apps.security.models import AlgorithmComparison


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

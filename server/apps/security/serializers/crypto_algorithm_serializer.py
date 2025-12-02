from rest_framework import serializers
from apps.security.models import CryptoAlgorithm


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
        read_only_fields = [
            'id',
            'category_key'
        ]

from rest_framework import serializers
from apps.security.models import CryptoCategory


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

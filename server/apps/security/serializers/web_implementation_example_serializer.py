from rest_framework import serializers
from apps.security.models import WebImplementationExample


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

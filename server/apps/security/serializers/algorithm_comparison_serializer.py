from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers
from apps.security.models import AlgorithmComparison


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

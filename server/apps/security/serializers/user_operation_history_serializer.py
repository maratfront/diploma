from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers
from apps.security.models import UserOperationHistory


@extend_schema_serializer(component_name='UserOperationHistory')
class UserOperationHistorySerializer(serializers.ModelSerializer):
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

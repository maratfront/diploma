from drf_spectacular.utils import extend_schema_serializer
from apps.user.models import User
from rest_framework import serializers


@extend_schema_serializer(component_name='User')
class AuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "patronymic",
            "date_joined",
            "department",
            "student_group"
        ]

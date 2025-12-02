from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema_serializer,
    extend_schema_field
)
from rest_framework import serializers
from apps.user.models import User
from rest_framework_simplejwt.tokens import RefreshToken


@extend_schema_serializer(component_name='User')
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    access = serializers.SerializerMethodField()
    refresh = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "patronymic",
            "email",
            "password",
            "department",
            "student_group",
            "access",
            "refresh"
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            patronymic=validated_data['patronymic'],
            email=validated_data["email"],
            password=validated_data["password"],
            department=validated_data["department"],
            student_group=validated_data["student_group"],
        )
        return user

    @extend_schema_field(OpenApiTypes.ANY)
    def get_access(self, obj):
        refresh = RefreshToken.for_user(obj)
        return str(refresh.access_token)

    @extend_schema_field(OpenApiTypes.ANY)
    def get_refresh(self, obj):
        refresh = RefreshToken.for_user(obj)
        return str(refresh)

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_serializer, extend_schema_field
from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken


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


@extend_schema_serializer(component_name='UserUpdate')
class UpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для обновления данных пользователя.
    Поддерживает как полное (PUT), так и частичное (PATCH) обновление.
    """
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "patronymic",
            "email",
            "department",
            "student_group"
        ]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "patronymic": {"required": False},
            "department": {"required": False},
            "student_group": {"required": False},
        }

    def validate_email(self, value):
        """
        Проверка уникальности email при обновлении.
        Разрешает оставить текущий email пользователя.
        """
        user = self.instance
        if user and user.email == value:
            return value
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def update(self, instance, validated_data):
        """
        Обновление экземпляра пользователя.
        Поддерживает частичное обновление через PATCH и полное через PUT.
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers
from apps.user.models import User


@extend_schema_serializer(component_name='UserUpdate')
class UpdateSerializer(serializers.ModelSerializer):
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
        user = self.instance
        if user and user.email == value:
            return value
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

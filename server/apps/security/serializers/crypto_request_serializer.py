from rest_framework import serializers


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
    is_binary = serializers.BooleanField(default=False, required=False)

    def validate(self, attrs):
        algorithm = attrs["algorithm"]
        key = attrs.get("key", "")
        is_binary = attrs.get("is_binary", False)
        
        # Для бинарных файлов Caesar не поддерживается
        if algorithm == "caesar" and is_binary:
            raise serializers.ValidationError(
                "Шифр Цезаря не поддерживается для бинарных файлов"
            )
        
        if algorithm not in {"base64"} and algorithm != "caesar" and not key:
            raise serializers.ValidationError("Необходим ключ для выбранного алгоритма")
        
        if algorithm == "caesar" and not key:
            attrs["key"] = "3"
            
        return attrs

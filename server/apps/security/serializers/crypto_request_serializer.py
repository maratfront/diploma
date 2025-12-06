from rest_framework import serializers

class CryptoRequestSerializer(serializers.Serializer):
    OPERATION_CHOICES = (
        ("encrypt", "encrypt"),
        ("decrypt", "decrypt"),
        ("hash", "hash"),
        ("sign", "sign"),
        ("verify", "verify"),
        ("generate_keypair", "generate_keypair"),
    )

    ALGORITHM_CHOICES = (
        ("aes-gcm", "aes-gcm"),
        ("chacha20", "chacha20"),
        ("blowfish", "blowfish"),
        ("twofish", "twofish"),
        ("caesar", "caesar"),
        ("base64", "base64"),
        ("sha256", "sha256"),
        ("sha512", "sha512"),
        ("argon2", "argon2"),
        ("ecc", "ecc"),
        ("rsa", "rsa"),
    )

    operation = serializers.ChoiceField(choices=OPERATION_CHOICES)
    algorithm = serializers.ChoiceField(choices=ALGORITHM_CHOICES)
    payload = serializers.CharField(required=False, allow_blank=True)
    key = serializers.CharField(required=False, allow_blank=True)
    is_binary = serializers.BooleanField(default=False, required=False)
    salt = serializers.CharField(required=False, allow_blank=True)
    params = serializers.JSONField(required=False)

    def validate(self, attrs):
        algorithm = attrs["algorithm"]
        operation = attrs["operation"]
        key = attrs.get("key", "")
        is_binary = attrs.get("is_binary", False)
        
        if algorithm == "caesar" and is_binary:
            raise serializers.ValidationError(
                "Шифр Цезаря не поддерживается для бинарных файлов"
            )
        
        if operation == "hash":
            if algorithm not in ["sha256", "sha512", "argon2"]:
                raise serializers.ValidationError(
                    "Для операции хэширования поддерживаются только sha256, sha512 и argon2"
                )
            if algorithm == "argon2":
                if "params" not in attrs:
                    attrs["params"] = {
                        "time_cost": 2,
                        "memory_cost": 512,
                        "parallelism": 2,
                        "hash_len": 32
                    }
        
        if algorithm == "ecc":
            if operation in ["sign", "verify"] and not key:
                raise serializers.ValidationError("Для ECC операций необходим ключ")
        
        if operation == "generate_keypair":
            if algorithm not in ["ecc", "rsa"]:
                raise serializers.ValidationError(
                    "Генерация ключевых пар поддерживается только для ECC и RSA"
                )
        
        if operation in ["encrypt", "decrypt"]:
            if algorithm not in {"base64"} and algorithm != "caesar" and not key:
                raise serializers.ValidationError("Необходим ключ для выбранного алгоритма")
            
            if algorithm == "caesar" and not key:
                attrs["key"] = "3"
        
        return attrs

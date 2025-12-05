from rest_framework import serializers


class CryptoRequestSerializer(serializers.Serializer):
    OPERATION_CHOICES = (
        ("encrypt", "encrypt"),
        ("decrypt", "decrypt"),
        ("hash", "hash"),
        ("sign", "sign"),
        ("verify", "verify"),
        ("derive_key", "derive_key"),
        ("generate_keypair", "generate_keypair"),
    )

    ALGORITHM_CHOICES = (
        ("aes-gcm", "aes-gcm"),
        ("chacha20", "chacha20"),
        ("blowfish", "blowfish"),
        ("twofish", "twofish"),
        ("caesar", "caesar"),
        ("base64", "base64"),
        ("rsa", "rsa"),
        ("rsa-pss", "rsa-pss"),
        ("ecc-hybrid", "ecc-hybrid"),
        ("ecdsa", "ecdsa"),
        ("ecdh", "ecdh"),
        ("sha256", "sha256"),
        ("sha3-256", "sha3-256"),
        ("argon2", "argon2"),
    )

    HASH_ALGORITHM_CHOICES = (
        ("SHA256", "SHA256"),
        ("SHA3_256", "SHA3_256"),
    )

    ECC_CURVE_CHOICES = (
        ("P-256", "P-256"),
        ("P-384", "P-384"),
        ("P-521", "P-521"),
    )

    operation = serializers.ChoiceField(choices=OPERATION_CHOICES)
    algorithm = serializers.ChoiceField(choices=ALGORITHM_CHOICES)
    payload = serializers.CharField(required=False, allow_blank=True)
    key = serializers.CharField(required=False, allow_blank=True)
    is_binary = serializers.BooleanField(default=False, required=False)
    
    hash_algorithm = serializers.ChoiceField(
        choices=HASH_ALGORITHM_CHOICES, 
        default="SHA256", 
        required=False
    )
    ecc_curve = serializers.ChoiceField(
        choices=ECC_CURVE_CHOICES, 
        default="P-256", 
        required=False
    )
    key_size = serializers.IntegerField(min_value=1024, max_value=4096, required=False)
    
    argon2_time_cost = serializers.IntegerField(min_value=1, max_value=10, required=False)
    argon2_memory_cost = serializers.IntegerField(min_value=1024, max_value=1048576, required=False)
    argon2_parallelism = serializers.IntegerField(min_value=1, max_value=16, required=False)
    argon2_hash_len = serializers.IntegerField(min_value=16, max_value=64, required=False)
    argon2_salt_len = serializers.IntegerField(min_value=8, max_value=64, required=False)

    def validate(self, attrs):
        algorithm = attrs["algorithm"]
        operation = attrs["operation"]
        key = attrs.get("key", "")
        is_binary = attrs.get("is_binary", False)
        
        if algorithm == "caesar" and is_binary:
            raise serializers.ValidationError(
                "Шифр Цезаря не поддерживается для бинарных файлов"
            )

        if operation in ["encrypt", "decrypt", "sign", "derive_key"]:
            if algorithm in ["rsa", "rsa-pss", "ecc-hybrid", "ecdsa", "ecdh"]:
                if not key and operation != "derive_key":
                    raise serializers.ValidationError(
                        f"Необходим ключ для алгоритма {algorithm}"
                    )
            elif algorithm not in {"base64", "sha256", "sha3-256", "argon2"} and algorithm != "caesar" and not key:
                raise serializers.ValidationError("Необходим ключ для выбранного алгоритма")

        if operation == "verify":
            if not key:
                pass
        
        if algorithm == "caesar" and not key:
            attrs["key"] = "3"
            
        return attrs

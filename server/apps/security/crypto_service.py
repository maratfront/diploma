from __future__ import annotations
import base64
import os
import hashlib
import json
from dataclasses import dataclass
from typing import Callable
from Crypto.Cipher import AES, Blowfish, ChaCha20
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA, ECC
from Crypto.Signature import pss, DSS
from Crypto.Util.Padding import pad, unpad

# Классы исключений
class CryptoServiceError(Exception):
    """Raised when we cannot complete the requested crypto operation."""

class RSASignatureError(CryptoServiceError):
    """Raised when RSA key generation, signing or verification fails."""

class ECCSignatureError(CryptoServiceError):
    """Raised when ECC operations fail."""

class HashingError(CryptoServiceError):
    """Raised when hashing operations fail."""

# Проверка доступности argon2
try:
    import argon2
    ARGON2_AVAILABLE = True
except ImportError:
    ARGON2_AVAILABLE = False
    print("Warning: argon2-cffi not installed. Argon2 hashing will not be available.")


def _derive_bytes(source: str, length: int) -> bytes:
    if not source:
        raise CryptoServiceError("A non-empty key is required for this algorithm")
    material = source.encode("utf-8")
    digest = b""
    while len(digest) < length:
        material = hashlib.sha256(material).digest()
        digest += material
    return digest[:length]


def _b64_encode(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")

def _b64_decode(data: str) -> bytes:
    try:
        return base64.b64decode(data.encode("utf-8"))
    except Exception as exc:
        raise CryptoServiceError("Невозможно декодировать Base64 данные") from exc

def _generate_secure_random_bytes(length: int) -> bytes:
    """Generate cryptographically secure random bytes."""
    return os.urandom(length)


# ---------------------------------------------------------------------------
# RSA helpers (digital signatures)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RSAKeyPair:
    """
    Simple container for RSA keys encoded as Base64 strings.
    """
    public_key_b64: str
    private_key_b64: str


def generate_rsa_keypair(bits: int = 2048) -> RSAKeyPair:
    """
    Generate an RSA key pair suitable for RSA-PSS signatures.
    """
    try:
        key = RSA.generate(bits)
    except Exception as exc:
        raise RSASignatureError("Не удалось сгенерировать RSA ключи") from exc

    private_der = key.export_key(format="DER", pkcs=8)
    public_der = key.public_key().export_key(format="DER")

    return RSAKeyPair(
        public_key_b64=_b64_encode(public_der),
        private_key_b64=_b64_encode(private_der),
    )


def sign_message_rsa_pss(message: str, private_key_b64: str) -> str:
    """
    Create RSA-PSS signature over the provided message.
    """
    try:
        private_der = _b64_decode(private_key_b64)
        private_key = RSA.import_key(private_der)
    except Exception as exc:
        raise RSASignatureError("Некорректный приватный ключ RSA") from exc

    try:
        digest = SHA256.new(message.encode("utf-8"))
        signer = pss.new(private_key)
        signature = signer.sign(digest)
    except Exception as exc:
        raise RSASignatureError("Не удалось создать цифровую подпись") from exc

    return _b64_encode(signature)


def verify_message_rsa_pss(message: str, signature_b64: str, public_key_b64: str) -> bool:
    """
    Verify RSA-PSS signature for the given message.
    """
    try:
        public_der = _b64_decode(public_key_b64)
        public_key = RSA.import_key(public_der)
    except Exception as exc:
        raise RSASignatureError("Некорректный открытый ключ RSA") from exc

    try:
        signature = _b64_decode(signature_b64)
        digest = SHA256.new(message.encode("utf-8"))
        verifier = pss.new(public_key)
        verifier.verify(digest, signature)
        return True
    except (ValueError, TypeError):
        return False
    except Exception as exc:
        raise RSASignatureError("Ошибка при проверке подписи") from exc


# ---------------------------------------------------------------------------
# Hashing functions
# ---------------------------------------------------------------------------

def hash_sha256(data: str) -> str:
    """Compute SHA-256 hash of the input data."""
    try:
        if isinstance(data, str):
            data_bytes = data.encode('utf-8')
        else:
            data_bytes = data
        
        return hashlib.sha256(data_bytes).hexdigest()
    except Exception as exc:
        raise HashingError(f"Ошибка при вычислении SHA-256: {str(exc)}")

def hash_argon2(data: str, time_cost: int = 2, memory_cost: int = 512, 
               parallelism: int = 2, hash_len: int = 32) -> dict:
    """
    Compute Argon2 hash of the input data.
    Returns a simplified dictionary with only hash.
    """
    if not ARGON2_AVAILABLE:
        raise HashingError("Argon2 не доступен. Установите argon2-cffi: pip install argon2-cffi")
    
    try:
        hasher = argon2.PasswordHasher(
            time_cost=time_cost,
            memory_cost=memory_cost,
            parallelism=parallelism,
            hash_len=hash_len,
            type=argon2.Type.ID
        )
        
        hash_result = hasher.hash(data)
        
        # Возвращаем ТОЛЬКО хэш, без лишних деталей
        return {
            "hash": hash_result  # ✅ Только хэш, без salt и params
        }
    except Exception as exc:
        raise HashingError(f"Ошибка при вычислении Argon2: {str(exc)}")

def verify_argon2(data: str, hash_value: str) -> bool:
    """Verify data against Argon2 hash."""
    if not ARGON2_AVAILABLE:
        raise HashingError("Argon2 не доступен. Установите argon2-cffi: pip install argon2-cffi")
    
    try:
        hasher = argon2.PasswordHasher()
        return hasher.verify(hash_value, data)
    except argon2.exceptions.VerifyMismatchError:
        return False
    except Exception as exc:
        raise HashingError(f"Ошибка при проверке Argon2: {str(exc)}")

# ---------------------------------------------------------------------------
# ECC helpers (digital signatures)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ECCKeyPair:
    """
    Simple container for ECC keys encoded as Base64 strings.
    """
    public_key_b64: str
    private_key_b64: str
    curve: str

def generate_ecc_keypair(curve: str = "P-256") -> ECCKeyPair:
    """
    Generate an ECC key pair suitable for ECDSA signatures.
    """
    try:
        key = ECC.generate(curve=curve)
    except Exception as exc:
        raise ECCSignatureError(f"Не удалось сгенерировать ECC ключи для кривой {curve}") from exc

    private_pem = key.export_key(format="PEM")
    public_pem = key.public_key().export_key(format="PEM")

    return ECCKeyPair(
        public_key_b64=_b64_encode(public_pem.encode('utf-8')),
        private_key_b64=_b64_encode(private_pem.encode('utf-8')),
        curve=curve
    )

def sign_message_ecc(message: str, private_key_b64: str, hash_algorithm: str = "SHA256") -> str:
    """
    Create ECDSA signature over the provided message.
    """
    try:
        private_pem = _b64_decode(private_key_b64).decode('utf-8')
        private_key = ECC.import_key(private_pem)
    except Exception as exc:
        raise ECCSignatureError("Некорректный приватный ключ ECC") from exc

    try:
        # Выбор хэш-алгоритма
        if hash_algorithm == "SHA256":
            hash_obj = SHA256.new(message.encode("utf-8"))
        elif hash_algorithm == "SHA512":
            hash_obj = hashlib.sha512(message.encode("utf-8"))
        else:
            raise ValueError(f"Неподдерживаемый хэш-алгоритм: {hash_algorithm}")
        
        signer = DSS.new(private_key, 'fips-186-3')
        signature = signer.sign(hash_obj)
        return _b64_encode(signature)
    except Exception as exc:
        raise ECCSignatureError("Не удалось создать цифровую подпись ECC") from exc

def verify_message_ecc(message: str, signature_b64: str, public_key_b64: str, 
                      hash_algorithm: str = "SHA256") -> bool:
    """
    Verify ECDSA signature for the given message.
    """
    try:
        public_pem = _b64_decode(public_key_b64).decode('utf-8')
        public_key = ECC.import_key(public_pem)
    except Exception as exc:
        raise ECCSignatureError("Некорректный открытый ключ ECC") from exc

    try:
        signature = _b64_decode(signature_b64)
        
        if hash_algorithm == "SHA256":
            hash_obj = SHA256.new(message.encode("utf-8"))
        elif hash_algorithm == "SHA512":
            hash_obj = hashlib.sha512(message.encode("utf-8"))
        else:
            raise ValueError(f"Неподдерживаемый хэш-алгоритм: {hash_algorithm}")
        
        verifier = DSS.new(public_key, 'fips-186-3')
        verifier.verify(hash_obj, signature)
        return True
    except (ValueError, TypeError):
        return False
    except Exception as exc:
        raise ECCSignatureError("Ошибка при проверке подписи ECC") from exc

def encrypt_ecc(message: str, public_key_b64: str) -> str:
    """
    Encrypt message using ECC public key (ECDH + AES).
    Returns a simple JSON object, not a string.
    """
    try:
        ephemeral_key = ECC.generate(curve='P-256')
        
        public_pem = _b64_decode(public_key_b64).decode('utf-8')
        recipient_key = ECC.import_key(public_pem)
        
        shared_secret = ephemeral_key.d * recipient_key.pointQ
        
        shared_key = hashlib.sha256(str(shared_secret.x).encode()).digest()[:32]
        
        nonce = os.urandom(12)
        cipher = AES.new(shared_key, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(message.encode('utf-8'))
        
        ephemeral_pubkey = ephemeral_key.public_key().export_key(format="PEM")
        
        return {
            "ephemeral_pubkey": _b64_encode(ephemeral_pubkey.encode('utf-8')),
            "nonce": _b64_encode(nonce),
            "tag": _b64_encode(tag),
            "ciphertext": _b64_encode(ciphertext)
        }
    except Exception as exc:
        raise CryptoServiceError(f"Ошибка при шифровании ECC: {str(exc)}") from exc

def decrypt_ecc(encrypted_data: dict, private_key_b64: str) -> str:
    """
    Decrypt message using ECC private key.
    Accepts a dict (parsed from JSON).
    """
    try:
        if isinstance(encrypted_data, str):
            data = json.loads(encrypted_data)
        else:
            data = encrypted_data
        
        private_pem = _b64_decode(private_key_b64).decode('utf-8')
        private_key = ECC.import_key(private_pem)
        
        ephemeral_pubkey_pem = _b64_decode(data["ephemeral_pubkey"]).decode('utf-8')
        ephemeral_pubkey = ECC.import_key(ephemeral_pubkey_pem)
        
        shared_secret = private_key.d * ephemeral_pubkey.pointQ
        
        shared_key = hashlib.sha256(str(shared_secret.x).encode()).digest()[:32]
        
        nonce = _b64_decode(data["nonce"])
        tag = _b64_decode(data["tag"])
        ciphertext = _b64_decode(data["ciphertext"])
        
        cipher = AES.new(shared_key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        
        return plaintext.decode('utf-8')
    except Exception as exc:
        raise CryptoServiceError(f"Ошибка при расшифровании ECC: {str(exc)}") from exc

@dataclass(frozen=True)
class CryptoEngine:
    """
    High-level helper that exposes encrypt/decrypt entry points.
    """
    algorithm: str
    key: str | None
    is_binary: bool = False
    operation: str = "encrypt"
    params: dict = None

    def _require_key(self) -> str:
        if self.algorithm in {"base64", "sha256", "argon2"}:
            return ""
        if self.algorithm == "caesar":
            return self.key or "3"
        if not self.key:
            raise CryptoServiceError("Необходим ключ для выбранного алгоритма")
        return self.key

    # Public API
    def process(self, payload: str = "") -> dict:
        """Основной метод для обработки всех операций."""
        try:
            if self.algorithm in ["sha256", "argon2"] and self.operation == "verify":
                if self.params and "hash" in self.params:
                    return self._verify_hash(payload, self.params["hash"])
                else:
                    raise CryptoServiceError("Для проверки хэша необходимо передать hash в параметрах")
            
            if self.algorithm in ["sha256", "argon2"]:
                if self.operation == "hash":
                    return self._hash(payload)
                else:
                    raise CryptoServiceError(f"Неподдерживаемая операция '{self.operation}' для алгоритма {self.algorithm}")
            
            elif self.algorithm in ["ecc", "rsa"] and self.operation == "generate_keypair":
                return self._generate_keypair()
            
            elif self.algorithm == "ecc" and self.operation in ["sign", "verify"]:
                return self._ecc_operation(payload)
            
            elif self.algorithm == "ecc" and self.operation in ["encrypt", "decrypt"]:
                return self._ecc_crypto(payload)
            
            elif self.is_binary:
                return {"result": self._dispatch_binary(self.operation)(payload)}
            else:
                return {"result": self._dispatch(self.operation)(payload)}
                
        except Exception as exc:
            raise CryptoServiceError(str(exc))

    def _hash(self, payload: str) -> dict:
        """Обработка хэширования."""
        if self.algorithm == "sha256":
            return {"hash": hash_sha256(payload)}
        elif self.algorithm == "argon2":
            if not ARGON2_AVAILABLE:
                raise HashingError("Argon2 не доступен. Установите argon2-cffi: pip install argon2-cffi")
            
            params = self.params or {}
            result = hash_argon2(
                payload,
                time_cost=params.get("time_cost", 2),
                memory_cost=params.get("memory_cost", 512),
                parallelism=params.get("parallelism", 2),
                hash_len=params.get("hash_len", 32)
            )
            return {"hash": result["hash"]}
        raise CryptoServiceError(f"Неподдерживаемый алгоритм хэширования: {self.algorithm}")

    def _verify_hash(self, payload: str, hash_value: str) -> dict:
        """Проверка хэша для SHA-256 и Argon2."""
        try:
            if self.algorithm == "sha256":
                # Для SHA-256 просто сравниваем хэши
                computed_hash = hash_sha256(payload)
                return {"is_valid": computed_hash == hash_value}
            
            elif self.algorithm == "argon2":
                if not ARGON2_AVAILABLE:
                    raise HashingError("Argon2 не доступен. Установите argon2-cffi: pip install argon2-cffi")
                
                # Для Argon2 используем специальную функцию проверки
                try:
                    hasher = argon2.PasswordHasher()
                    hasher.verify(hash_value, payload)
                    return {"is_valid": True}
                except argon2.exceptions.VerifyMismatchError:
                    return {"is_valid": False}
                except Exception as e:
                    raise HashingError(f"Ошибка при проверке Argon2: {str(e)}")
            
            else:
                raise CryptoServiceError(f"Неподдерживаемый алгоритм для проверки: {self.algorithm}")
                
        except Exception as exc:
            raise HashingError(f"Ошибка при проверке хэша: {str(exc)}")

    def _verify_argon2(self, payload: str, hash_value: str) -> dict:
        """Verify Argon2 hash."""
        try:
            is_valid = verify_argon2(payload, hash_value)
            return {"is_valid": is_valid}
        except Exception as exc:
            raise HashingError(f"Ошибка при проверке Argon2: {str(exc)}") from exc

    def _generate_keypair(self) -> dict:
        """Генерация ключевых пар."""
        if self.algorithm == "ecc":
            keypair = generate_ecc_keypair(self.params.get("curve", "P-256") if self.params else "P-256")
            return {
                "public_key": keypair.public_key_b64,
                "private_key": keypair.private_key_b64,
                "curve": keypair.curve
            }
        elif self.algorithm == "rsa":
            from .crypto_service import generate_rsa_keypair  # Импортируем здесь
            keypair = generate_rsa_keypair(self.params.get("bits", 2048) if self.params else 2048)
            return {
                "public_key": keypair.public_key_b64,
                "private_key": keypair.private_key_b64
            }
        raise CryptoServiceError(f"Неподдерживаемый алгоритм для генерации ключей: {self.algorithm}")

    def _ecc_operation(self, payload: str) -> dict:
        """Операции с ECC (подпись/верификация)."""
        if not self.key:
            raise CryptoServiceError("Для ECC операций необходим ключ")
        
        params = self.params or {}
        hash_algorithm = params.get("hash_algorithm", "SHA256")
        
        if self.operation == "sign":
            signature = sign_message_ecc(payload, self.key, hash_algorithm)
            return {"signature": signature}
        elif self.operation == "verify":
            signature = params.get("signature", "")
            if not signature:
                raise CryptoServiceError("Для верификации необходима подпись")
            is_valid = verify_message_ecc(payload, signature, self.key, hash_algorithm)
            return {"is_valid": is_valid}
        
        raise CryptoServiceError(f"Неподдерживаемая ECC операция: {self.operation}")

    def _ecc_crypto(self, payload: str) -> dict:
        """Шифрование/дешифрование ECC."""
        if not self.key:
            raise CryptoServiceError("Для ECC шифрования необходим ключ")
        
        if self.operation == "encrypt":
            encrypted = encrypt_ecc(payload, self.key)
            return {"encrypted": encrypted}  # ✅ Возвращаем объект, а не строку
        elif self.operation == "decrypt":
            # Парсим JSON, если это строка
            if isinstance(payload, str):
                try:
                    payload_data = json.loads(payload)
                except json.JSONDecodeError:
                    raise CryptoServiceError("Некорректный JSON для расшифрования")
            else:
                payload_data = payload
            
            decrypted = decrypt_ecc(payload_data, self.key)
            return {"decrypted": decrypted}
        
        raise CryptoServiceError(f"Неподдерживаемая ECC операция: {self.operation}")

    # Public API
    def encrypt(self, payload: str) -> str:
        if self.is_binary:
            # Для бинарных данных payload - это base64 строка
            return self._dispatch_binary("encrypt")(payload)
        return self._dispatch("encrypt")(payload)

    def decrypt(self, payload: str) -> str:
        if self.is_binary:
            # Для бинарных данных payload - это base64 строка
            return self._dispatch_binary("decrypt")(payload)
        return self._dispatch("decrypt")(payload)

    # Internal helpers для текстовых данных
    def _dispatch(self, operation: str) -> Callable[[str], str]:
        lookup = {
            "aes-gcm": (self._aes_encrypt, self._aes_decrypt),
            "chacha20": (self._chacha_encrypt, self._chacha_decrypt),
            "blowfish": (self._blowfish_encrypt, self._blowfish_decrypt),
            "twofish": (self._twofish_encrypt, self._twofish_decrypt),
            "caesar": (self._caesar_encrypt, self._caesar_decrypt),
            "base64": (self._base64_encode, self._base64_decode),
        }

        if self.algorithm not in lookup:
            raise CryptoServiceError(f"Неподдерживаемый алгоритм: {self.algorithm}")

        encryptor, decryptor = lookup[self.algorithm]
        return encryptor if operation == "encrypt" else decryptor

    # Internal helpers для бинарных данных
    def _dispatch_binary(self, operation: str) -> Callable[[str], str]:
        lookup = {
            "aes-gcm": (self._aes_encrypt_binary, self._aes_decrypt_binary),
            "chacha20": (self._chacha_encrypt_binary, self._chacha_decrypt_binary),
            "blowfish": (self._blowfish_encrypt_binary, self._blowfish_decrypt_binary),
            "twofish": (self._twofish_encrypt_binary, self._twofish_decrypt_binary),
            "base64": (self._base64_encode_binary, self._base64_decode_binary),
        }

        if self.algorithm not in lookup:
            raise CryptoServiceError(f"Неподдерживаемый алгоритм для бинарных данных: {self.algorithm}")
        
        if self.algorithm == "caesar":
            raise CryptoServiceError("Шифр Цезаря не поддерживается для бинарных данных")

        encryptor, decryptor = lookup[self.algorithm]
        return encryptor if operation == "encrypt" else decryptor

    # AES (GCM) - для текстовых данных
    def _aes_encrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = _generate_secure_random_bytes(12)
        cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(payload.encode("utf-8"))
        return _b64_encode(nonce + tag + ciphertext)

    def _aes_decrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        data = _b64_decode(payload)
        nonce, tag, ciphertext = data[:12], data[12:28], data[28:]
        cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
        try:
            plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        except ValueError as exc:
            raise CryptoServiceError("Неверный ключ или поврежденные данные") from exc
        return plaintext.decode("utf-8")

    # AES (GCM) - для бинарных данных
    def _aes_encrypt_binary(self, payload: str) -> str:
        # payload - это base64 строка с бинарными данными
        data_bytes = _b64_decode(payload)
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = _generate_secure_random_bytes(12)
        cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(data_bytes)
        return _b64_encode(nonce + tag + ciphertext)

    def _aes_decrypt_binary(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        data = _b64_decode(payload)
        nonce, tag, ciphertext = data[:12], data[12:28], data[28:]
        cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
        try:
            plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        except ValueError as exc:
            raise CryptoServiceError("Неверный ключ или поврежденные данные") from exc
        return _b64_encode(plaintext)  # Возвращаем base64 строку

    # ChaCha20 - для текстовых данных
    def _chacha_encrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = _generate_secure_random_bytes(12)
        cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
        ciphertext = cipher.encrypt(payload.encode("utf-8"))
        return _b64_encode(nonce + ciphertext)

    def _chacha_decrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        data = _b64_decode(payload)
        nonce, ciphertext = data[:12], data[12:]
        cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
        plaintext = cipher.decrypt(ciphertext)
        return plaintext.decode("utf-8")

    # ChaCha20 - для бинарных данных
    def _chacha_encrypt_binary(self, payload: str) -> str:
        data_bytes = _b64_decode(payload)
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = _generate_secure_random_bytes(12)
        cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
        ciphertext = cipher.encrypt(data_bytes)
        return _b64_encode(nonce + ciphertext)

    def _chacha_decrypt_binary(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        data = _b64_decode(payload)
        nonce, ciphertext = data[:12], data[12:]
        cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
        plaintext = cipher.decrypt(ciphertext)
        return _b64_encode(plaintext)  # Возвращаем base64 строку

    # Blowfish (CBC) - для текстовых данных
    def _blowfish_encrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 56)
        iv = _generate_secure_random_bytes(Blowfish.block_size)
        cipher = Blowfish.new(key_bytes, Blowfish.MODE_CBC, iv=iv)
        ciphertext = cipher.encrypt(pad(payload.encode("utf-8"), Blowfish.block_size))
        return _b64_encode(iv + ciphertext)

    def _blowfish_decrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 56)
        data = _b64_decode(payload)
        iv, ciphertext = data[:Blowfish.block_size], data[Blowfish.block_size:]
        cipher = Blowfish.new(key_bytes, Blowfish.MODE_CBC, iv=iv)
        plaintext = unpad(cipher.decrypt(ciphertext), Blowfish.block_size)
        return plaintext.decode("utf-8")

    # Blowfish (CBC) - для бинарных данных
    def _blowfish_encrypt_binary(self, payload: str) -> str:
        data_bytes = _b64_decode(payload)
        key_bytes = _derive_bytes(self._require_key(), 56)
        iv = _generate_secure_random_bytes(Blowfish.block_size)
        cipher = Blowfish.new(key_bytes, Blowfish.MODE_CBC, iv=iv)
        ciphertext = cipher.encrypt(pad(data_bytes, Blowfish.block_size))
        return _b64_encode(iv + ciphertext)

    def _blowfish_decrypt_binary(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 56)
        data = _b64_decode(payload)
        iv, ciphertext = data[:Blowfish.block_size], data[Blowfish.block_size:]
        cipher = Blowfish.new(key_bytes, Blowfish.MODE_CBC, iv=iv)
        plaintext = unpad(cipher.decrypt(ciphertext), Blowfish.block_size)
        return _b64_encode(plaintext)  # Возвращаем base64 строку

    # Twofish - для текстовых данных
    def _twofish_encrypt(self, payload: str) -> str:
        try:
            key_bytes = _derive_bytes(self._require_key(), 32)

            from Crypto.Cipher import Twofish

            iv = _generate_secure_random_bytes(16)
            cipher = Twofish.new(key_bytes)
            padded_data = pad(payload.encode("utf-8"), Twofish.block_size)
            blocks = [padded_data[i:i+16] for i in range(0, len(padded_data), 16)]
            ciphertext = b""
            prev = iv
            
            for block in blocks:
                xored = bytes(a ^ b for a, b in zip(block, prev))
                encrypted = cipher.encrypt(xored)
                ciphertext += encrypted
                prev = encrypted

            return _b64_encode(iv + ciphertext)
            
        except ImportError:
            key_bytes = _derive_bytes(self._require_key(), 32)
            iv = _generate_secure_random_bytes(AES.block_size)
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv)
            ciphertext = cipher.encrypt(pad(payload.encode("utf-8"), AES.block_size))
            return _b64_encode(iv + ciphertext)

    def _twofish_decrypt(self, payload: str) -> str:
        try:
            key_bytes = _derive_bytes(self._require_key(), 32)
            
            from Crypto.Cipher import Twofish
            
            data = _b64_decode(payload)
            iv, ciphertext = data[:16], data[16:]
            
            cipher = Twofish.new(key_bytes)

            blocks = [ciphertext[i:i+16] for i in range(0, len(ciphertext), 16)]
            plaintext = b""
            prev = iv
            
            for block in blocks:
                decrypted = cipher.decrypt(block)
                xored = bytes(a ^ b for a, b in zip(decrypted, prev))
                plaintext += xored
                prev = block

            unpadded = unpad(plaintext, Twofish.block_size)
            return unpadded.decode("utf-8")
            
        except ImportError:
            key_bytes = _derive_bytes(self._require_key(), 32)
            data = _b64_decode(payload)
            iv, ciphertext = data[:AES.block_size], data[AES.block_size:]
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv)
            plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)
            return plaintext.decode("utf-8")

    # Twofish - для бинарных данных
    def _twofish_encrypt_binary(self, payload: str) -> str:
        data_bytes = _b64_decode(payload)
        
        try:
            key_bytes = _derive_bytes(self._require_key(), 32)

            from Crypto.Cipher import Twofish

            iv = _generate_secure_random_bytes(16)
            cipher = Twofish.new(key_bytes)
            padded_data = pad(data_bytes, Twofish.block_size)
            blocks = [padded_data[i:i+16] for i in range(0, len(padded_data), 16)]
            ciphertext = b""
            prev = iv
            
            for block in blocks:
                xored = bytes(a ^ b for a, b in zip(block, prev))
                encrypted = cipher.encrypt(xored)
                ciphertext += encrypted
                prev = encrypted

            return _b64_encode(iv + ciphertext)
            
        except ImportError:
            key_bytes = _derive_bytes(self._require_key(), 32)
            iv = _generate_secure_random_bytes(AES.block_size)
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv)
            ciphertext = cipher.encrypt(pad(data_bytes, AES.block_size))
            return _b64_encode(iv + ciphertext)

    def _twofish_decrypt_binary(self, payload: str) -> str:
        try:
            key_bytes = _derive_bytes(self._require_key(), 32)
            
            from Crypto.Cipher import Twofish
            
            data = _b64_decode(payload)
            iv, ciphertext = data[:16], data[16:]
            
            cipher = Twofish.new(key_bytes)

            blocks = [ciphertext[i:i+16] for i in range(0, len(ciphertext), 16)]
            plaintext = b""
            prev = iv
            
            for block in blocks:
                decrypted = cipher.decrypt(block)
                xored = bytes(a ^ b for a, b in zip(decrypted, prev))
                plaintext += xored
                prev = block

            unpadded = unpad(plaintext, Twofish.block_size)
            return _b64_encode(unpadded)  # Возвращаем base64 строку
            
        except ImportError:
            key_bytes = _derive_bytes(self._require_key(), 32)
            data = _b64_decode(payload)
            iv, ciphertext = data[:AES.block_size], data[AES.block_size:]
            cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv)
            plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)
            return _b64_encode(plaintext)  # Возвращаем base64 строку

    # Caesar - только для текстовых данных
    def _caesar_encrypt(self, payload: str) -> str:
        shift = int(self._require_key()) % 26
        return "".join(self._shift_char(ch, shift) for ch in payload)

    def _caesar_decrypt(self, payload: str) -> str:
        shift = int(self._require_key()) % 26
        return "".join(self._shift_char(ch, -shift) for ch in payload)

    @staticmethod
    def _shift_char(char: str, shift: int) -> str:
        def _shift_range(start: int, end: int, alphabet: int) -> str | None:
            code = ord(char)
            if start <= code <= end:
                base = start
                return chr(((code - base + shift) % alphabet) + base)
            return None

        return (
            _shift_range(65, 90, 26)
            or _shift_range(97, 122, 26)
            or _shift_range(1040, 1071, 33)
            or _shift_range(1072, 1103, 33)
            or char
        )

    # Base64 - для текстовых данных
    @staticmethod
    def _base64_encode(payload: str) -> str:
        return _b64_encode(payload.encode("utf-8"))

    @staticmethod
    def _base64_decode(payload: str) -> str:
        return _b64_decode(payload).decode("utf-8")

    # Base64 - для бинарных данных
    @staticmethod
    def _base64_encode_binary(payload: str) -> str:
        # payload уже base64 строка, просто возвращаем как есть
        return payload

    @staticmethod
    def _base64_decode_binary(payload: str) -> str:
        # payload уже base64 строка, просто возвращаем как есть
        return payload

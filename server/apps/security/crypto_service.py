from __future__ import annotations
import base64
import os
import json
from dataclasses import dataclass
from hashlib import sha256
from typing import Callable, Optional, Tuple
from Crypto.Cipher import AES, Blowfish, ChaCha20
from Crypto.Hash import SHA256, SHA3_256
from Crypto.PublicKey import RSA, ECC
from Crypto.Signature import pss, DSS
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
from Crypto.Protocol.KDF import scrypt, HKDF
import argon2


class CryptoServiceError(Exception):
    """Raised when we cannot complete the requested crypto operation."""


class RSASignatureError(CryptoServiceError):
    """Raised when RSA key generation, signing or verification fails."""


class ECCError(CryptoServiceError):
    """Raised when ECC operations fail."""


class Argon2Error(CryptoServiceError):
    """Raised when Argon2 operations fail."""


def _derive_bytes(source: str, length: int) -> bytes:
    if not source:
        raise CryptoServiceError("A non-empty key is required for this algorithm")

    material = source.encode("utf-8")
    digest = b""

    while len(digest) < length:
        material = sha256(material).digest()
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
# RSA Helpers (Encryption/Decryption and Signatures)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RSAKeyPair:
    """Container for RSA keys encoded as Base64 strings."""
    public_key_b64: str
    private_key_b64: str


def generate_rsa_keypair(bits: int = 2048) -> RSAKeyPair:
    """Generate an RSA key pair for encryption and signatures."""
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


def rsa_encrypt(payload: str, public_key_b64: str) -> str:
    """Encrypt data using RSA-OAEP."""
    try:
        public_der = _b64_decode(public_key_b64)
        public_key = RSA.import_key(public_der)
        cipher = PKCS1_OAEP.new(public_key)
        ciphertext = cipher.encrypt(payload.encode("utf-8"))
        return _b64_encode(ciphertext)
    except Exception as exc:
        raise CryptoServiceError(f"RSA encryption failed: {exc}") from exc


def rsa_decrypt(payload: str, private_key_b64: str) -> str:
    """Decrypt data using RSA-OAEP."""
    try:
        private_der = _b64_decode(private_key_b64)
        private_key = RSA.import_key(private_der)
        cipher = PKCS1_OAEP.new(private_key)
        ciphertext = _b64_decode(payload)
        plaintext = cipher.decrypt(ciphertext)
        return plaintext.decode("utf-8")
    except Exception as exc:
        raise CryptoServiceError(f"RSA decryption failed: {exc}") from exc


def sign_message_rsa_pss(message: str, private_key_b64: str) -> str:
    """Create RSA-PSS signature over the provided message."""
    try:
        private_der = _b64_decode(private_key_b64)
        private_key = RSA.import_key(private_der)
        digest = SHA256.new(message.encode("utf-8"))
        signer = pss.new(private_key)
        signature = signer.sign(digest)
        return _b64_encode(signature)
    except Exception as exc:
        raise RSASignatureError("Не удалось создать цифровую подпись") from exc


def verify_message_rsa_pss(message: str, signature_b64: str, public_key_b64: str) -> bool:
    """Verify RSA-PSS signature for the given message."""
    try:
        public_der = _b64_decode(public_key_b64)
        public_key = RSA.import_key(public_der)
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
# SHA-256 Helpers
# ---------------------------------------------------------------------------

def sha256_hash(payload: str) -> str:
    """Compute SHA-256 hash of the payload."""
    try:
        if not payload:
            raise CryptoServiceError("Payload cannot be empty for hashing")
        return sha256(payload.encode("utf-8")).hexdigest()
    except Exception as exc:
        raise CryptoServiceError(f"SHA-256 hashing failed: {exc}") from exc


def sha256_hash_binary(payload: str) -> str:
    """Compute SHA-256 hash of binary data (base64 encoded)."""
    try:
        data = _b64_decode(payload)
        return sha256(data).hexdigest()
    except Exception as exc:
        raise CryptoServiceError(f"SHA-256 hashing failed: {exc}") from exc


def sha3_256_hash(payload: str) -> str:
    """Compute SHA3-256 hash of the payload."""
    try:
        if not payload:
            raise CryptoServiceError("Payload cannot be empty for hashing")
        return SHA3_256.new(payload.encode("utf-8")).hexdigest()
    except Exception as exc:
        raise CryptoServiceError(f"SHA3-256 hashing failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Argon2 Helpers
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Argon2Params:
    """Argon2 parameters."""
    time_cost: int = 3
    memory_cost: int = 65536  # 64 MB
    parallelism: int = 4
    hash_len: int = 32
    salt_len: int = 16


def argon2_hash(password: str, params: Optional[Argon2Params] = None) -> str:
    """Generate Argon2 hash of a password."""
    try:
        if not password:
            raise CryptoServiceError("Password cannot be empty for Argon2")
        
        if params is None:
            params = Argon2Params()
        
        # Generate random salt
        salt = _generate_secure_random_bytes(params.salt_len)
        
        # Create Argon2 hash
        hasher = argon2.PasswordHasher(
            time_cost=params.time_cost,
            memory_cost=params.memory_cost,
            parallelism=params.parallelism,
            hash_len=params.hash_len,
            salt_len=params.salt_len
        )
        
        # Argon2id is recommended (default in argon2 library)
        argon2_hash_str = hasher.hash(password, salt=salt)
        
        # Return as JSON with parameters for verification
        result = {
            "hash": argon2_hash_str,
            "algorithm": "argon2id",
            "params": {
                "time_cost": params.time_cost,
                "memory_cost": params.memory_cost,
                "parallelism": params.parallelism,
                "hash_len": params.hash_len,
                "salt_len": params.salt_len
            }
        }
        return json.dumps(result)
    except Exception as exc:
        raise Argon2Error(f"Argon2 hashing failed: {exc}") from exc


def argon2_verify(password: str, argon2_hash_str: str) -> bool:
    """Verify password against Argon2 hash."""
    try:
        hasher = argon2.PasswordHasher()
        return hasher.verify(argon2_hash_str, password)
    except (argon2.exceptions.VerifyMismatchError, argon2.exceptions.VerificationError):
        return False
    except Exception as exc:
        raise Argon2Error(f"Argon2 verification failed: {exc}") from exc


def argon2_derive_key(password: str, salt: Optional[bytes] = None, key_len: int = 32) -> str:
    """Derive key from password using Argon2."""
    try:
        if not password:
            raise CryptoServiceError("Password cannot be empty for key derivation")
        
        if salt is None:
            salt = _generate_secure_random_bytes(16)
        elif isinstance(salt, str):
            salt = _b64_decode(salt)
        
        # Use Argon2 for key derivation
        key = argon2.low_level.hash_secret_raw(
            secret=password.encode("utf-8"),
            salt=salt,
            time_cost=3,
            memory_cost=65536,
            parallelism=4,
            hash_len=key_len,
            type=argon2.low_level.Type.ID
        )
        
        return _b64_encode(key)
    except Exception as exc:
        raise Argon2Error(f"Argon2 key derivation failed: {exc}") from exc


# ---------------------------------------------------------------------------
# ECC Helpers (ECDH and ECDSA)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ECCKeyPair:
    """Container for ECC keys encoded as Base64 strings."""
    public_key_b64: str
    private_key_b64: str
    curve: str


def generate_ecc_keypair(curve: str = "P-256") -> ECCKeyPair:
    """Generate an ECC key pair for ECDH or ECDSA."""
    try:
        if curve not in ["P-256", "P-384", "P-521"]:
            raise ValueError(f"Unsupported curve: {curve}")
        
        key = ECC.generate(curve=curve)
        
        # Export keys
        private_der = key.export_key(format="DER")
        public_der = key.public_key().export_key(format="DER")
        
        return ECCKeyPair(
            public_key_b64=_b64_encode(public_der),
            private_key_b64=_b64_encode(private_der),
            curve=curve
        )
    except Exception as exc:
        raise ECCError(f"Failed to generate ECC key pair: {exc}") from exc


def ecdh_derive_shared_secret(private_key_b64: str, public_key_b64: str) -> str:
    """Derive shared secret using ECDH."""
    try:
        # Import keys
        private_der = _b64_decode(private_key_b64)
        public_der = _b64_decode(public_key_b64)
        
        private_key = ECC.import_key(private_der)
        public_key = ECC.import_key(public_der)
        
        # Perform ECDH
        shared_secret = private_key.d * public_key.pointQ
        
        # Convert to bytes (using x coordinate)
        shared_secret_bytes = int(shared_secret.x).to_bytes(
            (int(shared_secret.x).bit_length() + 7) // 8, 'big'
        )
        
        # Use HKDF to derive a symmetric key
        derived_key = HKDF(
            master=shared_secret_bytes,
            key_len=32,
            salt=None,
            hashmod=SHA256,
            num_keys=1
        )
        
        return _b64_encode(derived_key)
    except Exception as exc:
        raise ECCError(f"ECDH failed: {exc}") from exc


def ecdsa_sign(message: str, private_key_b64: str, hash_algorithm: str = "SHA256") -> str:
    """Sign message using ECDSA."""
    try:
        # Import private key
        private_der = _b64_decode(private_key_b64)
        private_key = ECC.import_key(private_der)
        
        # Hash the message
        if hash_algorithm == "SHA256":
            digest = SHA256.new(message.encode("utf-8"))
        elif hash_algorithm == "SHA3_256":
            digest = SHA3_256.new(message.encode("utf-8"))
        else:
            raise ValueError(f"Unsupported hash algorithm: {hash_algorithm}")
        
        # Sign with ECDSA
        signer = DSS.new(private_key, 'fips-186-3')
        signature = signer.sign(digest)
        
        return _b64_encode(signature)
    except Exception as exc:
        raise ECCError(f"ECDSA signing failed: {exc}") from exc


def ecdsa_verify(message: str, signature_b64: str, public_key_b64: str, 
                hash_algorithm: str = "SHA256") -> bool:
    """Verify ECDSA signature."""
    try:
        # Import public key
        public_der = _b64_decode(public_key_b64)
        public_key = ECC.import_key(public_der)
        
        # Hash the message
        if hash_algorithm == "SHA256":
            digest = SHA256.new(message.encode("utf-8"))
        elif hash_algorithm == "SHA3_256":
            digest = SHA3_256.new(message.encode("utf-8"))
        else:
            raise ValueError(f"Unsupported hash algorithm: {hash_algorithm}")
        
        # Verify signature
        signature = _b64_decode(signature_b64)
        verifier = DSS.new(public_key, 'fips-186-3')
        
        try:
            verifier.verify(digest, signature)
            return True
        except (ValueError, TypeError):
            return False
    except Exception as exc:
        raise ECCError(f"ECDSA verification failed: {exc}") from exc


def ecc_encrypt_hybrid(payload: str, public_key_b64: str, 
                      symmetric_algorithm: str = "aes-gcm") -> str:
    """
    Hybrid encryption using ECDH for key exchange and symmetric encryption.
    Returns JSON with ephemeral public key and encrypted data.
    """
    try:
        # Generate ephemeral key pair
        ephemeral_keypair = generate_ecc_keypair("P-256")
        
        # Derive shared secret
        shared_secret = ecdh_derive_shared_secret(
            ephemeral_keypair.private_key_b64,
            public_key_b64
        )
        
        # Use shared secret as key for symmetric encryption
        if symmetric_algorithm == "aes-gcm":
            key_bytes = _b64_decode(shared_secret)
            nonce = _generate_secure_random_bytes(12)
            cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
            ciphertext, tag = cipher.encrypt_and_digest(payload.encode("utf-8"))
            
            result = {
                "ephemeral_public_key": ephemeral_keypair.public_key_b64,
                "nonce": _b64_encode(nonce),
                "tag": _b64_encode(tag),
                "ciphertext": _b64_encode(ciphertext),
                "symmetric_algorithm": symmetric_algorithm
            }
        else:
            raise ValueError(f"Unsupported symmetric algorithm: {symmetric_algorithm}")
        
        return json.dumps(result)
    except Exception as exc:
        raise ECCError(f"ECC hybrid encryption failed: {exc}") from exc


def ecc_decrypt_hybrid(encrypted_data: str, private_key_b64: str) -> str:
    """
    Hybrid decryption using ECDH for key exchange.
    """
    try:
        data = json.loads(encrypted_data)
        
        # Extract components
        ephemeral_public_key = data["ephemeral_public_key"]
        nonce = _b64_decode(data["nonce"])
        tag = _b64_decode(data["tag"])
        ciphertext = _b64_decode(data["ciphertext"])
        symmetric_algorithm = data.get("symmetric_algorithm", "aes-gcm")
        
        # Derive shared secret
        shared_secret = ecdh_derive_shared_secret(
            private_key_b64,
            ephemeral_public_key
        )
        
        # Decrypt with symmetric algorithm
        if symmetric_algorithm == "aes-gcm":
            key_bytes = _b64_decode(shared_secret)
            cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
            plaintext = cipher.decrypt_and_verify(ciphertext, tag)
            return plaintext.decode("utf-8")
        else:
            raise ValueError(f"Unsupported symmetric algorithm: {symmetric_algorithm}")
    except Exception as exc:
        raise ECCError(f"ECC hybrid decryption failed: {exc}") from exc

@dataclass(frozen=True)
class CryptoEngine:
    """
    High-level helper that exposes crypto operations.
    """
    algorithm: str
    key: str | None
    is_binary: bool = False
    # Additional parameters for new algorithms
    hash_algorithm: str = "SHA256"
    ecc_curve: str = "P-256"
    argon2_params: Optional[Argon2Params] = None

    def _require_key(self) -> str:
        if self.algorithm in {"base64", "sha256", "sha3-256"}:
            return ""
        if self.algorithm == "caesar":
            return self.key or "3"
        if not self.key:
            raise CryptoServiceError("Необходим ключ для выбранного алгоритма")
        return self.key

    # Public API
    def process(self, operation: str, payload: str) -> str:
        """Main processing method for all crypto operations."""
        if operation == "encrypt":
            return self.encrypt(payload)
        elif operation == "decrypt":
            return self.decrypt(payload)
        elif operation == "hash":
            return self.hash(payload)
        elif operation == "sign":
            return self.sign(payload)
        elif operation == "verify":
            return self.verify(payload)
        elif operation == "derive_key":
            return self.derive_key(payload)
        elif operation == "generate_keypair":
            return self.generate_keypair()
        else:
            raise CryptoServiceError(f"Неподдерживаемая операция: {operation}")

    def encrypt(self, payload: str) -> str:
        if self.algorithm == "rsa":
            return rsa_encrypt(payload, self._require_key())
        elif self.algorithm == "ecc-hybrid":
            return ecc_encrypt_hybrid(payload, self._require_key())
        
        if self.is_binary:
            return self._dispatch_binary("encrypt")(payload)
        return self._dispatch("encrypt")(payload)

    def decrypt(self, payload: str) -> str:
        if self.algorithm == "rsa":
            return rsa_decrypt(payload, self._require_key())
        elif self.algorithm == "ecc-hybrid":
            return ecc_decrypt_hybrid(payload, self._require_key())
        
        if self.is_binary:
            return self._dispatch_binary("decrypt")(payload)
        return self._dispatch("decrypt")(payload)

    def hash(self, payload: str) -> str:
        if self.is_binary:
            return self._dispatch_binary_hash()(payload)
        return self._dispatch_hash()(payload)

    def sign(self, payload: str) -> str:
        if self.algorithm == "rsa-pss":
            return sign_message_rsa_pss(payload, self._require_key())
        elif self.algorithm == "ecdsa":
            return ecdsa_sign(payload, self._require_key(), self.hash_algorithm)
        else:
            raise CryptoServiceError(f"Алгоритм {self.algorithm} не поддерживает подпись")

    def verify(self, payload: str) -> bool:
        # For verification, payload should be JSON with message, signature, and optionally public key
        try:
            data = json.loads(payload)
            message = data["message"]
            signature = data["signature"]
            public_key = data.get("public_key", self.key)
            
            if not public_key:
                raise CryptoServiceError("Необходим открытый ключ для проверки подписи")
            
            if self.algorithm == "rsa-pss":
                return verify_message_rsa_pss(message, signature, public_key)
            elif self.algorithm == "ecdsa":
                return ecdsa_verify(message, signature, public_key, self.hash_algorithm)
            else:
                raise CryptoServiceError(f"Алгоритм {self.algorithm} не поддерживает проверку подписи")
        except Exception as exc:
            raise CryptoServiceError(f"Ошибка при проверке подписи: {exc}") from exc

    def derive_key(self, payload: str) -> str:
        if self.algorithm == "argon2":
            return argon2_derive_key(payload, self.key)
        elif self.algorithm == "ecdh":
            if not self.key:
                raise CryptoServiceError("Необходим открытый ключ для ECDH")
            return ecdh_derive_shared_secret(self._require_key(), self.key)
        else:
            raise CryptoServiceError(f"Алгоритм {self.algorithm} не поддерживает производные ключи")

    def generate_keypair(self) -> str:
        if self.algorithm == "rsa":
            key_size = int(self.key) if self.key and self.key.isdigit() else 2048
            keypair = generate_rsa_keypair(key_size)
            result = {
                "public_key": keypair.public_key_b64,
                "private_key": keypair.private_key_b64,
                "algorithm": "RSA",
                "key_size": key_size
            }
        elif self.algorithm == "ecc":
            curve = self.key if self.key in ["P-256", "P-384", "P-521"] else self.ecc_curve
            keypair = generate_ecc_keypair(curve)
            result = {
                "public_key": keypair.public_key_b64,
                "private_key": keypair.private_key_b64,
                "algorithm": "ECC",
                "curve": keypair.curve
            }
        else:
            raise CryptoServiceError(f"Алгоритм {self.algorithm} не поддерживает генерацию ключевой пары")
        
        return json.dumps(result)

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

    # Hash dispatch
    def _dispatch_hash(self) -> Callable[[str], str]:
        if self.algorithm == "sha256":
            return sha256_hash
        elif self.algorithm == "sha3-256":
            return sha3_256_hash
        elif self.algorithm == "argon2":
            return lambda p: argon2_hash(p, self.argon2_params)
        else:
            raise CryptoServiceError(f"Алгоритм {self.algorithm} не поддерживает хэширование")

    def _dispatch_binary_hash(self) -> Callable[[str], str]:
        if self.algorithm == "sha256":
            return sha256_hash_binary
        else:
            raise CryptoServiceError(f"Алгоритм {self.algorithm} не поддерживает хэширование бинарных данных")

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

from __future__ import annotations
import base64
import os
from dataclasses import dataclass
from hashlib import sha256
from typing import Callable
from Crypto.Cipher import AES, Blowfish, ChaCha20
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
from Crypto.Signature import pss
from Crypto.Util.Padding import pad, unpad


class CryptoServiceError(Exception):
    """Raised when we cannot complete the requested crypto operation."""


class RSASignatureError(CryptoServiceError):
    """Raised when RSA key generation, signing or verification fails."""


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


@dataclass(frozen=True)
class CryptoEngine:
    """
    High-level helper that exposes encrypt/decrypt entry points.
    """
    algorithm: str
    key: str | None
    is_binary: bool = False  # Новый флаг для бинарных данных

    def _require_key(self) -> str:
        if self.algorithm in {"base64"}:
            return ""
        if self.algorithm == "caesar":
            return self.key or "3"
        if not self.key:
            raise CryptoServiceError("Необходим ключ для выбранного алгоритма")
        return self.key

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
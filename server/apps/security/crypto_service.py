"""
Utility helpers that mirror the client-side algorithms so the backend
can decrypt/encrypt payloads requested by the frontend.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
from hashlib import sha256
from typing import Callable

from Crypto.Cipher import AES, Blowfish, ChaCha20, DES3
from Crypto.Cipher.DES3 import adjust_key_parity
from Crypto.Util.Padding import pad, unpad


class CryptoServiceError(Exception):
    """Raised when we cannot complete the requested crypto operation."""


def _derive_bytes(source: str, length: int) -> bytes:
    """
    Deterministically derive a byte sequence of `length` from the provided
    string. This mirrors how the frontend pads/truncates user-provided keys.
    """
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


@dataclass(frozen=True)
class CryptoEngine:
    """
    High-level helper that exposes encrypt/decrypt entry points. Each algorithm
    matches its client-side counterpart to keep interoperability simple.
    """

    algorithm: str
    key: str | None

    def _require_key(self) -> str:
        if self.algorithm in {"base64"}:
            return ""
        if self.algorithm == "caesar":
            return self.key or "3"
        if not self.key:
            raise CryptoServiceError("Необходим ключ для выбранного алгоритма")
        return self.key

    # Public API ----------------------------------------------------------- #
    def encrypt(self, payload: str) -> str:
        return self._dispatch("encrypt")(payload)

    def decrypt(self, payload: str) -> str:
        return self._dispatch("decrypt")(payload)

    # Internal helpers ----------------------------------------------------- #
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

    # AES (GCM, deterministic nonce derived from key) ---------------------- #
    def _aes_encrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = _derive_bytes(self.key[::-1], 12) if self.key else b"\x00" * 12
        cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
        ciphertext, tag = cipher.encrypt_and_digest(payload.encode("utf-8"))
        return _b64_encode(tag + ciphertext)

    def _aes_decrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = _derive_bytes(self.key[::-1], 12) if self.key else b"\x00" * 12
        data = _b64_decode(payload)
        tag, ciphertext = data[:16], data[16:]
        cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=nonce)
        try:
            plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        except ValueError as exc:
            raise CryptoServiceError("Неверный ключ или поврежденные данные") from exc
        return plaintext.decode("utf-8")

    # ChaCha20 ------------------------------------------------------------- #
    def _chacha_encrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = b"\x01" * 12
        cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
        ciphertext = cipher.encrypt(payload.encode("utf-8"))
        return _b64_encode(ciphertext)

    def _chacha_decrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 32)
        nonce = b"\x01" * 12
        cipher = ChaCha20.new(key=key_bytes, nonce=nonce)
        plaintext = cipher.decrypt(_b64_decode(payload))
        return plaintext.decode("utf-8")

    # Blowfish (CBC) ------------------------------------------------------- #
    def _blowfish_encrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 16)
        iv = _derive_bytes(self.key[::-1], Blowfish.block_size)
        cipher = Blowfish.new(key_bytes, Blowfish.MODE_CBC, iv)
        ciphertext = cipher.encrypt(pad(payload.encode("utf-8"), Blowfish.block_size))
        return _b64_encode(ciphertext)

    def _blowfish_decrypt(self, payload: str) -> str:
        key_bytes = _derive_bytes(self._require_key(), 16)
        iv = _derive_bytes(self.key[::-1], Blowfish.block_size)
        cipher = Blowfish.new(key_bytes, Blowfish.MODE_CBC, iv)
        plaintext = unpad(cipher.decrypt(_b64_decode(payload)), Blowfish.block_size)
        return plaintext.decode("utf-8")

    # Twofish substitute (TripleDES for demo parity with frontend) --------- #
    def _twofish_encrypt(self, payload: str) -> str:
        key_material = adjust_key_parity(_derive_bytes(self._require_key(), 24))
        iv = _derive_bytes(self.key[::-1], DES3.block_size)
        cipher = DES3.new(key_material, DES3.MODE_CBC, iv=iv)
        ciphertext = cipher.encrypt(pad(payload.encode("utf-8"), DES3.block_size))
        return _b64_encode(ciphertext)

    def _twofish_decrypt(self, payload: str) -> str:
        key_material = adjust_key_parity(_derive_bytes(self._require_key(), 24))
        iv = _derive_bytes(self.key[::-1], DES3.block_size)
        cipher = DES3.new(key_material, DES3.MODE_CBC, iv=iv)
        plaintext = unpad(cipher.decrypt(_b64_decode(payload)), DES3.block_size)
        return plaintext.decode("utf-8")

    # Caesar --------------------------------------------------------------- #
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

    # Base64 --------------------------------------------------------------- #
    @staticmethod
    def _base64_encode(payload: str) -> str:
        return _b64_encode(payload.encode("utf-8"))

    @staticmethod
    def _base64_decode(payload: str) -> str:
        return _b64_decode(payload).decode("utf-8")

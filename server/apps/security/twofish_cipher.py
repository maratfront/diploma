import base64
import struct
from typing import List


class Twofish:
    BLOCK_SIZE = 16
    KEY_SIZES = (16, 24, 32)  # 128, 192, 256 bits

    # Q permutation tables
    _Q0 = [
        0xA9, 0x67, 0xB3, 0xE8, 0x04, 0xFD, 0xA3, 0x76, 0x9A, 0x92, 0x80, 0x78, 0xE4, 0xDD, 0xD1, 0x38,
        0x0D, 0xC6, 0x35, 0x98, 0x18, 0xF7, 0xEC, 0x6C, 0x43, 0x75, 0x37, 0x26, 0xFA, 0x13, 0x94, 0x48,
        0xF2, 0xD0, 0x8B, 0x30, 0x84, 0x54, 0xDF, 0x23, 0x19, 0x5B, 0x3D, 0x59, 0xF3, 0xAE, 0xA2, 0x82,
        0x63, 0x01, 0x83, 0x2E, 0xD9, 0x51, 0x9B, 0x7C, 0xA6, 0xEB, 0xA5, 0xBE, 0x16, 0x0C, 0xE3, 0x61,
        0xC0, 0x8C, 0x3A, 0xF5, 0x73, 0x2C, 0x25, 0x0B, 0xBB, 0x4E, 0x89, 0x6B, 0x53, 0x6A, 0xB4, 0xF1,
        0xE1, 0xE6, 0xBD, 0x45, 0xE2, 0xF4, 0xB6, 0x66, 0xCC, 0x95, 0x03, 0x56, 0xD4, 0x1C, 0x1E, 0xD7,
        0xFB, 0xC3, 0x8E, 0xB5, 0xE9, 0xCF, 0xBF, 0xBA, 0xEA, 0x77, 0x39, 0xAF, 0x33, 0xC9, 0x62, 0x71,
        0x81, 0x79, 0x09, 0xAD, 0x24, 0xCD, 0xF9, 0xD8, 0xE5, 0xC5, 0xB9, 0x4D, 0x44, 0x08, 0x86, 0xE7,
        0xA1, 0x1D, 0xAA, 0xED, 0x06, 0x70, 0xB2, 0xD2, 0x41, 0x7B, 0xA0, 0x11, 0x31, 0xC2, 0x27, 0x90,
        0x20, 0xF6, 0x60, 0xFF, 0x96, 0x5C, 0xB1, 0xAB, 0x9E, 0x9C, 0x52, 0x1B, 0x5F, 0x93, 0x0A, 0xEF,
        0x91, 0x85, 0x49, 0xEE, 0x2D, 0x4F, 0x8F, 0x3B, 0x47, 0x87, 0x6D, 0x46, 0xD6, 0x3E, 0x69, 0x64,
        0x2A, 0xCE, 0xCB, 0x2F, 0xFC, 0x97, 0x05, 0x7A, 0xAC, 0x7F, 0xD5, 0x1A, 0x4B, 0x0E, 0xA7, 0x5A,
        0x28, 0x14, 0x3F, 0x29, 0x88, 0x3C, 0x4C, 0x02, 0xB8, 0xDA, 0xB0, 0x17, 0x55, 0x1F, 0x8A, 0x7D,
        0x57, 0xC7, 0x8D, 0x74, 0xB7, 0xC4, 0x9F, 0x72, 0x7E, 0x15, 0x22, 0x12, 0x58, 0x07, 0x99, 0x34,
        0x6E, 0x50, 0xDE, 0x68, 0x65, 0xBC, 0xDB, 0xF8, 0xC8, 0xA8, 0x2B, 0x40, 0xDC, 0xFE, 0x32, 0xA4,
        0xCA, 0x10, 0x21, 0xF0, 0xD3, 0x5D, 0x0F, 0x00, 0x6F, 0x9D, 0x36, 0x42, 0x4A, 0x5E, 0xC1, 0xE0
    ]

    _Q1 = [
        0x75, 0xF3, 0xC6, 0xF4, 0xDB, 0x7B, 0xFB, 0xC8, 0x4A, 0xD3, 0xE6, 0x6B, 0x45, 0x7D, 0xE8, 0x4B,
        0xD6, 0x32, 0xD8, 0xFD, 0x37, 0x71, 0xF1, 0xE1, 0x30, 0x0F, 0xF8, 0x1B, 0x87, 0xFA, 0x06, 0x3F,
        0x5E, 0xBA, 0xAE, 0x5B, 0x8A, 0x00, 0xBC, 0x9D, 0x6D, 0xC1, 0xB1, 0x0E, 0x80, 0x5D, 0xD2, 0xD5,
        0xA0, 0x84, 0x07, 0x14, 0xB5, 0x90, 0x2C, 0xA3, 0xB2, 0x73, 0x4C, 0x54, 0x92, 0x74, 0x36, 0x51,
        0x38, 0xB0, 0xBD, 0x5A, 0xFC, 0x60, 0x62, 0x96, 0x6C, 0x42, 0xF7, 0x10, 0x7C, 0x28, 0x27, 0x8C,
        0x13, 0x95, 0x9C, 0xC7, 0x24, 0x46, 0x3B, 0x70, 0xCA, 0xE3, 0x85, 0xCB, 0x11, 0xD0, 0x93, 0xB8,
        0xA6, 0x83, 0x20, 0xFF, 0x9F, 0x77, 0xC3, 0xCC, 0x03, 0x6F, 0x08, 0xBF, 0x40, 0xE7, 0x2B, 0xE2,
        0x79, 0x0C, 0xAA, 0x82, 0x41, 0x3A, 0xEA, 0xB9, 0xE4, 0x9A, 0xA4, 0x97, 0x7E, 0xDA, 0x7A, 0x17,
        0x66, 0x94, 0xA1, 0x1D, 0x3D, 0xF0, 0xDE, 0xB3, 0x0B, 0x72, 0xA7, 0x1C, 0xEF, 0xD1, 0x53, 0x3E,
        0x8F, 0x33, 0x26, 0x5F, 0xEC, 0x76, 0x2A, 0x49, 0x81, 0x88, 0xEE, 0x21, 0xC4, 0x1A, 0xEB, 0xD9,
        0xC5, 0x39, 0x99, 0xCD, 0xAD, 0x31, 0x8B, 0x01, 0x18, 0x23, 0xDD, 0x1F, 0x4E, 0x2D, 0xF9, 0x48,
        0x4F, 0xF2, 0x65, 0x8E, 0x78, 0x5C, 0x58, 0x19, 0x8D, 0xE5, 0x98, 0x57, 0x67, 0x7F, 0x05, 0x64,
        0xAF, 0x63, 0xB6, 0xFE, 0xF5, 0xB7, 0x3C, 0xA5, 0xCE, 0xE9, 0x68, 0x44, 0xE0, 0x4D, 0x43, 0x69,
        0x29, 0x2E, 0xAC, 0x15, 0x59, 0xA8, 0x0A, 0x9E, 0x6E, 0x47, 0xDF, 0x34, 0x35, 0x6A, 0xCF, 0xDC,
        0x22, 0xC9, 0xC0, 0x9B, 0x89, 0xD4, 0xED, 0xAB, 0x12, 0xA2, 0x0D, 0x52, 0xBB, 0x02, 0x2F, 0xA9,
        0xD7, 0x61, 0x1E, 0xB4, 0x50, 0x04, 0xF6, 0xC2, 0x16, 0x25, 0x86, 0x56, 0x55, 0x09, 0xBE, 0x91
    ]

    # RS matrix for key-dependent S-box generation
    _RS = [
        [0x01, 0xA4, 0x55, 0x87, 0x5A, 0x58, 0xDB, 0x9E],
        [0xA4, 0x56, 0x82, 0xF3, 0x1E, 0xC6, 0x68, 0xE5],
        [0x02, 0xA1, 0xFC, 0xC1, 0x47, 0xAE, 0x3D, 0x19],
        [0xA4, 0x55, 0x87, 0x5A, 0x58, 0xDB, 0x9E, 0x03]
    ]

    _MDS_TABLES = None

    @classmethod
    def _init_mds_tables(cls) -> None:
        """Initialize MDS tables for multiplication in GF(256)"""
        if cls._MDS_TABLES is not None:
            return

        # Primitive polynomial for GF(256): x^8 + x^6 + x^3 + x^2 + 1 = 0x14D
        mds0 = [0] * 256
        mds1 = [0] * 256
        mds2 = [0] * 256
        mds3 = [0] * 256

        for i in range(256):
            # Multiply by 2 in GF(256) with polynomial 0x14D
            def mul_by_2(x):
                return ((x << 1) ^ (0x169 if x & 0x80 else 0)) & 0xFF

            a0 = i
            a1 = mul_by_2(a0)
            a2 = mul_by_2(a1)
            a3 = mul_by_2(a2)
            a4 = mul_by_2(a3)

            # MDS matrix multiplication
            # Using matrix: [[01, EF, 5B, 5B], [5B, EF, EF, 01], [EF, 5B, 01, EF], [EF, 01, EF, 5B]]
            # But actually simplified as described in Twofish specification

            v0 = a0 ^ a1 ^ a2 ^ a3 ^ a4
            v1 = a0 ^ a1 ^ a2 ^ a3 ^ a4 ^ a1 ^ a3

            mds0[i] = a0 | (v1 << 8) | (v0 << 16) | (v0 << 24)
            mds1[i] = v0 | (v0 << 8) | (v1 << 16) | (a0 << 24)
            mds2[i] = v1 | (v0 << 8) | (a0 << 16) | (v0 << 24)
            mds3[i] = v1 | (a0 << 8) | (v0 << 16) | (v1 << 24)

        cls._MDS_TABLES = (mds0, mds1, mds2, mds3)

    def __init__(self, key: bytes):
        key_len = len(key)
        if key_len not in self.KEY_SIZES:
            raise ValueError(f"Key must be {self.KEY_SIZES} bytes, got {key_len}")

        self._init_mds_tables()

        self._key = key
        self._k = key_len // 8  # Key length in 64-bit words (2, 3, or 4)

        # Initialize internal state
        self._K = []  # Round subkeys
        self._S = []  # Key-dependent S-boxes
        self._sbox = None  # Precomputed S-boxes

        self._expand_key()

    def _expand_key(self) -> None:
        """Expand the key into round subkeys and S-boxes"""
        k = self._k
        key = self._key

        # Split key into even and odd 32-bit words
        Me = []  # Even words
        Mo = []  # Odd words
        for i in range(k):
            Me.append(struct.unpack('<I', key[i * 8:i * 8 + 4])[0])
            Mo.append(struct.unpack('<I', key[i * 8 + 4:i * 8 + 8])[0])

        # Generate S-box keys using RS matrix
        S = []
        for i in range(k // 2):
            # Process 8 bytes at a time
            block = key[(k // 2 - 1 - i) * 8:(k // 2 - i) * 8]
            sbox_key = self._rs_matrix_multiply(block)
            S.append(sbox_key)

        # For k=4, we need 4 S-box keys (S[0..3])
        if k == 4:
            # Need to generate all 4 S-box keys
            S = []
            for i in range(4):
                block = key[i * 8:i * 8 + 8]
                sbox_key = self._rs_matrix_multiply(block)
                S.append(sbox_key)
        elif k == 3:
            # For 192-bit key, S[3] = S[2] = S[1]
            S.append(S[0])
        elif k == 2:
            # For 128-bit key, S[3] = S[2] = S[1] = S[0]
            S = [S[0]] * 4

        self._S = S

        # Generate round subkeys
        K = []
        rho = 0x01010101

        for i in range(20):
            A = self._h_function(2 * i * rho, Me, k)
            B = self._h_function((2 * i + 1) * rho, Mo, k)
            B = ((B << 8) & 0xFFFFFFFF) | (B >> 24)

            K.append((A + B) & 0xFFFFFFFF)

            C = (A + 2 * B) & 0xFFFFFFFF
            K.append(((C << 9) & 0xFFFFFFFF) | (C >> 23))

        self._K = K

        # Build precomputed S-boxes
        self._build_sboxes()

    @staticmethod
    def _rs_matrix_multiply(data: bytes) -> int:
        """Multiply 8-byte vector by RS matrix in GF(256)"""
        if len(data) != 8:
            raise ValueError("RS matrix multiply requires exactly 8 bytes")

        result = [0, 0, 0, 0]

        # Polynomial for GF(256): x^8 + x^6 + x^3 + x^2 + 1 = 0x14D
        def gf256_mul(first: int, second: int) -> int:
            """Multiply in GF(256) modulo 0x14D"""
            p = 0
            for _ in range(8):
                if second & 1:
                    p ^= first
                hi_bit = first & 0x80
                first = (first << 1) & 0xFF
                if hi_bit:
                    first ^= 0x14D
                second >>= 1
            return p

        for row in range(4):
            for col in range(8):
                a = Twofish._RS[row][col]
                b = data[col]
                result[row] ^= gf256_mul(a, b)

        return (result[0] & 0xFF) | ((result[1] & 0xFF) << 8) | \
            ((result[2] & 0xFF) << 16) | ((result[3] & 0xFF) << 24)

    def _h_function(self, x: int, L: List[int], k: int) -> int:
        """H function for key expansion"""
        # Split x into bytes
        b = [(x >> (8 * i)) & 0xFF for i in range(4)]

        # Apply key-dependent permutations
        if k == 4:
            b[0] = self._Q1[b[0]] ^ (L[3] & 0xFF)
            b[1] = self._Q0[b[1]] ^ ((L[3] >> 8) & 0xFF)
            b[2] = self._Q0[b[2]] ^ ((L[3] >> 16) & 0xFF)
            b[3] = self._Q1[b[3]] ^ ((L[3] >> 24) & 0xFF)

        if k >= 3:
            b[0] = self._Q1[b[0]] ^ (L[2] & 0xFF)
            b[1] = self._Q1[b[1]] ^ ((L[2] >> 8) & 0xFF)
            b[2] = self._Q0[b[2]] ^ ((L[2] >> 16) & 0xFF)
            b[3] = self._Q0[b[3]] ^ ((L[2] >> 24) & 0xFF)

        # Apply fixed permutations
        b[0] = self._Q1[self._Q0[b[0]] ^ (L[1] & 0xFF)] ^ (L[0] & 0xFF)
        b[1] = self._Q0[self._Q1[b[1]] ^ ((L[1] >> 8) & 0xFF)] ^ ((L[0] >> 8) & 0xFF)
        b[2] = self._Q1[self._Q0[b[2]] ^ ((L[1] >> 16) & 0xFF)] ^ ((L[0] >> 16) & 0xFF)
        b[3] = self._Q0[self._Q1[b[3]] ^ ((L[1] >> 24) & 0xFF)] ^ ((L[0] >> 24) & 0xFF)

        # Apply MDS matrix
        mds0, mds1, mds2, mds3 = self._MDS_TABLES
        return mds0[b[0]] ^ mds1[b[1]] ^ mds2[b[2]] ^ mds3[b[3]]

    def _build_sboxes(self) -> None:
        """Build precomputed S-boxes from key material"""
        k = self._k
        S = self._S

        sbox0 = [0] * 256
        sbox1 = [0] * 256
        sbox2 = [0] * 256
        sbox3 = [0] * 256

        mds0, mds1, mds2, mds3 = self._MDS_TABLES

        for i in range(256):
            b = [i, i, i, i]

            # Apply key-dependent S-box permutations
            if k == 4:
                b[0] = self._Q1[b[0]] ^ (S[3] & 0xFF)
                b[1] = self._Q0[b[1]] ^ ((S[3] >> 8) & 0xFF)
                b[2] = self._Q0[b[2]] ^ ((S[3] >> 16) & 0xFF)
                b[3] = self._Q1[b[3]] ^ ((S[3] >> 24) & 0xFF)

            if k >= 3:
                b[0] = self._Q1[b[0]] ^ (S[2] & 0xFF)
                b[1] = self._Q1[b[1]] ^ ((S[2] >> 8) & 0xFF)
                b[2] = self._Q0[b[2]] ^ ((S[2] >> 16) & 0xFF)
                b[3] = self._Q0[b[3]] ^ ((S[2] >> 24) & 0xFF)

            # Apply fixed permutations
            b[0] = self._Q1[self._Q0[b[0]] ^ (S[1] & 0xFF)] ^ (S[0] & 0xFF)
            b[1] = self._Q0[self._Q1[b[1]] ^ ((S[1] >> 8) & 0xFF)] ^ ((S[0] >> 8) & 0xFF)
            b[2] = self._Q1[self._Q0[b[2]] ^ ((S[1] >> 16) & 0xFF)] ^ ((S[0] >> 16) & 0xFF)
            b[3] = self._Q0[self._Q1[b[3]] ^ ((S[1] >> 24) & 0xFF)] ^ ((S[0] >> 24) & 0xFF)

            # Store in precomputed S-boxes
            sbox0[i] = mds0[self._Q1[b[0]]]
            sbox1[i] = mds1[self._Q0[b[1]]]
            sbox2[i] = mds2[self._Q1[b[2]]]
            sbox3[i] = mds3[self._Q0[b[3]]]

        self._sbox = [sbox0, sbox1, sbox2, sbox3]

    def _g_function(self, x: int) -> int:
        """G function - core of the round function"""
        sbox0, sbox1, sbox2, sbox3 = self._sbox

        b0 = x & 0xFF
        b1 = (x >> 8) & 0xFF
        b2 = (x >> 16) & 0xFF
        b3 = (x >> 24) & 0xFF

        return sbox0[b0] ^ sbox1[b1] ^ sbox2[b2] ^ sbox3[b3]

    def encrypt_block(self, block: bytes) -> bytes:
        """Encrypt a single 16-byte block"""
        if len(block) != self.BLOCK_SIZE:
            raise ValueError(f"Block must be {self.BLOCK_SIZE} bytes")

        # Unpack block into 4 32-bit words
        R = list(struct.unpack('<4I', block))

        # Input whitening
        for i in range(4):
            R[i] ^= self._K[i]

        # 16 rounds
        for r in range(16):
            # F function
            T0 = self._g_function(R[0])
            R1_rot = ((R[1] << 8) & 0xFFFFFFFF) | (R[1] >> 24)
            T1 = self._g_function(R1_rot)

            F0 = (T0 + T1 + self._K[2 * r + 8]) & 0xFFFFFFFF
            F1 = (T0 + 2 * T1 + self._K[2 * r + 9]) & 0xFFFFFFFF

            # Apply F function to the other two words
            R[2] ^= F0
            R[3] = ((R[3] << 1) & 0xFFFFFFFF) | (R[3] >> 31)
            R[3] ^= F1

            # Swap for next round
            R[0], R[1], R[2], R[3] = R[2], R[3], R[0], R[1]

        # Undo last swap
        R[0], R[1], R[2], R[3] = R[2], R[3], R[0], R[1]

        # Output whitening
        for i in range(4):
            R[i] ^= self._K[i + 4]

        # Pack back into bytes
        return struct.pack('<4I', *R)

    def decrypt_block(self, block: bytes) -> bytes:
        """Decrypt a single 16-byte block"""
        if len(block) != self.BLOCK_SIZE:
            raise ValueError(f"Block must be {self.BLOCK_SIZE} bytes")

        # Unpack block into 4 32-bit words
        R = list(struct.unpack('<4I', block))

        # Reverse output whitening
        for i in range(4):
            R[i] ^= self._K[i + 4]

        # 16 rounds in reverse
        for r in range(15, -1, -1):
            # Undo swap
            R[0], R[1], R[2], R[3] = R[2], R[3], R[0], R[1]

            # F function
            T0 = self._g_function(R[0])
            R1_rot = ((R[1] << 8) & 0xFFFFFFFF) | (R[1] >> 24)
            T1 = self._g_function(R1_rot)

            F0 = (T0 + T1 + self._K[2 * r + 8]) & 0xFFFFFFFF
            F1 = (T0 + 2 * T1 + self._K[2 * r + 9]) & 0xFFFFFFFF

            # Reverse F function application
            R[3] ^= F1
            R[3] = (R[3] >> 1) | ((R[3] & 1) << 31)
            R[2] ^= F0

        # Undo last swap
        R[0], R[1], R[2], R[3] = R[2], R[3], R[0], R[1]

        # Reverse input whitening
        for i in range(4):
            R[i] ^= self._K[i]

        # Pack back into bytes
        return struct.pack('<4I', *R)


# Utility functions for padding and encoding
def pad(data: bytes, block_size: int) -> bytes:
    """PKCS#7 padding"""
    padding_len = block_size - len(data) % block_size
    if padding_len == 0:
        padding_len = block_size
    padding = bytes([padding_len] * padding_len)
    return data + padding


def unpad(data: bytes, block_size: int) -> bytes:
    """Remove PKCS#7 padding"""
    if len(data) == 0:
        raise ValueError("Data cannot be empty")

    padding_len = data[-1]
    if padding_len < 1 or padding_len > block_size:
        raise ValueError("Invalid padding")

    for i in range(padding_len):
        if data[-i - 1] != padding_len:
            raise ValueError("Invalid padding")

    return data[:-padding_len]


def _derive_bytes(key: str, length: int) -> bytes:
    """Derive bytes from a string key using SHA-256"""
    import hashlib
    result = b""
    counter = 0

    while len(result) < length:
        data = key.encode() + counter.to_bytes(4, 'big')
        hash_bytes = hashlib.sha256(data).digest()
        result += hash_bytes
        counter += 1

    return result[:length]


def _generate_secure_random_bytes(length: int) -> bytes:
    """Generate cryptographically secure random bytes"""
    import os
    return os.urandom(length)


def _b64_encode(data: bytes) -> str:
    """URL-safe base64 encoding without padding"""
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


def _b64_decode(data: str) -> bytes:
    """URL-safe base64 decoding with padding"""
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)

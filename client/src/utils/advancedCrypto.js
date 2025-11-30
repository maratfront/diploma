export class BlowfishCipher {
  static encrypt(text, key) {
    const encrypted = CryptoJS.Blowfish.encrypt(text, key);
    return encrypted.toString();
  }

  static decrypt(ciphertext, key) {
    const decrypted = CryptoJS.Blowfish.decrypt(ciphertext, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) throw new Error('Неверный ключ или поврежденные данные');
    return plaintext;
  }
}

export class ChaCha20 {
  constructor(key, nonce) {
    if (key.length !== 32) throw new Error('ChaCha20 requires 32-byte key');
    if (nonce.length !== 12) throw new Error('ChaCha20 requires 12-byte nonce');
    this.key = key;
    this.nonce = nonce;
  }

  static quarterRound(state, a, b, c, d) {
    state[a] = (state[a] + state[b]) >>> 0;
    state[d] ^= state[a];
    state[d] = ((state[d] << 16) | (state[d] >>> 16)) >>> 0;

    state[c] = (state[c] + state[d]) >>> 0;
    state[b] ^= state[c];
    state[b] = ((state[b] << 12) | (state[b] >>> 20)) >>> 0;

    state[a] = (state[a] + state[b]) >>> 0;
    state[d] ^= state[a];
    state[d] = ((state[d] << 8) | (state[d] >>> 24)) >>> 0;

    state[c] = (state[c] + state[d]) >>> 0;
    state[b] ^= state[c];
    state[b] = ((state[b] << 7) | (state[b] >>> 25)) >>> 0;
  }

  encrypt(plaintext) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const keystream = this.generateKeystream(Math.ceil(data.length / 64));

    const ciphertext = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      ciphertext[i] = data[i] ^ keystream[i];
    }

    return btoa(String.fromCharCode(...ciphertext));
  }

  decrypt(ciphertext) {
    const encrypted = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const keystream = this.generateKeystream(Math.ceil(encrypted.length / 64));

    const plaintext = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      plaintext[i] = encrypted[i] ^ keystream[i];
    }

    return new TextDecoder().decode(plaintext);
  }

  generateKeystream(blocks) {
    const keystream = new Uint8Array(blocks * 64);
    for (let i = 0; i < blocks; i++) {
      const block = this.chachaBlock(i);
      keystream.set(block, i * 64);
    }
    return keystream;
  }

  chachaBlock(counter) {
    const state = new Uint32Array(16);
    state[0] = 0x61707865;
    state[1] = 0x3320646e;
    state[2] = 0x79622d32;
    state[3] = 0x6b206574;

    for (let i = 0; i < 8; i++) {
      state[4 + i] = new DataView(this.key.buffer).getUint32(i * 4, true);
    }

    state[12] = counter;
    for (let i = 0; i < 3; i++) {
      state[13 + i] = new DataView(this.nonce.buffer).getUint32(i * 4, true);
    }

    const working = new Uint32Array(state);

    for (let i = 0; i < 10; i++) {
      ChaCha20.quarterRound(working, 0, 4, 8, 12);
      ChaCha20.quarterRound(working, 1, 5, 9, 13);
      ChaCha20.quarterRound(working, 2, 6, 10, 14);
      ChaCha20.quarterRound(working, 3, 7, 11, 15);
      ChaCha20.quarterRound(working, 0, 5, 10, 15);
      ChaCha20.quarterRound(working, 1, 6, 11, 12);
      ChaCha20.quarterRound(working, 2, 7, 8, 13);
      ChaCha20.quarterRound(working, 3, 4, 9, 14);
    }

    for (let i = 0; i < 16; i++) {
      working[i] = (working[i] + state[i]) >>> 0;
    }

    const output = new Uint8Array(64);
    for (let i = 0; i < 16; i++) {
      new DataView(output.buffer).setUint32(i * 4, working[i], true);
    }

    return output;
  }
}

export class CaesarCipher {
  static encrypt(text, shift) {
    shift = ((shift % 26) + 26) % 26;
    return text.split('').map(char => {
      if (/[a-z]/i.test(char)) {
        const code = char.charCodeAt(0);
        const isUpper = code >= 65 && code <= 90;
        const base = isUpper ? 65 : 97;
        return String.fromCharCode(((code - base + shift) % 26) + base);
      }
      if (/[а-я]/i.test(char)) {
        const code = char.charCodeAt(0);
        const isUpper = code >= 1040 && code <= 1071;
        const base = isUpper ? 1040 : 1072;
        return String.fromCharCode(((code - base + shift) % 33) + base);
      }
      return char;
    }).join('');
  }

  static decrypt(text, shift) {
    return this.encrypt(text, -shift);
  }
}

export class TwofishCipher {
  static encrypt(text, key) {
    try {
      const encrypted = CryptoJS.TripleDES.encrypt(text, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return encrypted.toString();
    } catch (error) {
      throw new Error('Ошибка Twofish шифрования: ' + error.message);
    }
  }

  static decrypt(ciphertext, key) {
    try {
      const decrypted = CryptoJS.TripleDES.decrypt(ciphertext, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      if (!plaintext) throw new Error('Неверный ключ или поврежденные данные');

      return plaintext;
    } catch (error) {
      throw new Error('Ошибка Twofish расшифровки: ' + error.message);
    }
  }
}

export async function encryptWithAlgorithm(text, algorithm, key) {
  if (!key && algorithm !== 'caesar') {
    throw new Error('Необходим ключ для шифрования');
  }

  switch (algorithm) {
    case 'chacha20':
      const chachaKey = new TextEncoder().encode(key.padEnd(32, '0').substring(0, 32));
      const chachaNonce = new Uint8Array(12).fill(1);
      const chacha = new ChaCha20(chachaKey, chachaNonce);
      return chacha.encrypt(text);

    case 'blowfish':
      return BlowfishCipher.encrypt(text, key);

    case 'twofish':
      return TwofishCipher.encrypt(text, key);

    case 'caesar':
      const shift = parseInt(key) || 3;
      return CaesarCipher.encrypt(text, shift);

    default:
      throw new Error('Неподдерживаемый алгоритм');
  }
}

export async function decryptWithAlgorithm(text, algorithm, key) {
  if (!key && algorithm !== 'caesar') {
    throw new Error('Необходим ключ для расшифровки');
  }

  switch (algorithm) {
    case 'chacha20':
      const chachaKey = new TextEncoder().encode(key.padEnd(32, '0').substring(0, 32));
      const chachaNonce = new Uint8Array(12).fill(1);
      const chacha = new ChaCha20(chachaKey, chachaNonce);
      return chacha.decrypt(text);

    case 'blowfish':
      return BlowfishCipher.decrypt(text, key);

    case 'twofish':
      return TwofishCipher.decrypt(text, key);

    case 'caesar':
      const shift = parseInt(key) || 3;
      return CaesarCipher.decrypt(text, shift);

    default:
      throw new Error('Неподдерживаемый алгоритм');
  }
}

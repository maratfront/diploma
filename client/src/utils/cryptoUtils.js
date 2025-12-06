async function requestCrypto(operation, algorithm, payload = '', key = '', isBinary = false, params = {}) {
  const requestBody = {
    operation,
    algorithm,
    is_binary: isBinary,
    params: Object.keys(params).length > 0 ? params : undefined
  };

  if (key) {
    requestBody.key = key;
  }

  if (payload !== undefined && payload !== null && payload !== '') {
    requestBody.payload = payload;
  }

  const response = await fetch('http://127.0.0.1:8000/api/security/crypto/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Сервер не смог обработать запрос');
  }

  return data;
}

export async function encryptText(text, algorithm, key) {
  const data = await requestCrypto('encrypt', algorithm, text, key, false);
  return data.result;
}

export async function decryptText(text, algorithm, key) {
  const data = await requestCrypto('decrypt', algorithm, text, key, false);
  return data.result;
}

export async function encryptFile(fileContent, algorithm, key, isBinary = false) {
  const data = await requestCrypto('encrypt', algorithm, fileContent, key, isBinary);
  return data.result;
}

export async function decryptFile(fileContent, algorithm, key, isBinary = false) {
  const data = await requestCrypto('decrypt', algorithm, fileContent, key, isBinary);
  return data.result;
}

export async function hashData(text, algorithm, params = {}) {
  if (!['sha256', 'sha512', 'argon2'].includes(algorithm)) {
    throw new Error(`Неподдерживаемый алгоритм хэширования: ${algorithm}`);
  }
  const data = await requestCrypto('hash', algorithm, text, '', false, params);
  return data;
}

export async function hashSHA512(text) {
  const data = await requestCrypto('hash', 'sha512', text, '', false, {});
  return data.hash;
}

export async function verifyHash(text, hashValue, algorithm) {
  try {
    const data = await requestCrypto('verify', algorithm, text, '', false, {
      hash: hashValue
    });
    return data;
  } catch (error) {
    console.error('Hash verification error:', error);
    throw error;
  }
}

export async function generateECCKeyPair(curve = 'P-256') {
  const data = await requestCrypto('generate_keypair', 'ecc', '', '', false, {
    curve
  });
  return data;
}

export async function signECC(message, privateKey, hashAlgorithm = 'SHA256') {
  const data = await requestCrypto('sign', 'ecc', message, privateKey, false, {
    hash_algorithm: hashAlgorithm
  });
  return data;
}

export async function verifyECC(message, signature, publicKey, hashAlgorithm = 'SHA256') {
  const data = await requestCrypto('verify', 'ecc', message, publicKey, false, {
    signature,
    hash_algorithm: hashAlgorithm
  });
  return data;
}

export async function encryptECC(message, publicKey) {
  const data = await requestCrypto('encrypt', 'ecc', message, publicKey);
  return data;
}

export async function decryptECC(encryptedData, privateKey) {
  const data = await requestCrypto('decrypt', 'ecc', encryptedData, privateKey);
  return data;
}

export async function generateRSAKeyPair(bits = 2048) {
  const data = await requestCrypto('generate_keypair', 'rsa', '', '', false, {
    bits
  });
  return data;
}

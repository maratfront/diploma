async function requestCrypto(operation, payload, algorithm, key, isBinary = false) {
  const response = await fetch('http://127.0.0.1:8000/api/security/crypto/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({
      operation,
      payload,
      algorithm,
      key: key || '',
      is_binary: isBinary // Флаг для сервера, что это бинарные данные
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Сервер не смог обработать запрос шифрования')
  }

  return data.result
}

// Для текста
export async function encryptText(text, algorithm, key) {
  return requestCrypto('encrypt', text, algorithm, key, false)
}

export async function decryptText(text, algorithm, key) {
  return requestCrypto('decrypt', text, algorithm, key, false)
}

// Для файлов
export async function encryptFile(fileContent, algorithm, key, isBinary = false) {
  return requestCrypto('encrypt', fileContent, algorithm, key, isBinary)
}

export async function decryptFile(fileContent, algorithm, key, isBinary = false) {
  return requestCrypto('decrypt', fileContent, algorithm, key, isBinary)
}
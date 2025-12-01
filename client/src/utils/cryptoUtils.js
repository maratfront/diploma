async function requestCrypto(operation, payload, algorithm, key) {
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
      key: key || ''
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.detail || 'Сервер не смог обработать запрос шифрования')
  }

  return data.result
}

export async function encryptText(text, algorithm, key) {
  return requestCrypto('encrypt', text, algorithm, key)
}

export async function decryptText(text, algorithm, key) {
  return requestCrypto('decrypt', text, algorithm, key)
}

export async function encryptFile(text, algorithm, key) {
  return requestCrypto('encrypt', text, algorithm, key)
}

export async function decryptFile(text, algorithm, key) {
  return requestCrypto('decrypt', text, algorithm, key)
}

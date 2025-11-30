// RSA-OAEP using Web Crypto API with localStorage persistence
let rsaKeyPair = null;

// Save RSA keys to localStorage
export async function saveRSAKeys(keyPair) {
  try {
    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    
    localStorage.setItem('rsa_public_key', JSON.stringify(publicKey));
    localStorage.setItem('rsa_private_key', JSON.stringify(privateKey));
  } catch (e) {
    console.error('Ошибка сохранения ключей:', e);
  }
}

// Load RSA keys from localStorage
export async function loadRSAKeys() {
  try {
    const publicKeyData = localStorage.getItem('rsa_public_key');
    const privateKeyData = localStorage.getItem('rsa_private_key');
    
    if (!publicKeyData || !privateKeyData) {
      return null;
    }
    
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(publicKeyData),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
    
    const privateKey = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(privateKeyData),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt']
    );
    
    return { publicKey, privateKey };
  } catch (e) {
    console.error('Ошибка загрузки ключей:', e);
    return null;
  }
}

// Generate new RSA key pair
export async function generateRSAKeys() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  await saveRSAKeys(keyPair);
  return keyPair;
}

export async function rsaOaepEncrypt(text) {
  try {
    // Try to load existing keys first
    if (!rsaKeyPair) {
      rsaKeyPair = await loadRSAKeys();
    }
    
    // Generate new keys if none exist
    if (!rsaKeyPair) {
      rsaKeyPair = await generateRSAKeys();
    }
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      rsaKeyPair.publicKey,
      new TextEncoder().encode(text)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (e) {
    throw new Error('Ошибка RSA шифрования: ' + e.message);
  }
}

export async function rsaOaepDecrypt(encryptedText) {
  try {
    // Try to load existing keys first
    if (!rsaKeyPair) {
      rsaKeyPair = await loadRSAKeys();
    }
    
    if (!rsaKeyPair) {
      throw new Error('Ключи RSA не найдены. Пожалуйста, сначала зашифруйте текст для генерации ключей.');
    }
    
    const encrypted = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      rsaKeyPair.privateKey,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    throw new Error('Ошибка RSA расшифровки: ' + e.message);
  }
}

// Clear RSA keys from localStorage
export function clearRSAKeys() {
  localStorage.removeItem('rsa_public_key');
  localStorage.removeItem('rsa_private_key');
  rsaKeyPair = null;
}



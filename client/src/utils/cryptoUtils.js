// Text encryption using CryptoJS library
import { encryptWithAlgorithm, decryptWithAlgorithm } from './advancedCrypto.js'

export async function encryptText(text, algorithm, key) {
  console.log('Encrypting with algorithm:', algorithm);
  
  try {
    switch (algorithm) {
      case 'aes-gcm':
        if (!key) throw new Error('Необходим ключ для AES шифрования');
        return CryptoJS.AES.encrypt(text, key).toString();
        
      case 'base64':
        return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
        
      case 'chacha20':
      case 'blowfish':
      case 'twofish':
      case 'caesar':
        return await encryptWithAlgorithm(text, algorithm, key);
        
      default:
        throw new Error('Неподдерживаемый алгоритм: ' + algorithm);
    }
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

export async function decryptText(text, algorithm, key) {
  console.log('Decrypting with algorithm:', algorithm);
  
  try {
    switch (algorithm) {
      case 'aes-gcm':
        if (!key) throw new Error('Необходим ключ для AES расшифровки');
        const aesBytes = CryptoJS.AES.decrypt(text, key);
        const decrypted = aesBytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw new Error('Неверный ключ или поврежденные данные');
        return decrypted;
        
      case 'base64':
        const decoded = atob(text);
        const decodedBytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          decodedBytes[i] = decoded.charCodeAt(i);
        }
        return new TextDecoder().decode(decodedBytes);
        
      case 'chacha20':
      case 'blowfish':
      case 'twofish':
      case 'caesar':
        return await decryptWithAlgorithm(text, algorithm, key);
        
      default:
        throw new Error('Неподдерживаемый алгоритм: ' + algorithm);
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

// File encryption functions using CryptoJS
export async function encryptFile(text, algorithm, key) {
  if (!key && algorithm !== 'base64') throw new Error('Необходим ключ для шифрования');
  
  try {
    switch (algorithm) {
      case 'aes-gcm':
        return CryptoJS.AES.encrypt(text, key).toString();
        
      case 'chacha20':
      case 'blowfish':
      case 'twofish':
      case 'caesar':
        return await encryptWithAlgorithm(text, algorithm, key);
        
      case 'base64':
        return btoa(String.fromCharCode(...new TextEncoder().encode(text)));
        
      default:
        throw new Error('Неподдерживаемый алгоритм');
    }
  } catch (error) {
    console.error('File encryption error:', error);
    throw error;
  }
}

export async function decryptFile(text, algorithm, key) {
  if (!key && algorithm !== 'base64') throw new Error('Необходим ключ для расшифровки');
  
  try {
    let result;
    
    switch (algorithm) {
      case 'aes-gcm':
        const aesDecrypted = CryptoJS.AES.decrypt(text, key);
        result = aesDecrypted.toString(CryptoJS.enc.Utf8);
        break;
        
      case 'chacha20':
      case 'blowfish':
      case 'twofish':
      case 'caesar':
        return await decryptWithAlgorithm(text, algorithm, key);
        
      case 'base64':
        const decoded = atob(text);
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
        
      default:
        throw new Error('Неподдерживаемый алгоритм');
    }
    
    if (!result) throw new Error('Неверный ключ или поврежденные данные');
    return result;
  } catch (error) {
    console.error('File decryption error:', error);
    throw error;
  }
}



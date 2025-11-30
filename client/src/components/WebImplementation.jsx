import React from 'react'

// Animated copy button component
function AnimatedCopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn-secondary transition-all duration-300 transform hover:scale-105 ${copied ? 'bg-green-500 text-white scale-110' : ''
        }`}
    >
      <div className={`${copied ? 'icon-check' : 'icon-copy'} text-lg mr-2 transition-all duration-300`}></div>
      {copied ? 'Скопировано!' : 'Копировать код'}
    </button>
  );
}

function WebImplementation() {
  try {
    const [selectedExample, setSelectedExample] = React.useState('jwt');

    const examples = {
      jwt: {
        title: 'JWT Token Authentication',
        description: 'Реализация безопасной аутентификации с JWT токенами',
        code: `// Реализация JWT токенов для аутентификации пользователей
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTManager {
  constructor(secretKey) {
    // Сохраняем секретный ключ для подписи токенов
    this.secretKey = secretKey;
  }

  // Создание нового JWT токена с данными пользователя
  generateToken(payload, expiresIn = '1h') {
    // Подписываем токен секретным ключом и устанавливаем время жизни
    return jwt.sign(payload, this.secretKey, { expiresIn });
  }

  // Проверка валидности токена
  verifyToken(token) {
    try {
      // Проверяем подпись и возвращаем данные из токена
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      throw new Error('Недействительный токен');
    }
  }

  // Обновление токена (создание нового на основе старого)
  refreshToken(oldToken) {
    // Получаем данные из старого токена
    const decoded = this.verifyToken(oldToken);
    // Удаляем служебные поля времени
    delete decoded.iat;
    delete decoded.exp;
    // Создаем новый токен с теми же данными
    return this.generateToken(decoded);
  }
}`
      },
      aes: {
        title: 'AES Encryption для Web API',
        description: 'Шифрование данных в REST API с использованием AES',
        code: `// Класс для шифрования данных алгоритмом AES-256 в веб-приложениях
const crypto = require('crypto');

class AESCrypto {
  constructor(secretKey) {
    // Используем алгоритм AES-256-GCM (безопасный режим с аутентификацией)
    this.algorithm = 'aes-256-gcm';
    // Создаем 32-байтный ключ из пароля с помощью функции scrypt
    this.secretKey = crypto.scryptSync(secretKey, 'salt', 32);
  }

  // Функция шифрования текста
  encrypt(text) {
    // Генерируем случайный вектор инициализации (IV)
    const iv = crypto.randomBytes(16);
    // Создаем объект для шифрования
    const cipher = crypto.createCipher(this.algorithm, this.secretKey, iv);
    
    // Шифруем текст по частям
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Получаем тег аутентификации для проверки целостности
    const authTag = cipher.getAuthTag();
    
    // Возвращаем зашифрованные данные, IV и тег
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Функция расшифровки данных
  decrypt(encryptedData) {
    // Создаем объект для расшифровки с исходным IV
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.secretKey, 
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    // Устанавливаем тег аутентификации для проверки
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    // Расшифровываем данные
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}`
      },
      oauth: {
        title: 'OAuth 2.0 Implementation',
        description: 'Реализация OAuth 2.0 для безопасной авторизации',
        code: `// Сервер OAuth 2.0 для безопасной авторизации сторонних приложений
class OAuth2Server {
  constructor() {
    // Хранилище зарегистрированных клиентских приложений
    this.clients = new Map();
    // Хранилище временных токенов и кодов авторизации
    this.tokens = new Map();
  }

  // Регистрация нового клиентского приложения
  registerClient(clientId, clientSecret, redirectUri) {
    this.clients.set(clientId, {
      clientSecret,    // Секретный ключ приложения
      redirectUri,     // URL для перенаправления после авторизации
      scopes: ['read', 'write']  // Разрешения приложения
    });
  }

  // Генерация кода авторизации после согласия пользователя
  generateAuthCode(clientId, userId, scopes) {
    // Создаем случайный код авторизации
    const authCode = crypto.randomBytes(32).toString('hex');
    
    // Сохраняем код с ограниченным временем жизни
    this.tokens.set(authCode, {
      clientId,
      userId,
      scopes,
      type: 'authorization_code',
      expiresAt: Date.now() + 600000 // 10 минут
    });
    
    return authCode;
  }

  // Обмен кода авторизации на токен доступа
  exchangeCodeForToken(authCode, clientId, clientSecret) {
    const tokenData = this.tokens.get(authCode);
    const client = this.clients.get(clientId);
    
    // Проверяем валидность кода и клиента
    if (!tokenData || !client || client.clientSecret !== clientSecret) {
      throw new Error('Недействительный код авторизации');
    }
    
    // Проверяем, не истек ли код
    if (tokenData.expiresAt < Date.now()) {
      throw new Error('Код авторизации истек');
    }
    
    // Генерируем токены доступа
    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    // Удаляем использованный код
    this.tokens.delete(authCode);
    
    // Возвращаем токены клиенту
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600  // 1 час
    };
  }
}`
      },
      blockchain: {
        title: 'Blockchain Hash Implementation',
        description: 'Реализация блокчейн-хеширования для веб-приложений',
        code: `// Класс для работы с блокчейн-хешированием (как в Bitcoin)
const crypto = require('crypto');

class BlockchainHash {
  // Функция для вычисления SHA-256 хеша от данных
  static calculateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Создание нового блока в блокчейне
  static createBlock(index, previousHash, data, timestamp = Date.now()) {
    // Объединяем все данные блока в одну строку
    const blockData = index + previousHash + JSON.stringify(data) + timestamp;
    // Вычисляем хеш блока
    const hash = this.calculateHash(blockData);
    
    // Возвращаем структуру блока
    return {
      index,        // Номер блока в цепи
      timestamp,    // Время создания
      data,         // Данные блока (транзакции)
      previousHash, // Хеш предыдущего блока
      hash,         // Хеш текущего блока
      nonce: 0      // Число для майнинга
    };
  }

  // Майнинг блока (поиск нужного хеша)
  static mineBlock(block, difficulty = 4) {
    // Создаем шаблон из нулей (например, "0000")
    const target = Array(difficulty + 1).join('0');
    
    // Подбираем nonce пока хеш не начнется с нужного количества нулей
    while (block.hash.substring(0, difficulty) !== target) {
      block.nonce++;  // Увеличиваем nonce
      // Пересчитываем хеш с новым nonce
      const blockData = block.index + block.previousHash + 
                       JSON.stringify(block.data) + block.timestamp + block.nonce;
      block.hash = this.calculateHash(blockData);
    }
    
    return block;  // Возвращаем "добытый" блок
  }
}`
      },
      webauthn: {
        title: 'WebAuthn Biometric Authentication',
        description: 'Современная биометрическая аутентификация в браузере',
        code: `// Менеджер для биометрической аутентификации через WebAuthn API
class WebAuthnManager {
  // Регистрация нового пользователя с биометрией
  async registerUser(username) {
    // Настройки для создания биометрического ключа
    const publicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(32),  // Случайный вызов от сервера
      rp: { name: 'CryptoSecure App' },  // Информация о сайте
      user: {
        id: new TextEncoder().encode(username),  // ID пользователя
        name: username,
        displayName: username
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],  // Алгоритм ключа
      authenticatorSelection: {
        authenticatorAttachment: 'platform',  // Встроенный сенсор
        userVerification: 'required'  // Требуется биометрия
      },
      timeout: 60000,     // Таймаут 60 секунд
      attestation: 'direct'  // Прямая аттестация
    };

    try {
      // Запрашиваем у браузера создание биометрического ключа
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });
      
      // Возвращаем данные созданного ключа
      return {
        id: credential.id,
        rawId: credential.rawId,
        response: credential.response
      };
    } catch (error) {
      throw new Error('Ошибка регистрации: ' + error.message);
    }
  }

  // Аутентификация пользователя по биометрии
  async authenticateUser(credentialId) {
    // Настройки для проверки биометрического ключа
    const publicKeyCredentialRequestOptions = {
      challenge: new Uint8Array(32),  // Новый вызов от сервера
      allowCredentials: [{
        id: credentialId,      // ID сохраненного ключа
        type: 'public-key'
      }],
      timeout: 60000,          // Таймаут 60 секунд
      userVerification: 'required'  // Требуется биометрия
    };

    try {
      // Запрашиваем подтверждение биометрии
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });
      
      return assertion;  // Возвращаем результат проверки
    } catch (error) {
      throw new Error('Ошибка аутентификации: ' + error.message);
    }
  }
}`
      }
    };

    return (
      <div className="space-y-8 max-w-7xl mx-auto" data-name="web-implementation" data-file="components/WebImplementation.jsx">
        <div className="section-header">
          <h2 className="section-title">Веб-реализация криптографии</h2>
          <p className="section-subtitle">
            Практические примеры реализации криптографических методов в современных веб-приложениях
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {Object.entries(examples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setSelectedExample(key)}
              className={`card-compact text-left transition-all duration-300 transform hover:scale-105 ${selectedExample === key
                  ? 'ring-2 ring-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-5'
                  : 'hover:shadow-xl'
                }`}
            >
              <h3 className="font-bold text-[var(--text-primary)] mb-2">{example.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{example.description}</p>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              {examples[selectedExample].title}
            </h3>
            <AnimatedCopyButton text={examples[selectedExample].code} />
          </div>

          <p className="text-[var(--text-secondary)] mb-6">{examples[selectedExample].description}</p>

          <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
              {examples[selectedExample].code}
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('WebImplementation component error:', error);
    return null;
  }
}

export default WebImplementation

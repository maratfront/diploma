export const ALGORITHM_INFO = {
  'aes-gcm': {
    name: 'AES-256',
    description: 'Современный стандарт шифрования (используется в банках, HTTPS, WhatsApp)',
    security: 'Очень высокая'
  },
  'chacha20': {
    name: 'ChaCha20',
    description: 'Быстрый потоковый шифр (используется в TLS, VPN, современных приложениях)',
    security: 'Очень высокая'
  },
  'blowfish': {
    name: 'Blowfish',
    description: 'Блочный шифр с переменным ключом (используется в архивации, embedded системах)',
    security: 'Средняя'
  },
  'twofish': {
    name: 'Twofish',
    description: '128-битный блочный шифр (финалист конкурса AES)',
    security: 'Высокая'
  },
  'caesar': {
    name: 'Caesar Cipher',
    description: 'Шифр сдвига для обучения (не для реального использования)',
    security: 'Очень низкая'
  },
  'base64': {
    name: 'Base64',
    description: 'Кодирование данных (не шифрование, используется для передачи данных)',
    security: 'Нет защиты'
  },
  'sha256': {
    name: 'SHA-256',
    description: 'Криптографический хэш (используется в блокчейне, SSL/TLS)',
    security: 'Высокая'
  },
  'argon2': {
    name: 'Argon2',
    description: 'Победитель Password Hashing Competition 2015 (для хэширования паролей)',
    security: 'Очень высокая'
  },
  'ecc': {
    name: 'ECC',
    description: 'Криптография на эллиптических кривых (малые ключи, высокая безопасность)',
    security: 'Очень высокая'
  },
  'rsa': {
    name: 'RSA',
    description: 'Асимметричное шифрование (цифровые подписи, шифрование)',
    security: 'Высокая'
  }
};

export const MENU_ITEMS = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Панель управления', description: 'Обзор системы' },
  { id: 'encryption', icon: 'lock', label: 'Текстовое шифрование', description: 'Шифрование текста' },
  { id: 'file-encryption', icon: 'file-lock', label: 'Шифрование файлов', description: 'Защита файлов' },
  { id: 'digital-signatures', icon: 'shield-check', label: 'Электронные подписи', description: 'Цифровая подпись' },
  { id: 'hashing', icon: 'hash', label: 'Хэширование', description: 'SHA-256, Argon2' },
  { id: 'ecc', icon: 'circle', label: 'ECC криптография', description: 'Эллиптические кривые' },
  { id: 'comparison', icon: 'chart-bar', label: 'Сравнение алгоритмов', description: 'Анализ методов' },
  { id: 'web-implementation', icon: 'code', label: 'Веб-реализация', description: 'Примеры кода' },
  { id: 'crypto-info', icon: 'book-open', label: 'База знаний', description: 'Теория криптографии' },
  { id: 'history', icon: 'history', label: 'История операций', description: 'Журнал активности' },
  { id: 'profile', icon: 'user', label: 'Личный кабинет', description: 'Настройки профиля' }
];

// Добавляем новые типы операций
export const OPERATION_TYPES = {
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  SIGN: 'sign',
  VERIFY: 'verify',
  HASH: 'hash',
  GENERATE_KEYPAIR: 'generate_keypair'
};

export const OPERATION_LABELS = {
  encrypt: 'Шифрование',
  decrypt: 'Расшифровка',
  sign: 'Подпись',
  verify: 'Проверка',
  hash: 'Хэширование',
  generate_keypair: 'Генерация ключей'
};

export const OPERATION_ICONS = {
  encrypt: 'lock',
  decrypt: 'lock-open',
  sign: 'pen-tool',
  verify: 'shield-check',
  hash: 'hash',
  generate_keypair: 'key'
};

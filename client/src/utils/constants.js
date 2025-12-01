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
  }
};

export const MENU_ITEMS = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Панель управления', description: 'Обзор системы' },
  { id: 'encryption', icon: 'lock', label: 'Текстовое шифрование', description: 'Шифрование текста' },
  { id: 'file-encryption', icon: 'file-lock', label: 'Шифрование файлов', description: 'Защита файлов' },
  { id: 'digital-signatures', icon: 'shield-check', label: 'Электронные подписи', description: 'Цифровая подпись' },
  { id: 'comparison', icon: 'chart-bar', label: 'Сравнение алгоритмов', description: 'Анализ методов' },
  { id: 'web-implementation', icon: 'code', label: 'Веб-реализация', description: 'Примеры кода' },
  { id: 'crypto-info', icon: 'book-open', label: 'База знаний', description: 'Теория криптографии' },
  { id: 'history', icon: 'history', label: 'История операций', description: 'Журнал активности' },
  { id: 'profile', icon: 'user', label: 'Личный кабинет', description: 'Настройки профиля' }
];

export const OPERATION_TYPES = {
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  SIGN: 'sign',
  VERIFY: 'verify'
};

export const OPERATION_LABELS = {
  encrypt: 'Шифрование',
  decrypt: 'Расшифровка',
  sign: 'Подпись',
  verify: 'Проверка'
};

export const OPERATION_ICONS = {
  encrypt: 'lock',
  decrypt: 'lock-open',
  sign: 'pen-tool',
  verify: 'shield-check'
};

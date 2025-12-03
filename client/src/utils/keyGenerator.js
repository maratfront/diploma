// Secure Key Generator using Web Crypto API
const DEFAULT_WORD_LIST = [
  'apple', 'banana', 'cherry', 'dragon', 'elephant', 'forest', 'garden', 'harbor',
  'island', 'jungle', 'kingdom', 'lion', 'mountain', 'notebook', 'ocean', 'palace',
  'queen', 'river', 'sunset', 'thunder', 'universe', 'village', 'wizard', 'yellow'
];

class KeyGenerator {
  static presets = Object.freeze({
    pin: { length: 6, lowercase: false, uppercase: false, numbers: true, special: false, name: 'PIN код' },
    basic: { length: 12, lowercase: true, uppercase: true, numbers: true, special: false, name: 'Базовый' },
    strong: { length: 16, lowercase: true, uppercase: true, numbers: true, special: true, name: 'Сильный' },
    maximum: { length: 32, lowercase: true, uppercase: true, numbers: true, special: true, name: 'Максимальный' },
    memorable: { length: 16, lowercase: true, uppercase: true, numbers: true, special: false, name: 'Запоминаемый' },
    custom: { length: 20, lowercase: true, uppercase: true, numbers: true, special: true, name: 'Пользовательский' }
  });

  static getCrypto() {
    const cryptoApi = globalThis.crypto || globalThis.msCrypto;
    if (!cryptoApi?.getRandomValues) {
      throw new Error('Web Crypto API недоступен');
    }
    return cryptoApi;
  }

  static generateSecureKey(options = {}) {
    const {
      length = 32,
      lowercase = true,
      uppercase = true,
      numbers = true,
      special = true,
      excludeSimilar = false,
      excludeAmbiguous = false
    } = options;

    // Нормализуем длину и ограничиваем разумными пределами
    const safeLength = Math.max(
      4,
      Math.min(128, Number.isFinite(length) ? Math.floor(length) : 32)
    );

    let lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    let uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numberChars = '0123456789';
    let specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Exclude similar looking characters
    if (excludeSimilar) {
      lowercaseChars = lowercaseChars.replace(/[il1o0]/g, '');
      uppercaseChars = uppercaseChars.replace(/[IL1O0]/g, '');
      numberChars = numberChars.replace(/[10]/g, '');
    }

    // Exclude ambiguous characters
    if (excludeAmbiguous) {
      specialChars = specialChars.replace(/[{}[\]()\/\\'"~,;:.<>]/g, '');
    }

    let charset = '';
    const required = [];

    if (lowercase) {
      charset += lowercaseChars;
      required.push(lowercaseChars);
    }
    if (uppercase) {
      charset += uppercaseChars;
      required.push(uppercaseChars);
    }
    if (numbers) {
      charset += numberChars;
      required.push(numberChars);
    }
    if (special) {
      charset += specialChars;
      required.push(specialChars);
    }

    if (charset.length === 0) {
      throw new Error('Выберите хотя бы один тип символов');
    }

    // Generate random password
    const randomValues = new Uint32Array(safeLength);
    const cryptoApi = this.getCrypto();
    cryptoApi.getRandomValues(randomValues);

    let key = '';

    // Ensure at least one character from each required set
    for (let i = 0; i < required.length && i < safeLength; i++) {
      const set = required[i];
      key += set[randomValues[i] % set.length];
    }

    // Fill remaining length
    for (let i = required.length; i < safeLength; i++) {
      key += charset[randomValues[i] % charset.length];
    }

    // Shuffle the password
    return this.shuffleString(key);
  }

  static shuffleString(str) {
    if (!str || str.length <= 1) return str;

    const arr = str.split('');
    try {
      const cryptoApi = this.getCrypto();
      // Генерируем все случайные числа за один раз
      const randomValues = new Uint32Array(arr.length);
      cryptoApi.getRandomValues(randomValues);

      for (let i = arr.length - 1; i > 0; i--) {
        const j = randomValues[i] % (i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } catch (error) {
      // Fallback: Fisher-Yates shuffle с Math.random()
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    return arr.join('');
  }

  static generatePassphrase(wordCount = 4, separator = '-', capitalize = true) {
    const cryptoApi = this.getCrypto();

    const randomValues = new Uint32Array(wordCount);
    cryptoApi.getRandomValues(randomValues);

    let passphrase = [];
    for (let i = 0; i < wordCount; i++) {
      let word = DEFAULT_WORD_LIST[randomValues[i] % DEFAULT_WORD_LIST.length];
      if (capitalize) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      passphrase.push(word);
    }

    return passphrase.join(separator);
  }

  static async saveToHistory(password) {
    try {
      if (typeof localStorage === 'undefined') return;

      const hashedPassword = await this.hashPassword(password);
      const history = JSON.parse(localStorage.getItem('password_history') || '[]');

      const alreadyExists = history.some(entry =>
        entry.hashedPassword === hashedPassword
      );

      if (!alreadyExists) {
        const entry = {
          hashedPassword,
          timestamp: Date.now(),
          strength: this.assessKeyStrength(password),
          displayPrefix: password.substring(0, 3) + '***'
        };

        history.unshift(entry);
        if (history.length > 10) history.pop();
        localStorage.setItem('password_history', JSON.stringify(history));
      }
    } catch (e) {
      console.error('Error saving to history:', e);
    }
  }

  static async hashPassword(password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return btoa(password).substring(0, 32);
    }
  }

  static getHistory() {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      return JSON.parse(localStorage.getItem('password_history') || '[]');
    } catch (e) {
      return [];
    }
  }

  static clearHistory() {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem('password_history');
  }

  static calculateEntropy(password) {
    if (!password) return 0;

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    let poolSize = 0;
    if (hasLowercase) poolSize += 26;
    if (hasUppercase) poolSize += 26;
    if (hasNumbers) poolSize += 10;
    if (hasSpecial) poolSize += 32;

    if (poolSize === 0) {
      return 0;
    }

    // Entropy = log2(poolSize^length)
    const entropy = password.length * Math.log2(poolSize);
    return Math.round(entropy);
  }

  static assessKeyStrength(password) {
    if (!password) return {
      level: 0,
      label: 'Нет ключа',
      color: 'gray',
      description: 'Введите пароль',
      crackTime: '',
      score: 0
    };

    const entropy = this.calculateEntropy(password);
    const length = password.length;

    // Calculate estimated crack time
    const crackTime = this.estimateCrackTime(entropy);

    // Check for common patterns
    const hasSequential = /(?:abc|bcd|cde|def|123|234|345|456|567|678|789|890)/i.test(password);
    const hasRepeating = /(.)\1{2,}/.test(password);
    const commonPatterns = hasSequential || hasRepeating;

    let score = 0;
    if (length >= 8) score += 20;
    if (length >= 12) score += 20;
    if (length >= 16) score += 20;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^a-zA-Z0-9]/.test(password)) score += 10;
    if (commonPatterns) score -= 30;

    score = Math.max(0, Math.min(100, score));

    // Strength levels
    if (score >= 80 && entropy >= 80 && !commonPatterns) {
      return {
        level: 5,
        label: 'Превосходный',
        color: 'green',
        description: 'Практически невзламываемый пароль',
        crackTime,
        score
      };
    } else if (score >= 60 && entropy >= 60) {
      return {
        level: 4,
        label: 'Очень сильный',
        color: 'green',
        description: 'Отличная защита для важных данных',
        crackTime,
        score
      };
    } else if (score >= 40 && entropy >= 40) {
      return {
        level: 3,
        label: 'Хороший',
        color: 'yellow',
        description: 'Подходит для большинства задач',
        crackTime,
        score
      };
    } else if (score >= 20 && entropy >= 28) {
      return {
        level: 2,
        label: 'Средний',
        color: 'orange',
        description: 'Минимально приемлемый уровень',
        crackTime,
        score
      };
    } else {
      return {
        level: 1,
        label: 'Слабый',
        color: 'red',
        description: 'Небезопасно! Используйте более длинный пароль',
        crackTime,
        score
      };
    }
  }

  static estimateCrackTime(entropy) {
    // Assume 1 billion attempts per second (modern hardware)
    const attemptsPerSecond = 1e9;
    const possibleCombinations = Math.pow(2, entropy);
    const seconds = possibleCombinations / (2 * attemptsPerSecond);

    if (seconds < 1) return 'мгновенно';
    if (seconds < 60) return `${Math.round(seconds)} сек`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} мин`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} ч`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} дней`;
    if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} лет`;
    if (seconds < 31536000 * 1e6) return `${Math.round(seconds / (31536000 * 1e3))} тыс. лет`;
    if (seconds < 31536000 * 1e9) return `${Math.round(seconds / (31536000 * 1e6))} млн. лет`;
    return 'миллиарды лет';
  }
}

export default KeyGenerator;

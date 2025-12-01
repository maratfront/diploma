import React from 'react'
import { encryptText, decryptText } from '../utils/cryptoUtils.js'
import { addToHistory } from '../utils/storage.js'
import { NotificationManager } from './Notification.jsx'

function EncryptionPanel() {
  try {
    const [inputText, setInputText] = React.useState('');
    const [outputText, setOutputText] = React.useState('');
    const [algorithm, setAlgorithm] = React.useState('aes-gcm');
    const [key, setKey] = React.useState('');
    const [operation, setOperation] = React.useState('encrypt');
    const [isProcessing, setIsProcessing] = React.useState(false);

    const algorithmInfo = {
      'aes-gcm': { name: 'AES-256', description: 'Современный стандарт шифрования (используется в банках, HTTPS, WhatsApp)', security: 'Очень высокая' },
      'chacha20': { name: 'ChaCha20', description: 'Быстрый потоковый шифр (используется в TLS, VPN, современных приложениях)', security: 'Очень высокая' },
      'blowfish': { name: 'Blowfish', description: 'Блочный шифр с переменным ключом (используется в архивации, embedded системах)', security: 'Средняя' },
      'twofish': { name: 'Twofish', description: '128-битный блочный шифр (финалист конкурса AES)', security: 'Высокая' },
      'caesar': { name: 'Caesar Cipher', description: 'Шифр сдвига для обучения (не для реального использования)', security: 'Очень низкая' },
      base64: { name: 'Base64', description: 'Кодирование данных (не шифрование, используется для передачи данных)', security: 'Нет защиты' }
    };

    const handleProcess = async () => {
      if (!inputText.trim()) return;

      setIsProcessing(true);

      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      let result = '';

      try {
        if (operation === 'encrypt') {
          result = await encryptText(inputText, algorithm, key);
        } else {
          result = await decryptText(inputText, algorithm, key);
        }

        setOutputText(result);

        await addToHistory({
          type: operation,
          algorithm: algorithm.toUpperCase(),
          input: inputText,
          output: result,
          timestamp: Date.now()
        });

        NotificationManager.success(
          operation === 'encrypt'
            ? 'Текст успешно зашифрован!'
            : 'Текст успешно расшифрован!'
        );
      } catch (error) {
        console.error('Encryption/Decryption error:', error);
        setOutputText('Ошибка: ' + error.message);
        NotificationManager.error('Ошибка обработки: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
    };

    const clearFields = () => {
      setInputText('');
      setOutputText('');
      setKey('');
    };

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="encryption-panel" data-file="components/EncryptionPanel.jsx">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Криптографическая лаборатория</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Профессиональные инструменты для шифрования и защиты данных с поддержкой современных алгоритмов
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="card p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary-color)] rounded-xl flex items-center justify-center">
                <div className="icon-settings text-lg sm:text-xl text-white"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Настройки операции</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Тип операции</label>
                <div className="grid grid-cols-2 gap-2">
                  {['encrypt', 'decrypt'].map(op => (
                    <button
                      key={op}
                      onClick={() => setOperation(op)}
                      className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${operation === op
                          ? 'bg-[var(--primary-color)] text-white shadow-lg'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                    >
                      {op === 'encrypt' ? 'Шифрование' : 'Расшифровка'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Алгоритм шифрования</label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="input-field"
                >
                  <option value="aes-gcm">AES-256 (Современный стандарт)</option>
                  <option value="chacha20">ChaCha20 (Быстрый потоковый)</option>
                  <option value="blowfish">Blowfish (Блочный шифр)</option>
                  <option value="twofish">Twofish (Финалист AES)</option>
                  <option value="caesar">Caesar Cipher (Обучающий)</option>
                  <option value="base64">Base64 (Кодирование)</option>
                </select>
                <div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded-xl">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{algorithmInfo[algorithm].name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{algorithmInfo[algorithm].description}</p>
                  <p className="text-xs text-[var(--accent-color)] font-medium">
                    Безопасность: {algorithmInfo[algorithm].security}
                  </p>
                </div>
              </div>

              {algorithm !== 'base64' && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                    {algorithm === 'caesar' ? 'Сдвиг (число от 1 до 25)' : 'Ключ шифрования'}
                  </label>
                  <input
                    type={algorithm === 'caesar' ? 'number' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="input-field"
                    placeholder={algorithm === 'caesar' ? 'Введите число сдвига (например, 3)' : 'Введите надежный пароль'}
                    min={algorithm === 'caesar' ? '1' : undefined}
                    max={algorithm === 'caesar' ? '25' : undefined}
                  />
                </div>
              )}


              <button onClick={clearFields} className="btn-secondary w-full">
                <div className="icon-refresh-cw text-lg mr-2"></div>
                Очистить поля
              </button>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-color)] rounded-xl flex items-center justify-center">
                  <div className="icon-terminal text-lg sm:text-xl text-white"></div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Обработка данных</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Входные данные
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="input-field h-40 resize-none"
                    placeholder="Введите текст для обработки..."
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Символов: {inputText.length}
                  </p>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={!inputText.trim() || isProcessing}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
                      Обработка...
                    </>
                  ) : (
                    <>
                      <div className={`icon-${operation === 'encrypt' ? 'lock' : 'lock-open'} text-lg mr-2`}></div>
                      {operation === 'encrypt' ? 'Зашифровать данные' : 'Расшифровать данные'}
                    </>
                  )}
                </button>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-[var(--text-primary)]">
                      Результат обработки
                    </label>
                    {outputText && <CopyButton text={outputText} />}
                  </div>
                  <textarea
                    value={outputText}
                    readOnly
                    className="input-field h-40 resize-none bg-[var(--bg-tertiary)]"
                    placeholder="Результат появится здесь после обработки..."
                  />
                  {outputText && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      Символов: {outputText.length}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('EncryptionPanel component error:', error);
    return null;
  }
}

// Copy button with animation
function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn-secondary transition-all duration-300 ${copied ? 'bg-green-500 text-white transform scale-110' : ''
        }`}
    >
      <div className={`${copied ? 'icon-check' : 'icon-copy'} text-lg mr-2 transition-all duration-300`}></div>
      {copied ? 'Скопировано!' : 'Копировать'}
    </button>
  );
}

export default EncryptionPanel
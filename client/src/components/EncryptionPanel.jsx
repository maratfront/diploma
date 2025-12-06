import React from 'react'
import { encryptText, decryptText } from '../utils/cryptoUtils.js'
import { addToHistory } from '../utils/storage.js'
import { NotificationManager } from './Notification.jsx'
import CopyButton from './common/CopyButton.jsx'
import { ALGORITHM_INFO } from '../utils/constants.js'
import KeyGeneratorModal from './KeyGeneratorModal.jsx'

function EncryptionPanel() {
  try {
    const [inputText, setInputText] = React.useState('');
    const [outputText, setOutputText] = React.useState('');
    const [algorithm, setAlgorithm] = React.useState('aes-gcm');
    const [key, setKey] = React.useState('');
    const [operation, setOperation] = React.useState('encrypt');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isKeyGeneratorOpen, setIsKeyGeneratorOpen] = React.useState(false);

    const handleProcess = async () => {
      if (!inputText.trim()) {
        NotificationManager.warning('Введите текст для обработки');
        return;
      }

      if (algorithm !== 'base64' && algorithm !== 'caesar') {
        if (!key.trim()) {
          NotificationManager.error('Введите ключ шифрования');
          return;
        }
        if (key.length < 8) {
          NotificationManager.warning('Ключ должен содержать минимум 8 символов');
          return;
        }
      }

      if (algorithm === 'caesar' && (!key || parseInt(key) < 1 || parseInt(key) > 25)) {
        NotificationManager.error('Сдвиг должен быть числом от 1 до 25');
        return;
      }

      setIsProcessing(true);

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

    const validateCaesarKey = (value) => {
      if (value === '') return '';
      const num = parseInt(value, 10);
      if (isNaN(num)) return '';
      if (num < 1) return '1';
      if (num > 25) return '25';
      return num.toString();
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
                  <p className="text-sm font-medium text-[var(--text-primary)]">{ALGORITHM_INFO[algorithm]?.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{ALGORITHM_INFO[algorithm]?.description}</p>
                  <p className="text-xs text-[var(--accent-color)] font-medium">
                    Безопасность: {ALGORITHM_INFO[algorithm]?.security}
                  </p>
                </div>
              </div>

              {algorithm !== 'base64' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-[var(--text-primary)]">
                      {algorithm === 'caesar' ? 'Сдвиг (число от 1 до 25)' : 'Ключ шифрования'}
                    </label>
                    {algorithm !== 'caesar' && (
                      <button
                        type="button"
                        onClick={() => setIsKeyGeneratorOpen(true)}
                        className="text-xs font-semibold text-[var(--primary-color)] hover:text-[var(--accent-color)] flex items-center space-x-1"
                      >
                        <div className="icon-key text-sm"></div>
                        <span>Генератор ключей</span>
                      </button>
                    )}
                  </div>

                  <input
                    type={algorithm === 'caesar' ? 'number' : 'password'}
                    value={key}
                    onChange={(e) => {
                      if (algorithm === 'caesar') {
                        setKey(validateCaesarKey(e.target.value));
                      } else {
                        setKey(e.target.value);
                      }
                    }}
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

        <KeyGeneratorModal
          isOpen={isKeyGeneratorOpen}
          onClose={() => setIsKeyGeneratorOpen(false)}
          onKeyGenerated={(generatedKey) => {
            setKey(generatedKey);
            NotificationManager.info('Ключ автоматически подставлен');
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('EncryptionPanel component error:', error);
    return null;
  }
}

export default EncryptionPanel

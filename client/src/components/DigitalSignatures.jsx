import React from 'react'
import { NotificationManager } from './Notification.jsx'
import { addToHistory } from '../utils/storage.js'

const API_BASE = 'http://127.0.0.1:8000/api/security';

async function authorizedPost(path, body) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify(body || {})
  });

  if (!res.ok) {
    let detail = 'Ошибка запроса к серверу';
    try {
      const data = await res.json();
      if (data && data.detail) {
        detail = data.detail;
      }
    } catch (e) {
      // ignore
    }
    throw new Error(detail);
  }

  return res.json();
}

function DigitalSignatures() {
  const [message, setMessage] = React.useState('');
  const [signature, setSignature] = React.useState('');
  const [keyPair, setKeyPair] = React.useState(null);
  const [operation, setOperation] = React.useState('sign');
  const [verificationResult, setVerificationResult] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const generateKeyPair = async () => {
    setIsProcessing(true);
    try {
      const data = await authorizedPost('/rsa/keypair/', {});
      setKeyPair({
        publicKey: data.public_key,
        privateKey: data.private_key,
        publicKeyDisplay: data.public_key,
        privateKeyDisplay: data.private_key
      });
      NotificationManager.success('Ключевая пара RSA успешно сгенерирована на сервере');
    } catch (error) {
      console.error('Ошибка генерации ключей:', error);
      NotificationManager.error('Ошибка генерации ключей: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    // Генерируем ключевую пару при загрузке (на бэкенде)
    generateKeyPair();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSign = async () => {
    if (!message.trim() || !keyPair) return;

    setIsProcessing(true);

    try {
      const data = await authorizedPost('/rsa/sign/', {
        message,
        private_key: keyPair.privateKey
      });

      const signatureB64 = data.signature;
      setSignature(signatureB64);

      await addToHistory({
        type: 'sign',
        algorithm: 'RSA-PSS-2048',
        input: message,
        output: signatureB64,
        timestamp: Date.now()
      });

      NotificationManager.success('Цифровая подпись успешно создана (на сервере)!');
    } catch (error) {
      console.error('Ошибка подписи:', error);
      NotificationManager.error('Ошибка создания подписи: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerify = async () => {
    if (!message.trim() || !signature.trim() || !keyPair) return;

    setIsProcessing(true);

    try {
      const data = await authorizedPost('/rsa/verify/', {
        message,
        signature,
        public_key: keyPair.publicKey
      });

      const isValid = data.is_valid;
      setVerificationResult(isValid);

      await addToHistory({
        type: 'verify',
        algorithm: 'RSA-PSS-2048',
        input: `${message} | ${signature}`,
        output: isValid ? 'Подпись верна' : 'Подпись неверна',
        timestamp: Date.now()
      });

      if (isValid) {
        NotificationManager.success('Подпись действительна!');
      } else {
        NotificationManager.warning('Подпись недействительна!');
      }
    } catch (error) {
      console.error('Ошибка проверки:', error);
      setVerificationResult(false);
      NotificationManager.error('Ошибка проверки подписи: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="digital-signatures" data-file="components/DigitalSignatures.jsx">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Электронные подписи</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Создание и проверка цифровых подписей с использованием алгоритма RSA для обеспечения подлинности документов
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="card p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary-color)] rounded-xl flex items-center justify-center">
                <div className="icon-key text-lg sm:text-xl text-white"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Ключи RSA</h3>
            </div>

            {keyPair && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Открытый ключ (Public Key)
                  </label>
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <p className="text-xs font-mono text-[var(--text-secondary)] break-all">
                      {keyPair.publicKeyDisplay ? keyPair.publicKeyDisplay.substring(0, 100) + '...' : 'Генерация...'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Приватный ключ (Private Key)
                  </label>
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl">
                    <p className="text-xs font-mono text-[var(--text-secondary)] break-all">
                      {keyPair.privateKeyDisplay ? keyPair.privateKeyDisplay.substring(0, 100) + '...' : 'Генерация...'}
                    </p>
                  </div>
                </div>

                <button onClick={generateKeyPair} className="btn-secondary w-full">
                  <div className="icon-refresh-cw text-lg mr-2"></div>
                  Сгенерировать новые ключи
                </button>
              </div>
            )}
          </div>

          <div className="xl:col-span-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-color)] rounded-xl flex items-center justify-center">
                    <div className="icon-shield-check text-lg sm:text-xl text-white"></div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Цифровая подпись</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                  {['sign', 'verify'].map(op => (
                    <button
                      key={op}
                      onClick={() => setOperation(op)}
                      className={`px-3 sm:px-4 py-2 rounded-xl font-medium text-sm sm:text-base transition-all duration-300 transform hover:scale-105 ${operation === op
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                        }`}
                    >
                      {op === 'sign' ? 'Подписать' : 'Проверить'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Сообщение для {operation === 'sign' ? 'подписи' : 'проверки'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="input-field h-32 resize-none"
                    placeholder="Введите текст документа..."
                  />
                </div>

                {operation === 'verify' && (
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                      Подпись для проверки
                    </label>
                    <textarea
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="input-field h-24 resize-none"
                      placeholder="Вставьте цифровую подпись..."
                    />
                  </div>
                )}

                <button
                  onClick={operation === 'sign' ? handleSign : handleVerify}
                  disabled={!message.trim() || isProcessing || (operation === 'verify' && !signature.trim())}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
                      Обработка...
                    </>
                  ) : (
                    <>
                      <div className={`icon-${operation === 'sign' ? 'pen-tool' : 'check-circle'} text-lg mr-2`}></div>
                      {operation === 'sign' ? 'Создать подпись' : 'Проверить подпись'}
                    </>
                  )}
                </button>

                {operation === 'sign' && signature && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-[var(--text-primary)]">
                        Цифровая подпись
                      </label>
                      <CopyButton text={signature} />
                    </div>
                    <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl">
                      <p className="text-sm font-mono text-[var(--text-secondary)] break-all">
                        {signature.length > 200 ? signature.substring(0, 200) + '...' : signature}
                      </p>
                    </div>
                  </div>
                )}

                {operation === 'verify' && verificationResult !== null && (
                  <div className={`p-4 rounded-xl border ${verificationResult
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-red-50 border-red-300 text-red-700'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`icon-${verificationResult ? 'check-circle' : 'x-circle'} text-xl`}></div>
                      <div>
                        <p className="font-semibold">
                          {verificationResult ? 'Подпись действительна!' : 'Подпись недействительна!'}
                        </p>
                        <p className="text-sm">
                          {verificationResult
                            ? 'Документ не был изменен и подписан владельцем ключа.'
                            : 'Документ был изменен или подпись поддельная.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Как работают цифровые подписи</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-3">Процесс подписи:</h4>
              <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-[var(--primary-color)]">1.</span>
                  <span>Создается хеш документа (SHA-256)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-[var(--primary-color)]">2.</span>
                  <span>Хеш шифруется приватным ключом</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-[var(--primary-color)]">3.</span>
                  <span>Получается цифровая подпись</span>
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-3">Процесс проверки:</h4>
              <ol className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-[var(--accent-color)]">1.</span>
                  <span>Создается хеш проверяемого документа</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-[var(--accent-color)]">2.</span>
                  <span>Подпись расшифровывается открытым ключом</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold text-[var(--accent-color)]">3.</span>
                  <span>Сравниваются оба хеша</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
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
      className={`btn-secondary text-sm transition-all duration-300 ${copied ? 'bg-green-500 text-white transform scale-110' : ''
        }`}
    >
      <div className={`${copied ? 'icon-check' : 'icon-copy'} text-sm mr-1 transition-all duration-300`}></div>
      {copied ? 'Скопировано!' : 'Копировать'}
    </button>
  );
}

export default DigitalSignatures

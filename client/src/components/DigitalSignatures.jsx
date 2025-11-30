import React from 'react'

function DigitalSignatures() {
  try {
    const [message, setMessage] = React.useState('');
    const [signature, setSignature] = React.useState('');
    const [keyPair, setKeyPair] = React.useState(null);
    const [operation, setOperation] = React.useState('sign');
    const [verificationResult, setVerificationResult] = React.useState(null);
    const [isProcessing, setIsProcessing] = React.useState(false);

    React.useEffect(() => {
      // Генерируем ключевую пару при загрузке
      generateKeyPair();
    }, []);

    const generateKeyPair = async () => {
      try {
        // Real RSA key pair generation
        const keyPair = await crypto.subtle.generateKey(
          {
            name: 'RSA-PSS',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
          },
          true,
          ['sign', 'verify']
        );

        // Export keys for display
        const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

        setKeyPair({
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          publicKeyDisplay: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
          privateKeyDisplay: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
        });
      } catch (error) {
        console.error('Ошибка генерации ключей:', error);
      }
    };

    const handleSign = async () => {
      if (!message.trim() || !keyPair) return;

      setIsProcessing(true);

      try {
        // Sign message with private key
        const signature = await crypto.subtle.sign(
          {
            name: 'RSA-PSS',
            saltLength: 32
          },
          keyPair.privateKey,
          new TextEncoder().encode(message)
        );

        const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        setSignature(signatureB64);

        addToHistory({
          type: 'sign',
          algorithm: 'RSA-PSS-2048',
          input: message,
          output: signatureB64,
          timestamp: Date.now()
        });

        NotificationManager.success('Цифровая подпись успешно создана!');
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
        // Convert signature from base64
        const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

        // Verify signature with public key
        const isValid = await crypto.subtle.verify(
          {
            name: 'RSA-PSS',
            saltLength: 32
          },
          keyPair.publicKey,
          signatureBytes,
          new TextEncoder().encode(message)
        );

        setVerificationResult(isValid);

        addToHistory({
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
      <div className="space-y-8 max-w-7xl mx-auto" data-name="digital-signatures" data-file="components/DigitalSignatures.jsx">
        <div className="section-header">
          <h2 className="section-title">Электронные подписи</h2>
          <p className="section-subtitle">
            Создание и проверка цифровых подписей с использованием алгоритма RSA для обеспечения подлинности документов
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-[var(--primary-color)] rounded-xl flex items-center justify-center">
                <div className="icon-key text-xl text-white"></div>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Ключи RSA</h3>
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
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[var(--accent-color)] rounded-xl flex items-center justify-center">
                    <div className="icon-shield-check text-xl text-white"></div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Цифровая подпись</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['sign', 'verify'].map(op => (
                    <button
                      key={op}
                      onClick={() => setOperation(op)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${operation === op
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

        <div className="card">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Как работают цифровые подписи</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
  } catch (error) {
    console.error('DigitalSignatures component error:', error);
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
      className={`btn-secondary text-sm transition-all duration-300 ${copied ? 'bg-green-500 text-white transform scale-110' : ''
        }`}
    >
      <div className={`${copied ? 'icon-check' : 'icon-copy'} text-sm mr-1 transition-all duration-300`}></div>
      {copied ? 'Скопировано!' : 'Копировать'}
    </button>
  );
}

export default DigitalSignatures

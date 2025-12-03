import React from 'react'
import { readFileAsText, readFileAsBase64, isTextFile, isBinaryFile, getMimeType } from '../utils/fileUtils.js'
import { encryptFile, decryptFile } from '../utils/cryptoUtils.js'
import { addToHistory } from '../utils/storage.js'
import { NotificationManager } from './Notification.jsx'
import KeyGeneratorModal from './KeyGeneratorModal.jsx'

function FileEncryption() {
  try {
    const [selectedFile, setSelectedFile] = React.useState(null);
    const [algorithm, setAlgorithm] = React.useState('aes-gcm');
    const [key, setKey] = React.useState('');
    const [operation, setOperation] = React.useState('encrypt');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [result, setResult] = React.useState(null);
    const [isKeyGeneratorOpen, setIsKeyGeneratorOpen] = React.useState(false);

    const handleFileSelect = (file) => {
      if (file.size > 10 * 1024 * 1024) {
        NotificationManager.error('Размер файла не должен превышать 10MB');
        return;
      }

      setSelectedFile(file);
      setResult(null);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const handleFileProcess = async () => {
      if (!selectedFile) {
        NotificationManager.warning('Выберите файл для обработки');
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

      if (algorithm === 'caesar') {
        if (!key || parseInt(key) < 1 || parseInt(key) > 25) {
          NotificationManager.error('Сдвиг должен быть числом от 1 до 25');
          return;
        }
        if (!isTextFile(selectedFile)) {
          NotificationManager.error('Шифр Цезаря поддерживает только текстовые файлы');
          return;
        }
      }

      setIsProcessing(true);
      setResult(null);

      try {
        let fileContent;
        let isBinary = false;
        let mimeType = getMimeType(selectedFile.name);

        if (isTextFile(selectedFile)) {
          fileContent = await readFileAsText(selectedFile);
          isBinary = false;
        } else {
          fileContent = await readFileAsBase64(selectedFile);
          isBinary = true;
        }

        let processedContent;

        if (operation === 'encrypt') {
          processedContent = await encryptFile(fileContent, algorithm, key, isBinary);
        } else {
          processedContent = await decryptFile(fileContent, algorithm, key, isBinary);
        }

        let downloadUrl;

        if (isBinary || algorithm === 'base64') {
          const resultMimeType = operation === 'encrypt' || algorithm === 'base64'
            ? 'application/octet-stream'
            : mimeType;

          downloadUrl = `data:${resultMimeType};base64,${processedContent}`;
        } else {
          const blob = new Blob([processedContent], {
            type: operation === 'encrypt' ? 'application/octet-stream' : mimeType
          });
          downloadUrl = URL.createObjectURL(blob);
        }

        setResult({
          content: processedContent,
          downloadUrl: downloadUrl,
          filename: `${operation === 'encrypt' ? 'encrypted' : 'decrypted'}_${selectedFile.name}`,
          isBinary: isBinary,
          mimeType: operation === 'encrypt' ? 'application/octet-stream' : mimeType,
          originalSize: selectedFile.size,
          processedSize: processedContent.length
        });

        await addToHistory({
          type: operation,
          algorithm: algorithm.toUpperCase(),
          input: `Файл: ${selectedFile.name} (${isBinary ? 'бинарный' : 'текстовый'})`,
          output: `Обработан файл: ${selectedFile.size} → ${processedContent.length} байт`,
          timestamp: Date.now()
        });

        NotificationManager.success(`Файл успешно ${operation === 'encrypt' ? 'зашифрован' : 'расшифрован'}!`);
      } catch (error) {
        console.error('File processing error:', error);
        setResult({ error: error.message });
        NotificationManager.error('Ошибка обработки файла: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
    };

    const clearFields = () => {
      setSelectedFile(null);
      setKey('');
      setResult(null);
      NotificationManager.info('Поля очищены');
    };

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="file-encryption" data-file="components/FileEncryption.jsx">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Шифрование файлов</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Профессиональное шифрование файлов с поддержкой различных алгоритмов и форматов
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
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Операция</label>
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
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Алгоритм</label>
                <select
                  value={algorithm}
                  onChange={(e) => {
                    setAlgorithm(e.target.value);
                    setResult(null);
                  }}
                  className="input-field"
                >
                  <option value="aes-gcm">AES-256 (Современный стандарт)</option>
                  <option value="chacha20">ChaCha20 (Быстрый потоковый)</option>
                  <option value="blowfish">Blowfish (Блочный шифр)</option>
                  <option value="twofish">Twofish (Финалист AES)</option>
                  <option value="caesar">Caesar Cipher (Только текстовые файлы)</option>
                  <option value="base64">Base64 (Кодирование)</option>
                </select>
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
                    onChange={(e) => setKey(e.target.value)}
                    className="input-field"
                    placeholder={algorithm === 'caesar' ? 'Введите число сдвига' : 'Введите надежный ключ'}
                    min={algorithm === 'caesar' ? '1' : undefined}
                    max={algorithm === 'caesar' ? '25' : undefined}
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    {algorithm === 'caesar'
                      ? 'Для шифрования Цезаря требуется числовой ключ'
                      : 'Для бинарных файлов используйте одинаковый ключ при шифровании и расшифровке'}
                  </p>
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
                  <div className="icon-upload text-lg sm:text-xl text-white"></div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Обработка файла</h3>
              </div>

              <div
                className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-center transition-all duration-300 transform hover:scale-105 ${isDragOver
                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-5 scale-105'
                  : 'border-[var(--border-color)] hover:border-[var(--primary-color)]'
                  }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--bg-tertiary)] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <div className="icon-upload text-2xl sm:text-3xl text-[var(--text-secondary)]"></div>
                </div>

                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`text-xl ${selectedFile.name.endsWith('.pdf') ? 'text-red-500' :
                          selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx') ? 'text-blue-500' :
                            'text-[var(--primary-color)]'
                          }`}>
                          {selectedFile.name.endsWith('.pdf') ? '📄' :
                            selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx') ? '📝' :
                              selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx') ? '📊' :
                                selectedFile.name.endsWith('.jpg') || selectedFile.name.endsWith('.png') ? '🖼️' :
                                  '📃'}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {(selectedFile.size / 1024).toFixed(2)} KB •
                            {isTextFile(selectedFile) ? ' Текстовый' : ' Бинарный'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                        title="Удалить файл"
                      >
                        <div className="icon-x text-lg"></div>
                      </button>
                    </div>
                    <button
                      onClick={handleFileProcess}
                      disabled={isProcessing || (algorithm === 'caesar' && !isTextFile(selectedFile))}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <div className="icon-loader-2 text-lg mr-2 animate-spin"></div>
                          Обработка...
                        </>
                      ) : algorithm === 'caesar' && !isTextFile(selectedFile) ?
                        'Шифр Цезаря только для текстовых файлов' :
                        `${operation === 'encrypt' ? 'Зашифровать' : 'Расшифровать'} файл`}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Перетащите файл сюда или выберите
                    </p>
                    <p className="text-[var(--text-secondary)] mb-6">
                      Поддерживаются текстовые файлы (txt, json, xml, csv), документы (PDF, Word, Excel) и изображения до 10 МБ
                    </p>
                    <input
                      type="file"
                      onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="fileInput"
                      accept=".txt,.json,.xml,.csv,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                    <label htmlFor="fileInput" className="btn-primary cursor-pointer inline-flex items-center">
                      <div className="icon-folder-open text-lg mr-2"></div>
                      Выбрать файл
                    </label>
                  </div>
                )}
              </div>

              {result && (
                <div className="mt-8 p-6 bg-[var(--bg-tertiary)] rounded-2xl">
                  {result.error ? (
                    <div className="text-center text-red-600">
                      <div className="icon-alert-circle text-2xl mb-2"></div>
                      <p>Ошибка: {result.error}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <div className="icon-file-check text-3xl text-green-600"></div>
                      </div>
                      <p className="font-semibold text-[var(--text-primary)] mb-2">
                        Файл успешно {operation === 'encrypt' ? 'зашифрован' : 'расшифрован'}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Размер: {result.originalSize} → {result.processedSize} байт
                        {result.originalSize > result.processedSize ? ' (сжатие)' : ' (расширение)'}
                      </p>
                      <a
                        href={result.downloadUrl}
                        download={result.filename}
                        className="btn-primary inline-flex items-center mb-3"
                      >
                        <div className="icon-download text-lg mr-2"></div>
                        Скачать результат
                      </a>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {result.isBinary
                          ? 'Файл обработан в бинарном формате'
                          : 'Файл обработан в текстовом формате'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
              <div className="icon-info text-lg text-[var(--text-primary)]"></div>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Поддерживаемые форматы</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '📄', name: 'PDF', extensions: '.pdf', note: 'Бинарный формат' },
              { icon: '📝', name: 'Word', extensions: '.doc, .docx', note: 'Бинарный формат' },
              { icon: '📊', name: 'Excel', extensions: '.xls, .xlsx', note: 'Бинарный формат' },
              { icon: '📃', name: 'Текстовые', extensions: '.txt, .json, .xml, .csv', note: 'Текстовый формат' }
            ].map((format, index) => (
              <div key={index} className="bg-[var(--bg-secondary)] p-4 rounded-xl text-center">
                <div className="text-2xl mb-2">{format.icon}</div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">{format.name}</p>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{format.extensions}</p>
                <p className="text-xs text-[var(--text-secondary)]">{format.note}</p>
              </div>
            ))}
          </div>
        </div>

        <KeyGeneratorModal
          isOpen={isKeyGeneratorOpen}
          onClose={() => setIsKeyGeneratorOpen(false)}
          onKeyGenerated={(generatedKey) => {
            setKey(generatedKey);
            NotificationManager.info('Ключ автоматически подставлен в поле для ввода');
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('FileEncryption component error:', error);
    return null;
  }
}

export default FileEncryption

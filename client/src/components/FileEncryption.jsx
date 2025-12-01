import React from 'react'
import { readFileAsText } from '../utils/fileUtils.js'
import { encryptFile, decryptFile } from '../utils/cryptoUtils.js'
import { addToHistory } from '../utils/storage.js'
import { NotificationManager } from './Notification.jsx'

function FileEncryption() {
  try {
    const [selectedFile, setSelectedFile] = React.useState(null);
    const [algorithm, setAlgorithm] = React.useState('aes-gcm');
    const [key, setKey] = React.useState('');
    const [operation, setOperation] = React.useState('encrypt');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [result, setResult] = React.useState(null);

    const handleFileSelect = (file) => {
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
      if (!selectedFile) return;

      setIsProcessing(true);

      try {
        const fileContent = await readFileAsText(selectedFile);
        let processedContent;

        if (operation === 'encrypt') {
          processedContent = await encryptFile(fileContent, algorithm, key);
        } else {
          processedContent = await decryptFile(fileContent, algorithm, key);
        }

        const blob = new Blob([processedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        setResult({
          content: processedContent,
          downloadUrl: url,
          filename: `${operation}_${selectedFile.name}`
        });

        await addToHistory({
          type: operation,
          algorithm: algorithm.toUpperCase(),
          input: `Файл: ${selectedFile.name}`,
          output: `Обработан файл размером ${blob.size} байт`,
          timestamp: Date.now()
        });

        NotificationManager.success('Файл успешно обработан!');
      } catch (error) {
        setResult({ error: error.message });
        NotificationManager.error('Ошибка обработки файла: ' + error.message);
      } finally {
        setIsProcessing(false);
      }
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
            <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Настройки шифрования</h3>

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
                  onChange={(e) => setAlgorithm(e.target.value)}
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
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                    {algorithm === 'caesar' ? 'Сдвиг (число от 1 до 25)' : 'Ключ шифрования'}
                  </label>
                  <input
                    type={algorithm === 'caesar' ? 'number' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="input-field"
                    placeholder={algorithm === 'caesar' ? 'Введите число сдвига' : 'Введите надежный ключ'}
                    min={algorithm === 'caesar' ? '1' : undefined}
                    max={algorithm === 'caesar' ? '25' : undefined}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Загрузка файла</h3>

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
                        <div className="icon-file-text text-xl text-[var(--primary-color)]"></div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{selectedFile.name}</p>
                          <p className="text-sm text-[var(--text-secondary)]">{(selectedFile.size / 1024).toFixed(2)} KB</p>
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
                      disabled={isProcessing}
                      className="btn-primary w-full"
                    >
                      {isProcessing ? 'Обработка...' : `${operation === 'encrypt' ? 'Зашифровать' : 'Расшифровать'} файл`}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Перетащите файл сюда или выберите
                    </p>
                    <p className="text-[var(--text-secondary)] mb-6">Поддерживаются текстовые файлы до 10 МБ</p>
                    <input
                      type="file"
                      onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="fileInput"
                      accept=".txt,.json,.xml,.csv"
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
                      <p className="font-semibold text-[var(--text-primary)] mb-4">Файл успешно обработан</p>
                      <a
                        href={result.downloadUrl}
                        download={result.filename}
                        className="btn-primary inline-flex items-center"
                      >
                        <div className="icon-download text-lg mr-2"></div>
                        Скачать результат
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('FileEncryption component error:', error);
    return null;
  }
}

export default FileEncryption

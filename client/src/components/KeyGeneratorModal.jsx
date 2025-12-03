import React from 'react';
import KeyGenerator from '../utils/keyGenerator.js';
import KeyStrengthIndicator from './KeyStrengthIndicator.jsx';
import { NotificationManager } from './Notification.jsx';

function KeyGeneratorModal({ isOpen, onClose, onKeyGenerated }) {
  const [mode, setMode] = React.useState('password');
  const [preset, setPreset] = React.useState('strong');
  const [options, setOptions] = React.useState({
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    special: true,
    excludeSimilar: false,
    excludeAmbiguous: false
  });
  const [passphraseOptions, setPassphraseOptions] = React.useState({
    wordCount: 4,
    separator: '-',
    capitalize: true
  });
  const [generatedKey, setGeneratedKey] = React.useState('');
  const [history, setHistory] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);

  const handleGenerate = (modeOverride) => {
    try {
      const activeMode = modeOverride || mode;
      let key;
      if (activeMode === 'password') {
        key = KeyGenerator.generateSecureKey(options);
      } else {
        key = KeyGenerator.generatePassphrase(
          passphraseOptions.wordCount,
          passphraseOptions.separator,
          passphraseOptions.capitalize
        );
      }
      setGeneratedKey(key);
      KeyGenerator.saveToHistory(key);
      setHistory(KeyGenerator.getHistory());
    } catch (error) {
      NotificationManager.error(error.message);
    }
  };

  const handlePresetChange = (presetName) => {
    setPreset(presetName);
    const presetConfig = KeyGenerator.presets[presetName];
    setOptions(prev => ({
      ...prev,
      length: presetConfig.length,
      lowercase: presetConfig.lowercase,
      uppercase: presetConfig.uppercase,
      numbers: presetConfig.numbers,
      special: presetConfig.special
    }));
  };

  const handleUseKey = () => {
    if (!generatedKey) {
      NotificationManager.warning('Сначала сгенерируйте ключ');
      return;
    }
    onKeyGenerated(generatedKey);
    onClose();
    NotificationManager.success('Безопасный ключ применен!');
  };

  const handleCopyKey = React.useCallback(async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey);
      NotificationManager.success('Скопировано!');
    } catch (error) {
      NotificationManager.error('Не удалось скопировать ключ');
      console.error('Clipboard copy failed:', error);
    }
  }, [generatedKey]);

  React.useEffect(() => {
    if (isOpen) {
      handleGenerate();
      setHistory(KeyGenerator.getHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const strength = React.useMemo(
    () => KeyGenerator.assessKeyStrength(generatedKey),
    [generatedKey]
  );
  const entropy = React.useMemo(
    () => KeyGenerator.calculateEntropy(generatedKey),
    [generatedKey]
  );

  return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
        data-name="key-generator-modal"
        data-file="components/KeyGeneratorModal.js"
      >
        <div
          className="card max-w-4xl w-full my-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-xl flex items-center justify-center">
                <div className="icon-key text-xl text-white"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Генератор безопасных ключей
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">Инструмент для создания надежных паролей и passphrase</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-icon" aria-label="Закрыть генератор">
              <div className="icon-x text-lg"></div>
            </button>
          </div>

          <div className="flex space-x-2 mb-6">
            {[
              { id: 'password', label: 'Пароль', icon: 'lock' },
              { id: 'passphrase', label: 'Фраза', icon: 'message-square' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setMode(tab.id);
                  handleGenerate(tab.id);
                }}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${mode === tab.id
                    ? 'bg-[var(--primary-color)] text-white shadow-lg'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
              >
                <div className={`icon-${tab.icon} text-lg`}></div>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PasswordSettings
              mode={mode}
              preset={preset}
              options={options}
              passphraseOptions={passphraseOptions}
              onPresetChange={handlePresetChange}
              onOptionsChange={setOptions}
              onPassphraseOptionsChange={setPassphraseOptions}
            />

            <PasswordResult
              generatedKey={generatedKey}
              strength={strength}
              entropy={entropy}
              onGenerate={handleGenerate}
              onUseKey={handleUseKey}
              onCopy={handleCopyKey}
              history={history}
              showHistory={showHistory}
              onToggleHistory={() => setShowHistory(!showHistory)}
              onClearHistory={() => {
                KeyGenerator.clearHistory();
                setHistory([]);
              }}
              onSelectFromHistory={(key) => setGeneratedKey(key)}
            />
          </div>
        </div>
      </div>
    );
}

function PasswordSettings({ mode, preset, options, passphraseOptions, onPresetChange, onOptionsChange, onPassphraseOptionsChange }) {
  return (
    <div className="lg:col-span-1 space-y-4">
      {mode === 'password' ? (
        <>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Шаблоны</label>
            <select
              value={preset}
              onChange={(e) => onPresetChange(e.target.value)}
              className="input-field text-sm"
            >
              {Object.entries(KeyGenerator.presets).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Длина: {options.length} символов
            </label>
            <input
              type="range"
              min="6"
              max="64"
              value={options.length}
              onChange={(e) => onOptionsChange({ ...options, length: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Типы символов</label>
            {[
              { key: 'lowercase', label: 'Строчные (a-z)' },
              { key: 'uppercase', label: 'Заглавные (A-Z)' },
              { key: 'numbers', label: 'Цифры (0-9)' },
              { key: 'special', label: 'Спецсимволы (!@#$)' }
            ].map(opt => (
              <label key={opt.key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[opt.key]}
                  onChange={(e) => onOptionsChange({ ...options, [opt.key]: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Дополнительно</label>
            {[
              { key: 'excludeSimilar', label: 'Исключить похожие (i,l,1,O,0)' },
              { key: 'excludeAmbiguous', label: 'Исключить неоднозначные ({[()]})' }
            ].map(opt => (
              <label key={opt.key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[opt.key]}
                  onChange={(e) => onOptionsChange({ ...options, [opt.key]: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Количество слов: {passphraseOptions.wordCount}
            </label>
            <input
              type="range"
              min="3"
              max="8"
              value={passphraseOptions.wordCount}
              onChange={(e) => onPassphraseOptionsChange({ ...passphraseOptions, wordCount: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Разделитель</label>
            <select
              value={passphraseOptions.separator}
              onChange={(e) => onPassphraseOptionsChange({ ...passphraseOptions, separator: e.target.value })}
              className="input-field text-sm"
            >
              <option value="-">Дефис (-)</option>
              <option value="_">Подчеркивание (_)</option>
              <option value=".">Точка (.)</option>
              <option value=" ">Пробел ( )</option>
              <option value="">Без разделителя</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={passphraseOptions.capitalize}
              onChange={(e) => onPassphraseOptionsChange({ ...passphraseOptions, capitalize: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-[var(--text-primary)]">Заглавные буквы</span>
          </label>
        </>
      )}
    </div>
  );
}

function PasswordResult({ generatedKey, strength, entropy, onGenerate, onUseKey, onCopy, history, showHistory, onToggleHistory, onClearHistory, onSelectFromHistory }) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
          Сгенерированный пароль
        </label>
        <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl">
          <p className="text-lg font-mono text-[var(--text-primary)] break-all mb-4">
            {generatedKey || 'Нажмите "Сгенерировать"'}
          </p>
          {generatedKey && (
            <>
              <div className="mb-4">
                <KeyStrengthIndicator
                  strength={strength}
                  entropy={entropy}
                  length={generatedKey.length}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
                  <p className="text-[var(--text-secondary)] mb-1">Время взлома</p>
                  <p className="font-semibold text-[var(--text-primary)]">{strength.crackTime}</p>
                </div>
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
                  <p className="text-[var(--text-secondary)] mb-1">Оценка надежности</p>
                  <p className="font-semibold text-[var(--text-primary)]">{strength.score}/100</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <button onClick={onGenerate} className="btn-secondary flex-1">
          <div className="icon-refresh-cw text-lg mr-2"></div>
          Сгенерировать
        </button>
        <button
          onClick={onCopy}
          disabled={!generatedKey}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="icon-copy text-lg"></div>
        </button>
        <button onClick={onUseKey} className="btn-primary flex-1">
          <div className="icon-check text-lg mr-2"></div>
          Использовать
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <button
            onClick={onToggleHistory}
            className="w-full flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-secondary)] transition-all"
          >
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              История ({history.length})
            </span>
            <div className={`icon-chevron-${showHistory ? 'up' : 'down'} text-lg text-[var(--text-secondary)]`}></div>
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {history.map((entry, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectFromHistory(entry.password)}
                  className="p-3 bg-[var(--bg-primary)] rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)] transition-all"
                >
                  <p className="text-sm font-mono text-[var(--text-primary)] break-all mb-1">
                    {entry.password.substring(0, 40)}{entry.password.length > 40 ? '...' : ''}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>{entry.strength.label}</span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              <button onClick={onClearHistory} className="btn-secondary w-full text-sm">
                <div className="icon-trash-2 text-sm mr-2"></div>
                Очистить историю
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default KeyGeneratorModal;
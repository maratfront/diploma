import React from 'react'
import { getEncryptionHistory, exportHistory } from '../utils/storage.js'
import { NotificationManager } from './Notification.jsx'

function HistoryPanel() {
  try {
    const [history, setHistory] = React.useState([]);
    const [filter, setFilter] = React.useState('all');

    React.useEffect(() => {
      setHistory(getEncryptionHistory());
    }, []);

    const filteredHistory = history.filter(item => {
      if (filter === 'all') return true;
      return item.type === filter;
    });

    const clearHistory = () => {
      if (history.length === 0) {
        NotificationManager.info('История уже пуста');
        return;
      }
      if (window.confirm('Вы уверены, что хотите очистить всю историю операций?')) {
        localStorage.removeItem('encryptionHistory');
        setHistory([]);
        NotificationManager.success('История операций очищена');
      }
    };

    return (
      <div className="space-y-8 max-w-7xl mx-auto" data-name="history-panel" data-file="components/HistoryPanel.jsx">
        <div className="section-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">История операций</h2>
              <p className="section-subtitle">
                Полный журнал всех операций шифрования и расшифровки с возможностью фильтрации и экспорта
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field w-auto min-w-[160px]"
              >
                <option value="all">Все операции</option>
                <option value="encrypt">Шифрование</option>
                <option value="decrypt">Расшифровка</option>
                <option value="sign">Подпись</option>
                <option value="verify">Проверка</option>
              </select>

              {history.length > 0 && (
                <button onClick={() => exportHistory()} className="btn-secondary">
                  <div className="icon-download text-lg mr-2"></div>
                  Экспорт
                </button>
              )}

              <button onClick={clearHistory} className="btn-secondary">
                <div className="icon-trash-2 text-lg mr-2"></div>
                Очистить
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="icon-history text-3xl text-[var(--text-secondary)]"></div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">История операций пуста</h3>
              <p className="text-[var(--text-secondary)] mb-6">Начните использовать систему шифрования для создания истории операций</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item, index) => (
                <div key={index} className="border border-[var(--border-color)] rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.type === 'encrypt' || item.type === 'sign' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                        <div className={`icon-${item.type === 'encrypt' ? 'lock' :
                          item.type === 'decrypt' ? 'lock-open' :
                            item.type === 'sign' ? 'pen-tool' :
                              item.type === 'verify' ? 'shield-check' : 'lock-open'
                          } text-xl ${item.type === 'encrypt' || item.type === 'sign' ? 'text-green-600' : 'text-blue-600'
                          }`}></div>
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] text-lg">
                          {item.type === 'encrypt' ? 'Шифрование' :
                            item.type === 'decrypt' ? 'Расшифровка' :
                              item.type === 'sign' ? 'Подпись' : 'Проверка'}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          Алгоритм: {item.algorithm}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <br />
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Входные данные:</p>
                      <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl">
                        <p className="text-sm text-[var(--text-secondary)] font-mono break-all">
                          {item.input.length > 150 ? item.input.substring(0, 150) + '...' : item.input}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Результат:</p>
                      <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl">
                        <p className="text-sm text-[var(--text-secondary)] font-mono break-all">
                          {item.output.length > 150 ? item.output.substring(0, 150) + '...' : item.output}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('HistoryPanel component error:', error);
    return null;
  }
}

export default HistoryPanel
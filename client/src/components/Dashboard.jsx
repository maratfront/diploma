import React from 'react'
import { getEncryptionHistory } from '../utils/storage.js'
import { OPERATION_LABELS, OPERATION_ICONS, ALGORITHM_INFO } from '../utils/constants.js'

function Dashboard() {
  try {
    const [stats, setStats] = React.useState({
      totalOperations: 0,
      encryptedFiles: 0,
      algorithms: Object.keys(ALGORITHM_INFO).length,
      successRate: 98.5
    });
    const [recentHistory, setRecentHistory] = React.useState([]);

    React.useEffect(() => {
      let isMounted = true;

      const loadHistory = async () => {
        const history = await getEncryptionHistory();
        if (!isMounted) return;

        setStats({
          totalOperations: history.length,
          encryptedFiles: history.filter(item => item.type === 'encrypt').length,
          algorithms: Object.keys(ALGORITHM_INFO).length,
          successRate: 98.5
        });

        setRecentHistory(history.slice(0, 12));
      };

      loadHistory();

      return () => {
        isMounted = false;
      };
    }, []);

    const algorithmIcons = {
      'aes-gcm': 'shield',
      'chacha20': 'zap',
      'blowfish': 'lock',
      'twofish': 'shield-check',
      'caesar': 'rotate-cw',
      'base64': 'code',
      'sha256': 'hash',
      'argon2': 'key',
      'ecc': 'circle',
      'rsa': 'key'
    };

    const allAlgorithms = Object.entries(ALGORITHM_INFO).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.description,
      security: value.security,
      icon: algorithmIcons[key] || 'cpu'
    }));

    const statCards = [
      {
        title: 'Всего операций',
        value: stats.totalOperations,
        icon: 'activity',
        gradient: 'from-blue-500 to-blue-600',
        change: '+12%'
      },
      {
        title: 'Операций шифрования',
        value: stats.encryptedFiles,
        icon: 'shield-check',
        gradient: 'from-green-500 to-green-600',
        change: '+8%'
      },
      {
        title: 'Доступно алгоритмов',
        value: stats.algorithms,
        icon: 'cpu',
        gradient: 'from-purple-500 to-purple-600',
        change: 'Стабильно'
      },
      {
        title: 'Успешность операций',
        value: `${stats.successRate}%`,
        icon: 'trending-up',
        gradient: 'from-orange-500 to-orange-600',
        change: '+2.1%'
      }
    ];

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="dashboard">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Панель управления</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Комплексный обзор системы криптографической защиты данных
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <div className={`icon-${stat.icon} text-xl sm:text-2xl text-white`}></div>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">{stat.title}</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">Криптографические алгоритмы</h3>
                <span className="text-sm text-[var(--text-secondary)]">{allAlgorithms.length} доступных</span>
              </div>
              <div className="space-y-4 pr-2">
                {allAlgorithms.map((algorithm, index) => (
                  <div key={algorithm.id} className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500`}>
                        <div className={`icon-${algorithm.icon} text-xl text-white`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="font-semibold text-[var(--text-primary)]">{algorithm.name}</p>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{algorithm.description}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-[var(--accent-color)] text-white text-sm font-medium rounded-full">
                      Активен
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-compact p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3 sm:mb-4">Последние операции</h3>
            <div className="space-y-3">
              {recentHistory.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  История операций пока пуста. Выполните любую операцию шифрования, расшифровки или подписи.
                </p>
              ) : (
                recentHistory.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'encrypt' || item.type === 'sign' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <div className={`icon-${OPERATION_ICONS[item.type] || 'lock-open'} text-lg ${item.type === 'encrypt' || item.type === 'sign' ? 'text-green-600' : 'text-blue-600'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                        {OPERATION_LABELS[item.type] || item.type}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{item.algorithm}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {item.input?.substring(0, 40)}...
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard component error:', error);
    return null;
  }
}

export default Dashboard;

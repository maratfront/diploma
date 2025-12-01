import React from 'react'
import { fetchAlgorithms } from '../utils/api.js'

function adaptAlgorithmsFromApi(data) {
  if (!Array.isArray(data)) return null;

  const adapted = {};

  data.forEach((item, index) => {
    if (!item || !item.name) {
      return;
    }

    const key = item.id != null ? String(item.id) : `algo_${index}`;

    adapted[key] = {
      name: item.name,
      security: Number(item.security ?? 0),
      speed: Number(item.speed ?? 0),
      keySize: Number(item.key_size ?? 0),
      type: item.type || '',
      year: Number(item.year ?? 0),
      explanation: item.explanation || '',
      useCase: item.use_case || ''
    };
  });

  return Object.keys(adapted).length ? adapted : null;
}

function AlgorithmComparison() {
  try {
    const [algorithms, setAlgorithms] = React.useState();
    const [selectedAlgorithms, setSelectedAlgorithms] = React.useState(['aes', 'chacha20']);
    const [comparisonType, setComparisonType] = React.useState('security');

    React.useEffect(() => {
      async function loadAlgorithms() {
        try {
          const data = await fetchAlgorithms();
          const adapted = adaptAlgorithmsFromApi(data);
          if (!adapted) {
            return;
          }

          setAlgorithms(adapted);

          setSelectedAlgorithms((prev) => {
            const validPrev = prev.filter((id) => adapted[id]);
            if (validPrev.length > 0) {
              return validPrev;
            }
            const keys = Object.keys(adapted);
            if (keys.length === 0) return [];
            return keys.slice(0, Math.max(2, prev.length || 2));
          });
        } catch (error) {
          console.error('Error loading algorithm comparison data:', error);
        }
      }

      loadAlgorithms();
    }, []);

    const toggleAlgorithm = (algoId) => {
      if (!algorithms || !algorithms[algoId]) return;
      setSelectedAlgorithms(prev =>
        prev.includes(algoId)
          ? prev.filter(id => id !== algoId)
          : [...prev, algoId]
      );
    };

    const getColorByValue = (value) => {
      if (value >= 90) return 'text-green-600 bg-green-100';
      if (value >= 70) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    };

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="algorithm-comparison" data-file="components/AlgorithmComparison.jsx">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Сравнение алгоритмов шифрования</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Детальный анализ характеристик современных криптографических алгоритмов
          </p>
        </div>

        <div className="card p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 lg:mb-6">Выбор алгоритмов для сравнения</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            {algorithms && Object.entries(algorithms).map(([id, algo]) => (
              <button
                key={id}
                onClick={() => toggleAlgorithm(id)}
                className={`p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 text-center transform hover:scale-105 ${selectedAlgorithms.includes(id)
                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-10 ring-2 ring-[var(--primary-color)] ring-opacity-30'
                  : 'border-[var(--border-color)] hover:border-[var(--primary-color)]'
                  }`}
              >
                <h4 className="font-semibold text-[var(--text-primary)] text-xs sm:text-sm lg:text-base">{algo.name}</h4>
                <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] mt-0.5 sm:mt-1 line-clamp-1">{algo.type}</p>
              </button>
            )) || (
                <div className="col-span-full text-center py-4">
                  <p className="text-[var(--text-secondary)]">Загрузка алгоритмов...</p>
                </div>
              )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="xl:hidden">
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-3">Тип сравнения</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
              {[
                { id: 'security', label: 'Безопасность', icon: 'shield', shortLabel: 'Безопасность' },
                { id: 'speed', label: 'Скорость', icon: 'zap', shortLabel: 'Скорость' },
                { id: 'keySize', label: 'Размер ключа', icon: 'key', shortLabel: 'Ключ' },
                { id: 'year', label: 'Год создания', icon: 'calendar', shortLabel: 'Год' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setComparisonType(type.id)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all ${comparisonType === type.id
                    ? 'bg-[var(--primary-color)] text-white shadow-md'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                  <div className={`icon-${type.icon} text-base sm:text-lg`}></div>
                  <span className="font-medium text-xs sm:text-sm whitespace-nowrap">{type.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden xl:block card-compact p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3 sm:mb-4">Тип сравнения</h3>
            <div className="space-y-2">
              {[
                { id: 'security', label: 'Безопасность', icon: 'shield' },
                { id: 'speed', label: 'Скорость', icon: 'zap' },
                { id: 'keySize', label: 'Размер ключа', icon: 'key' },
                { id: 'year', label: 'Год создания', icon: 'calendar' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setComparisonType(type.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${comparisonType === type.id
                    ? 'bg-[var(--primary-color)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                >
                  <div className={`icon-${type.icon} text-lg`}></div>
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 lg:mb-6">
                Сравнение по: {comparisonType === 'security' ? 'Безопасности' :
                  comparisonType === 'speed' ? 'Скорости' :
                    comparisonType === 'keySize' ? 'Размеру ключа' : 'Году создания'}
              </h3>

              {selectedAlgorithms.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--bg-tertiary)] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <div className="icon-info text-2xl sm:text-3xl text-[var(--text-secondary)]"></div>
                  </div>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)]">Выберите алгоритмы для сравнения</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {algorithms && selectedAlgorithms.filter(algoId => algorithms[algoId]).map(algoId => {
                    const algo = algorithms[algoId];
                    if (!algo) return null;
                    const value = algo[comparisonType];
                    const maxValue = Math.max(...selectedAlgorithms.filter(id => algorithms[id]).map(id => algorithms[id][comparisonType]));
                    const percentage = comparisonType === 'year' ? 100 : (value / maxValue) * 100;

                    return (
                      <div key={algoId} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--text-primary)] text-sm sm:text-base truncate">{algo.name}</span>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex-shrink-0 ${comparisonType === 'year' ? 'bg-blue-100 text-blue-700' : getColorByValue(value)
                            }`}>
                            {value}{comparisonType === 'keySize' ? ' бит' : comparisonType === 'year' ? '' : '%'}
                          </span>
                        </div>
                        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 sm:h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--accent-color)] h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${percentage}%`,
                              animation: 'slideIn 1s ease-out'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="card p-4 sm:p-6 lg:p-8">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 lg:mb-6">Детальная таблица сравнения</h3>

            <div className="block md:hidden space-y-3">
              {algorithms && selectedAlgorithms.filter(algoId => algorithms[algoId]).map(algoId => {
                const algo = algorithms[algoId];
                if (!algo) return null;
                return (
                  <div key={algoId} className="border border-[var(--border-color)] rounded-xl p-3 sm:p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-[var(--text-primary)] text-sm">{algo.name}</h4>
                      <span className="text-xs text-[var(--text-secondary)]">{algo.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--text-muted)]">Безопасность: </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getColorByValue(algo.security)}`}>
                          {algo.security}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Скорость: </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getColorByValue(algo.speed)}`}>
                          {algo.speed}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Ключ: </span>
                        <span className="text-[var(--text-secondary)]">{algo.keySize || 'N/A'} бит</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Год: </span>
                        <span className="text-[var(--text-secondary)]">{algo.year}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left p-3 sm:p-4 font-semibold text-[var(--text-primary)] text-sm sm:text-base">Алгоритм</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-[var(--text-primary)] text-sm sm:text-base">Тип</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-[var(--text-primary)] text-sm sm:text-base">Безопасность</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-[var(--text-primary)] text-sm sm:text-base">Скорость</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-[var(--text-primary)] text-sm sm:text-base">Размер ключа</th>
                    <th className="text-left p-3 sm:p-4 font-semibold text-[var(--text-primary)] text-sm sm:text-base">Год</th>
                  </tr>
                </thead>
                <tbody>
                  {algorithms && selectedAlgorithms.filter(algoId => algorithms[algoId]).map(algoId => {
                    const algo = algorithms[algoId];
                    if (!algo) return null;
                    return (
                      <tr key={algoId} className="border-b border-[var(--border-light)]">
                        <td className="p-3 sm:p-4 font-medium text-[var(--text-primary)] text-sm sm:text-base">{algo.name}</td>
                        <td className="p-3 sm:p-4 text-[var(--text-secondary)] text-sm sm:text-base">{algo.type}</td>
                        <td className="p-3 sm:p-4">
                          <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${getColorByValue(algo.security)}`}>
                            {algo.security}%
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${getColorByValue(algo.speed)}`}>
                            {algo.speed}%
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-[var(--text-secondary)] text-sm sm:text-base">{algo.keySize || 'N/A'} бит</td>
                        <td className="p-3 sm:p-4 text-[var(--text-secondary)] text-sm sm:text-base">{algo.year}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedAlgorithms.length > 0 && (
            <div className="card p-4 sm:p-6 lg:p-8">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 lg:mb-6">Подробное описание выбранных алгоритмов</h3>
              <div className="space-y-4 sm:space-y-6">
                {algorithms && selectedAlgorithms.filter(algoId => algorithms[algoId]).map(algoId => {
                  const algo = algorithms[algoId];
                  if (!algo) return null;
                  return (
                    <div key={algoId} className="border border-[var(--border-color)] rounded-xl p-4 sm:p-6">
                      <h4 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 sm:mb-3">{algo.name}</h4>
                      <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-3 sm:mb-4 leading-relaxed">{algo.explanation}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <h5 className="font-semibold text-[var(--text-primary)] mb-1.5 sm:mb-2 text-sm sm:text-base">Применение:</h5>
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{algo.useCase}</p>
                        </div>
                        <div className="text-xs sm:text-sm text-[var(--text-secondary)] space-y-1">
                          <p><strong className="text-[var(--text-primary)]">Тип:</strong> {algo.type}</p>
                          <p><strong className="text-[var(--text-primary)]">Год создания:</strong> {algo.year}</p>
                          {algo.keySize > 0 && <p><strong className="text-[var(--text-primary)]">Размер ключа:</strong> {algo.keySize} бит</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('AlgorithmComparison component error:', error);
    return null;
  }
}

export default AlgorithmComparison

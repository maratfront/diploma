import React from 'react'

const API_BASE = 'http://127.0.0.1:8000/api/security';

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
      async function fetchAlgorithms() {
        try {
          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_BASE}/algorithm-comparison/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });

          if (!res.ok) {
            console.error('Failed to load algorithm comparison data from server', res.status);
            return;
          }

          const data = await res.json();
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

      fetchAlgorithms();
    }, []);

    const toggleAlgorithm = (algoId) => {
      if (!algorithms[algoId]) return;
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
      <div className="space-y-8 max-w-7xl mx-auto" data-name="algorithm-comparison" data-file="components/AlgorithmComparison.jsx">
        <div className="section-header">
          <h2 className="section-title">Сравнение алгоритмов шифрования</h2>
          <p className="section-subtitle">
            Детальный анализ характеристик современных криптографических алгоритмов
          </p>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Выбор алгоритмов для сравнения</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(algorithms).map(([id, algo]) => (
              <button
                key={id}
                onClick={() => toggleAlgorithm(id)}
                className={`p-4 rounded-xl border transition-all duration-300 text-center transform hover:scale-105 ${selectedAlgorithms.includes(id)
                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-10'
                  : 'border-[var(--border-color)] hover:border-[var(--primary-color)]'
                  }`}
              >
                <h4 className="font-semibold text-[var(--text-primary)]">{algo.name}</h4>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{algo.type}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="card-compact">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Тип сравнения</h3>
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
            <div className="card">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                Сравнение по: {comparisonType === 'security' ? 'Безопасности' :
                  comparisonType === 'speed' ? 'Скорости' :
                    comparisonType === 'keySize' ? 'Размеру ключа' : 'Году создания'}
              </h3>

              <div className="space-y-4">
                {selectedAlgorithms.filter(algoId => algorithms[algoId]).map(algoId => {
                  const algo = algorithms[algoId];
                  if (!algo) return null;
                  const value = algo[comparisonType];
                  const maxValue = Math.max(...selectedAlgorithms.filter(id => algorithms[id]).map(id => algorithms[id][comparisonType]));
                  const percentage = comparisonType === 'year' ? 100 : (value / maxValue) * 100;

                  return (
                    <div key={algoId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)]">{algo.name}</span>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium transition-all duration-300 ${comparisonType === 'year' ? 'bg-blue-100 text-blue-700' : getColorByValue(value)
                          }`}>
                          {value}{comparisonType === 'keySize' ? ' бит' : comparisonType === 'year' ? '' : '%'}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--accent-color)] h-3 rounded-full transition-all duration-1000 ease-out transform hover:scale-105"
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
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Детальная таблица сравнения</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left p-4 font-semibold text-[var(--text-primary)]">Алгоритм</th>
                    <th className="text-left p-4 font-semibold text-[var(--text-primary)]">Тип</th>
                    <th className="text-left p-4 font-semibold text-[var(--text-primary)]">Безопасность</th>
                    <th className="text-left p-4 font-semibold text-[var(--text-primary)]">Скорость</th>
                    <th className="text-left p-4 font-semibold text-[var(--text-primary)]">Размер ключа</th>
                    <th className="text-left p-4 font-semibold text-[var(--text-primary)]">Год</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAlgorithms.filter(algoId => algorithms[algoId]).map(algoId => {
                    const algo = algorithms[algoId];
                    if (!algo) return null;
                    return (
                      <tr key={algoId} className="border-b border-[var(--border-light)]">
                        <td className="p-4 font-medium text-[var(--text-primary)]">{algo.name}</td>
                        <td className="p-4 text-[var(--text-secondary)]">{algo.type}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getColorByValue(algo.security)}`}>
                            {algo.security}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getColorByValue(algo.speed)}`}>
                            {algo.speed}%
                          </span>
                        </td>
                        <td className="p-4 text-[var(--text-secondary)]">{algo.keySize || 'N/A'} бит</td>
                        <td className="p-4 text-[var(--text-secondary)]">{algo.year}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedAlgorithms.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Подробное описание выбранных алгоритмов</h3>
              <div className="space-y-6">
                {selectedAlgorithms.filter(algoId => algorithms[algoId]).map(algoId => {
                  const algo = algorithms[algoId];
                  if (!algo) return null;
                  return (
                    <div key={algoId} className="border border-[var(--border-color)] rounded-xl p-6">
                      <h4 className="text-lg font-bold text-[var(--text-primary)] mb-3">{algo.name}</h4>
                      <p className="text-[var(--text-secondary)] mb-4">{algo.explanation}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-semibold text-[var(--text-primary)] mb-2">Применение:</h5>
                          <p className="text-sm text-[var(--text-secondary)]">{algo.useCase}</p>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          <p><strong>Тип:</strong> {algo.type}</p>
                          <p><strong>Год создания:</strong> {algo.year}</p>
                          {algo.keySize > 0 && <p><strong>Размер ключа:</strong> {algo.keySize} бит</p>}
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
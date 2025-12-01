import React from 'react'

const API_BASE = 'http://127.0.0.1:8000/api/security';

function CryptoInfo() {
  try {
    const [selectedCategory, setSelectedCategory] = React.useState('symmetric');
    const [selectedAlgorithm, setSelectedAlgorithm] = React.useState(null);

    const [cryptoCategories, setCryptoCategories] = React.useState();

    const [algorithms, setAlgorithms] = React.useState();

    React.useEffect(() => {
      async function loadCryptoInfo() {
        try {
          const token = localStorage.getItem('accessToken');

          const [catRes, algoRes] = await Promise.all([
            fetch(`${API_BASE}/crypto-categories/`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            }),
            fetch(`${API_BASE}/crypto-algorithms/`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            }),
          ]);

          if (catRes.ok) {
            const catData = await catRes.json();
            if (Array.isArray(catData)) {
              const cats = {};
              catData.forEach(c => {
                if (!c || !c.key) return;
                cats[c.key] = {
                  title: c.title,
                  description: c.description,
                  icon: c.icon,
                  color: c.color,
                };
              });
              if (Object.keys(cats).length > 0) {
                setCryptoCategories(prev => ({ ...prev, ...cats }));
              }
            }
          }

          if (algoRes.ok) {
            const algoData = await algoRes.json();
            if (Array.isArray(algoData)) {
              const byCategory = {};
              algoData.forEach(a => {
                const key = a.category_key;
                if (!key) return;
                if (!byCategory[key]) byCategory[key] = [];
                byCategory[key].push({
                  name: a.name,
                  keySize: a.key_size,
                  security: a.security,
                  speed: a.speed,
                  description: a.description,
                  technicalDetails: a.technical_details,
                  vulnerabilities: a.vulnerabilities,
                  simpleExplanation: a.simple_explanation,
                  realWorldExample: a.real_world_example,
                  applications: a.applications || [],
                  advantages: a.advantages || [],
                  disadvantages: a.disadvantages || [],
                });
              });

              setAlgorithms(prev => ({
                ...prev,
                ...byCategory,
              }));
            }
          }
        } catch (e) {
          console.error('Error loading crypto info from server:', e);
        }
      }

      loadCryptoInfo();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="crypto-info" data-file="components/CryptoInfo.jsx">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">База знаний по криптографии</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Полное руководство по алгоритмам шифрования, их характеристикам и областям применения
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {cryptoCategories && Object.entries(cryptoCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                setSelectedAlgorithm(null);
              }}
              className={`card-compact text-left transition-all duration-300 transform hover:scale-105 ${selectedCategory === key
                ? 'ring-2 ring-[var(--primary-color)] bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] text-white'
                : 'hover:shadow-xl'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${selectedCategory === key
                ? 'bg-white bg-opacity-20'
                : `bg-gradient-to-br ${category.color}`
                }`}>
                <div className={`icon-${category.icon} text-xl ${selectedCategory === key ? 'text-white' : 'text-white'
                  }`}></div>
              </div>
              <h3 className="font-bold mb-2">{category.title}</h3>
              <p className={`text-sm ${selectedCategory === key ? 'text-white text-opacity-90' : 'text-[var(--text-secondary)]'
                }`}>
                {category.description}
              </p>
            </button>
          )) || (
            <div className="col-span-full text-center py-4">
              <p className="text-[var(--text-secondary)]">Загрузка категорий...</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2">
            <div className="card p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">
                {cryptoCategories?.[selectedCategory]?.title || 'Загрузка...'}
              </h3>
              <div className="grid gap-4">
                {algorithms && algorithms[selectedCategory] && algorithms[selectedCategory].map((algo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAlgorithm(algo)}
                    className={`p-4 rounded-xl border transition-all duration-300 text-left transform hover:scale-105 ${selectedAlgorithm?.name === algo.name
                      ? 'border-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-5'
                      : 'border-[var(--border-color)] hover:border-[var(--primary-color)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[var(--text-primary)]">{algo.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${algo.security === 'Очень высокая' ? 'bg-green-100 text-green-700' :
                        algo.security === 'Высокая' ? 'bg-blue-100 text-blue-700' :
                          algo.security === 'Средняя' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                        {algo.security}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">{algo.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-[var(--text-muted)]">
                      <span>Ключ: {algo.keySize}</span>
                      <span>Скорость: {algo.speed}</span>
                    </div>
                  </button>
                )) || (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)]">
                      {algorithms ? 'Алгоритмы не найдены' : 'Загрузка алгоритмов...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {selectedAlgorithm ? (
              <>
                <div className="card-compact p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-3 sm:mb-4">
                    {selectedAlgorithm.name}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Размер ключа:</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedAlgorithm.keySize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Безопасность:</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedAlgorithm.security}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-[var(--text-secondary)]">Скорость:</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{selectedAlgorithm.speed}</span>
                    </div>
                  </div>
                </div>

                <div className="card-compact">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">Применение</h4>
                  <div className="space-y-2">
                    {selectedAlgorithm.applications.map((app, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full"></div>
                        <span className="text-sm text-[var(--text-secondary)]">{app}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-compact">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">Преимущества</h4>
                  <div className="space-y-2">
                    {selectedAlgorithm.advantages.map((adv, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="icon-check text-green-600 text-sm"></div>
                        <span className="text-sm text-[var(--text-secondary)]">{adv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-compact">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">Недостатки</h4>
                  <div className="space-y-2">
                    {selectedAlgorithm.disadvantages.map((dis, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="icon-x text-red-600 text-sm"></div>
                        <span className="text-sm text-[var(--text-secondary)]">{dis}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="card-compact text-center py-8">
                <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="icon-info text-2xl text-[var(--text-secondary)]"></div>
                </div>
                <p className="text-[var(--text-secondary)]">
                  Выберите алгоритм для просмотра подробной информации
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('CryptoInfo component error:', error);
    return null;
  }
}

export default CryptoInfo
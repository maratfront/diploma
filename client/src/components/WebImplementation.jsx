import React from 'react'

const API_BASE = 'http://127.0.0.1:8000/api/security';

function AnimatedCopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn-secondary transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 ${copied ? 'bg-green-500 text-white scale-110' : ''
        }`}
    >
      <div className={`${copied ? 'icon-check' : 'icon-copy'} text-base sm:text-lg mr-1.5 sm:mr-2 transition-all duration-300`}></div>
      <span className="hidden sm:inline">{copied ? 'Скопировано!' : 'Копировать код'}</span>
      <span className="sm:hidden">{copied ? 'Скопировано!' : 'Копировать'}</span>
    </button>
  );
}

function WebImplementation() {
  try {
    const [selectedExample, setSelectedExample] = React.useState('jwt');
    const [examples, setExamples] = React.useState();

    React.useEffect(() => {
      async function loadExamples() {
        try {
          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_BASE}/web-implementations/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });

          if (!res.ok) {
            console.error('Failed to load web implementations from server', res.status);
            return;
          }

          const data = await res.json();
          if (!Array.isArray(data)) return;

          const fromApi = {};
          data.forEach(item => {
            if (!item || !item.key) return;
            fromApi[item.key] = {
              title: item.title,
              description: item.description,
              code: item.code,
            };
          });

          if (Object.keys(fromApi).length === 0) return;

          setExamples(prev => ({ ...prev, ...fromApi }));

          if (!fromApi[selectedExample] && Object.keys(fromApi).length > 0) {
            const firstKey = Object.keys(fromApi)[0];
            setSelectedExample(firstKey);
          }
        } catch (e) {
          console.error('Error loading web implementations:', e);
        }
      }

      loadExamples();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" data-name="web-implementation" data-file="components/WebImplementation.jsx">
        <div className="section-header">
          <h2 className="section-title text-2xl sm:text-3xl lg:text-4xl">Веб-реализация криптографии</h2>
          <p className="section-subtitle text-base sm:text-lg">
            Практические примеры реализации криптографических методов в современных веб-приложениях
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {examples && Object.entries(examples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setSelectedExample(key)}
              className={`card-compact p-4 sm:p-6 text-left transition-all duration-300 transform hover:scale-105 ${selectedExample === key
                ? 'ring-2 ring-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-5 shadow-lg'
                : 'hover:shadow-xl'
                }`}
            >
              <h3 className="font-bold text-[var(--text-primary)] mb-1.5 sm:mb-2 text-sm sm:text-base">{example.title}</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">{example.description}</p>
            </button>
          )) || (
            <div className="col-span-full text-center py-4">
              <p className="text-[var(--text-secondary)]">Загрузка примеров...</p>
            </div>
          )}
        </div>

        <div className="card p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-3 sm:gap-4">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-primary)]">
              {examples && examples[selectedExample]?.title || 'Загрузка...'}
            </h3>
            {examples && examples[selectedExample] && (
              <AnimatedCopyButton text={examples[selectedExample].code} />
            )}
          </div>

          {examples && examples[selectedExample] && (
            <>
              <p className="text-xs sm:text-sm lg:text-base text-[var(--text-secondary)] mb-3 sm:mb-4 lg:mb-6 leading-relaxed">
                {examples[selectedExample].description}
              </p>

              <div className="relative">
                <div className="bg-gray-900 rounded-xl p-3 sm:p-4 lg:p-6 overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-0">
                    <pre className="text-green-400 text-[10px] sm:text-xs lg:text-sm font-mono whitespace-pre-wrap break-words overflow-x-auto">
                      {examples[selectedExample].code}
                    </pre>
                  </div>
                </div>
                {/* Индикатор прокрутки для мобильных */}
                <div className="sm:hidden absolute bottom-2 right-2 bg-gray-800 bg-opacity-75 text-gray-400 text-[10px] px-2 py-1 rounded">
                  Прокрутите для просмотра
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('WebImplementation component error:', error);
    return null;
  }
}

export default WebImplementation

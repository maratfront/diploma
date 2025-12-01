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
      className={`btn-secondary transition-all duration-300 transform hover:scale-105 ${copied ? 'bg-green-500 text-white scale-110' : ''
        }`}
    >
      <div className={`${copied ? 'icon-check' : 'icon-copy'} text-lg mr-2 transition-all duration-300`}></div>
      {copied ? 'Скопировано!' : 'Копировать код'}
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
      <div className="space-y-8 max-w-7xl mx-auto" data-name="web-implementation" data-file="components/WebImplementation.jsx">
        <div className="section-header">
          <h2 className="section-title">Веб-реализация криптографии</h2>
          <p className="section-subtitle">
            Практические примеры реализации криптографических методов в современных веб-приложениях
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {Object.entries(examples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setSelectedExample(key)}
              className={`card-compact text-left transition-all duration-300 transform hover:scale-105 ${selectedExample === key
                ? 'ring-2 ring-[var(--primary-color)] bg-[var(--primary-color)] bg-opacity-5'
                : 'hover:shadow-xl'
                }`}
            >
              <h3 className="font-bold text-[var(--text-primary)] mb-2">{example.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{example.description}</p>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              {examples[selectedExample].title}
            </h3>
            <AnimatedCopyButton text={examples[selectedExample].code} />
          </div>

          <p className="text-[var(--text-secondary)] mb-6">{examples[selectedExample].description}</p>

          <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
              {examples[selectedExample].code}
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('WebImplementation component error:', error);
    return null;
  }
}

export default WebImplementation

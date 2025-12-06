function Footer() {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { label: 'Главная', href: '/' },
    { label: 'Текстовое шифрование', href: '/#encryption' },
    { label: 'Шифрование файлов', href: '/#file-encryption' },
    { label: 'Электронные подписи', href: '/#digital-signatures' },
    { label: 'Хэширование', href: '/#hashing' },
    { label: 'ECC криптография', href: '/#ecc' },
    { label: 'Сравнение алгоритмов', href: '/#comparison' },
    { label: 'Веб-реализация', href: '/#web-implementation' },
    { label: 'База знаний', href: '/#crypto-info' },
    { label: 'История операций', href: '/#history' },
    { label: 'Личный кабинет', href: '/#profile' }
  ];

  const cryptoAlgorithms = [
    'AES-256 (Rijndael)',
    'RSA (2048-4096 bit)',
    'Blowfish',
    'SHA-256',
    'Twofish',
    'Argon2',
    'ChaCha20',
    'Caesar Cipher',
    'Base64',
    'ECC'
  ];

  const techStack = [
    'React',
    'Tailwind CSS',
    'Post CSS',
    'Lucide',
    'Vite',
    'Django',
    'Django REST Framework',
    'SQLite',
    'PyCryptodome'
  ];

  return (
    <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] py-8 sm:py-12 mt-12 sm:mt-16" data-name="footer" data-file="components/Footer.jsx">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Основные секции */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* О проекте */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-xl flex items-center justify-center shadow-lg">
                <div className="icon-shield text-xl text-white"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">CryptoSecure</h3>
                <p className="text-sm text-[var(--text-secondary)]">Криптографическая система</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Учебная платформа с открытым исходным кодом, моделирующая систему криптографической защиты данных. Позволяет изучать принципы безопасной передачи и хранения конфиденциальной информации.
            </p>
          </div>

          {/* Навигация и ресурсы */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                <div className="icon-navigation text-[var(--primary-color)] mr-2"></div>
                Навигация
              </h4>
              <ul className="space-y-2">
                {navLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)] 
                               transition-colors duration-200 flex items-center group"
                    >
                      <div className="icon-arrow-right text-xs mr-2 opacity-0 group-hover:opacity-100 
                                   text-[var(--primary-color)] transition-opacity"></div>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                <div className="icon-lock text-[var(--success-color)] mr-2"></div>
                Алгоритмы шифрования
              </h4>
              <ul className="space-y-0">
                {cryptoAlgorithms.map((algorithm, index) => {
                  let iconClass = "icon-lock";

                  if (algorithm.includes('AES') || algorithm.includes('Rijndael')) {
                    iconClass = "icon-shield";
                  } else if (algorithm.includes('RSA') || algorithm.includes('ECC')) {
                    iconClass = "icon-key";
                  } else if (algorithm.includes('SHA') || algorithm.includes('Argon2')) {
                    iconClass = "icon-hash";
                  } else if (algorithm.includes('Caesar') || algorithm.includes('Base64')) {
                    iconClass = "icon-code";
                  } else if (algorithm.includes('ChaCha') || algorithm.includes('Twofish') || algorithm.includes('Blowfish')) {
                    iconClass = "icon-cpu";
                  }

                  return (
                    <li key={index} className="flex items-start p-1 rounded-lg transition-colors duration-200">
                      <div className={`${iconClass} text-sm mr-3 mt-0.5 flex-shrink-0`}></div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                          {algorithm}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Стек технологий */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center">
                <div className="icon-cpu text-[var(--primary-color)] mr-2"></div>
                Технологический стек
              </h4>
              <ul className="space-y-3">
                {techStack.map((tech, index) => (
                  <li key={index} className="flex items-start">
                    <div className="icon-code text-sm text-[var(--primary-color)] mr-3 mt-0.5"></div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-secondary)] flex items-center">
                        {tech}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Разделитель */}
        <div className="border-t border-[var(--border-color)] my-6"></div>

        {/* Копирайт и нижняя информация */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-[var(--text-secondary)]">
              © {currentYear} CryptoSecure. Дипломный проект. Все права защищены.
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Разработано с <span className="text-red-500">❤</span> с использованием современного стека технологий
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>Система активна</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>Версия 1.0.0</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center md:text-right">
              Открытый исходный код • MIT License
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

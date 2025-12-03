function Footer() {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { label: 'Главная', href: '/' },
    { label: 'Текстовое шифрование', href: '/#encryption' },
    { label: 'Шифрование файлов', href: '/#file-encryption' },
    { label: 'Электронные подписи', href: '/#digital-signatures' },
    { label: 'Сравнение алгоритмов', href: '/#comparison' },
    { label: 'Веб-реализация', href: '/#web-implementation' },
    { label: 'База знаний', href: '/#crypto-info' },
    { label: 'История операций', href: '/#history' },
    { label: 'Личный кабинет', href: '/#profile' }
  ];

  const techStack = [
    'React 18',
    'Tailwind',
    'Node.js',
    'Vite',
    'Django 5',
    'SQLite'
  ];

  return (
    <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] py-8 sm:py-12 mt-12 sm:mt-16" data-name="footer" data-file="components/Footer.jsx">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-xl flex items-center justify-center shadow-lg">
                <div className="icon-shield text-base text-white"></div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">CryptoSecure</h3>
                <p className="text-sm text-[var(--text-secondary)]">Криптографическая система</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Продвинутая система криптографической защиты данных с открытым исходным кодом.
            </p>
            <div className="flex space-x-2">
              <span className="px-2 py-1 text-xs bg-[var(--primary-color)/10] text-[var(--primary-color)] rounded-md">
                Безопасность
              </span>
              <span className="px-2 py-1 text-xs bg-[var(--accent-color)/10] text-[var(--accent-color)] rounded-md">
                Open Source
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Навигация</h4>
            <ul className="space-y-2">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[var(--primary-color)] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Технологии</h4>
            <ul className="space-y-2">
              {techStack.map((tech, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full mr-3"></div>
                  <span className="text-sm text-[var(--text-secondary)]">{tech}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] my-6"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-[var(--text-secondary)]">
              © {currentYear} CryptoSecure. Дипломный проект.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
            <p className="text-[var(--text-muted)] mt-1">
              Все права защищены. Версия 1.0.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

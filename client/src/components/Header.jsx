import ThemeToggle from './ThemeToggle.jsx'

function Header({ user, theme, onToggleTheme, onLogout, onMenuToggle }) {
  try {
    return (
      <header className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 shadow-md sticky top-0 z-30" data-name="header" data-file="components/Header.jsx">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors mr-2"
              aria-label="Открыть меню"
            >
              <div className="icon-menu text-xl text-[var(--text-primary)]"></div>
            </button>

            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <div className="icon-shield text-lg sm:text-xl text-white"></div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold gradient-text">CryptoSecure</h1>
              <p className="text-xs text-[var(--text-secondary)] hidden sm:block">Система активна</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-6">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <div className="flex items-center space-x-2 sm:space-x-4 pl-2 sm:pl-4 border-l border-[var(--border-color)]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-light)] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <div className="icon-user text-lg sm:text-xl text-white"></div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.first_name || 'Пользователь'}</p>
                <p className="text-xs text-[var(--text-secondary)] hidden lg:block">{user?.email || ''}</p>
              </div>
              <button
                onClick={onLogout}
                className="btn-icon w-10 h-10 sm:w-12 sm:h-12"
                title="Выход"
              >
                <div className="icon-log-out text-lg"></div>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}

export default Header

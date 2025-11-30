import React from 'react'
import ThemeToggle from './ThemeToggle.jsx'

function Header({ user, theme, onToggleTheme, onLogout }) {
  try {
    return (
      <header className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-8 py-6 shadow-md" data-name="header" data-file="components/Header.jsx">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-2xl flex items-center justify-center shadow-lg">
              <div className="icon-shield text-xl text-white"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">CryptoSecure</h1>
              <p className="text-xs text-[var(--text-secondary)]">Система активна</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <div className="flex items-center space-x-4 pl-4 border-l border-[var(--border-color)]">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-light)] rounded-2xl flex items-center justify-center shadow-lg">
                <div className="icon-user text-xl text-white"></div>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{user.first_name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="btn-icon"
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

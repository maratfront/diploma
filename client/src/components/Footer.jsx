function Footer() {
  try {
    return (
      <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] py-4 sm:py-6 mt-8 sm:mt-12" data-name="footer" data-file="components/Footer.jsx">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-lg flex items-center justify-center">
                <div className="icon-shield text-sm text-white"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">CryptoSecure</p>
                <p className="text-xs text-[var(--text-secondary)]">Криптографическая система</p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <p className="text-sm text-[var(--text-secondary)]">
                © 2025 CryptoSecure. Дипломный проект.
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Все права защищены.
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  } catch (error) {
    console.error('Footer component error:', error);
    return null;
  }
}

export default Footer

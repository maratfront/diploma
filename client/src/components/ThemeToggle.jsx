function ThemeToggle({ theme, onToggle }) {
  try {
    return (
      <button
        onClick={onToggle}
        className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
        data-name="theme-toggle"
        data-file="components/ThemeToggle.jsx"
        title={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
      >
        <div className={`icon-${theme === 'light' ? 'moon' : 'sun'} text-xl`}></div>
      </button>
    );
  } catch (error) {
    console.error('ThemeToggle component error:', error);
    return null;
  }
}

export default ThemeToggle

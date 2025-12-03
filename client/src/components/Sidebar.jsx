import { MENU_ITEMS } from '../utils/constants.js'

function Sidebar({ currentView, onViewChange, isOpen, onClose }) {
  try {

    const handleItemClick = (id) => {
      onViewChange(id);
    };

    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed lg:static inset-y-0 left-0 w-80 bg-[var(--bg-primary)] border-r border-[var(--border-color)] min-h-screen shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          data-name="sidebar"
          data-file="components/Sidebar.jsx"
        >
          <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Навигация</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors"
                aria-label="Закрыть меню"
              >
                <div className="icon-x text-xl text-[var(--text-primary)]"></div>
              </button>
            </div>

            <div className="mb-8 hidden lg:block">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Навигация</h2>
              <p className="text-sm text-[var(--text-secondary)]">Выберите раздел для работы</p>
            </div>

            <nav>
              <ul className="space-y-2 sm:space-y-3">
                {MENU_ITEMS.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full nav-item transform transition-all duration-300 hover:scale-105 ${currentView === item.id ? 'nav-item-active animate-pulse-gentle' : 'nav-item-inactive'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentView === item.id
                        ? 'bg-white bg-opacity-20'
                        : 'bg-[var(--bg-tertiary)]'
                        }`}>
                        <div className={`icon-${item.icon} text-xl`}></div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{item.label}</div>
                        <div className={`text-xs ${currentView === item.id
                          ? 'text-white text-opacity-80'
                          : 'text-[var(--text-muted)]'
                          }`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-8 lg:mt-12 p-4 sm:p-6 bg-gradient-to-br from-[var(--primary-color)] to-[var(--accent-color)] rounded-xl lg:rounded-2xl text-white">
              <div className="flex items-center space-x-3 mb-3 lg:mb-4">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <div className="icon-info text-lg"></div>
                </div>
                <h3 className="font-semibold text-sm lg:text-base">Справка</h3>
              </div>
              <p className="text-xs lg:text-sm text-white text-opacity-90">
                Система поддерживает современные алгоритмы шифрования для обеспечения безопасности данных. Используйте разделы навигации для изучения различных методов криптографии.
              </p>
            </div>
          </div>
        </aside>
      </>
    );
  } catch (error) {
    console.error('Sidebar component error:', error);
    return null;
  }
}

export default Sidebar

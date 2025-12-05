import React from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import EncryptionPanel from './components/EncryptionPanel.jsx'
import FileEncryption from './components/FileEncryption.jsx'
import ECCPanel from './components/ECCPanel.jsx'
import HashingPanel from './components/HashingPanel.jsx'
import DigitalSignatures from './components/DigitalSignatures.jsx'
import AlgorithmComparison from './components/AlgorithmComparison.jsx'
import WebImplementation from './components/WebImplementation.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import CryptoInfo from './components/CryptoInfo.jsx'
import UserProfile from './components/UserProfile.jsx'
import Auth from './components/Auth.jsx'
import Footer from './components/Footer.jsx'
import { AuthService } from './utils/auth.js'
import { useTheme } from './hooks/useTheme.js'

function App() {
  try {
    const [currentView, setCurrentView] = React.useState(() => {
      const hash = window.location.hash.slice(1);
      return hash || 'dashboard';
    });
    const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
      return AuthService.isAuthenticated();
    });
    const [user, setUser] = React.useState(null);
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setSidebarOpen(false);
        }
      };

      if (sidebarOpen && window.innerWidth < 1024) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        document.body.style.overflow = '';
      };
    }, [sidebarOpen]);

    React.useEffect(() => {
      const loadUser = async () => {
        if (isAuthenticated) {
          try {
            const userData = await AuthService.getCurrentUser();
            setUser(userData);
          } catch (error) {
            console.error('Failed to fetch user data:', error);
          }
        }
      };

      loadUser();
    }, [isAuthenticated]);


    React.useEffect(() => {
      const handleHashChange = () => {
        const hash = window.location.hash.slice(1);
        if (hash) {
          setCurrentView(hash);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleViewChange = (view) => {
      setCurrentView(view);
      window.location.hash = view;
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };


    const handleLogin = (userData) => {
      if (userData) {
        setUser(userData);
      }
      setIsAuthenticated(true);
    };

    const handleLogout = () => {
      AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    };

    const handleUserUpdate = async (userData) => {
      try {
        const updatedUser = await AuthService.updateUser(userData);
        setUser(updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('Error updating user:', error);
        throw error;
      }
    };

    if (!isAuthenticated) {
      return <Auth onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
    }

    return (
      <div className="min-h-screen bg-[var(--bg-secondary)]" data-name="app" data-file="app.js">
        <Header
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex flex-col min-h-screen">
          <div className="flex flex-1 relative">
            <Sidebar
              currentView={currentView}
              onViewChange={handleViewChange}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-6">
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'encryption' && <EncryptionPanel />}
              {currentView === 'hashing' && <HashingPanel />}
              {currentView === 'ecc' && <ECCPanel />}
              {currentView === 'file-encryption' && <FileEncryption />}
              {currentView === 'digital-signatures' && <DigitalSignatures />}
              {currentView === 'comparison' && <AlgorithmComparison />}
              {currentView === 'web-implementation' && <WebImplementation />}
              {currentView === 'crypto-info' && <CryptoInfo />}
              {currentView === 'history' && <HistoryPanel />}
              {currentView === 'profile' && <UserProfile user={user} onUserUpdate={handleUserUpdate} />}
            </main>
          </div>
          <Footer />
        </div>
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

export default App

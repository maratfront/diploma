import React from 'react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import EncryptionPanel from './components/EncryptionPanel.jsx'
import FileEncryption from './components/FileEncryption.jsx'
import DigitalSignatures from './components/DigitalSignatures.jsx'
import AlgorithmComparison from './components/AlgorithmComparison.jsx'
import WebImplementation from './components/WebImplementation.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import CryptoInfo from './components/CryptoInfo.jsx'
import UserProfile from './components/UserProfile.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Auth from './components/Auth.jsx'
import Footer from './components/Footer.jsx'
import { AuthService } from './utils/auth.js'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-black"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    const [theme, setTheme] = React.useState(() => {
      return localStorage.getItem('theme') || 'light';
    });

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
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }, [theme]);

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
    };

    const toggleTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
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
        <Header user={user} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />

        <div className="flex flex-col min-h-screen">
          <div className="flex flex-1">
            <Sidebar currentView={currentView} onViewChange={handleViewChange} />

            <main className="flex-1 p-6">
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'encryption' && <EncryptionPanel />}
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

export { ErrorBoundary }
export default App
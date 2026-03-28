import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';  // Import api đã tạo ở Bước 1
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Import components
import Main from './components/layout/Main';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/Production/ProductManagement.jsx'
import InventoryManagement from './pages/Inventory/InventoryManagement';
import ProductionManagement from './pages/Production/ProductionManagement';
import SalesManagement from './pages/Orders/SalesManagement';
import PartnerManagement from './pages/Partners/PartnerManagement';
import UnitManagement from './pages/Inventory/UnitManagement';
import ReportDash from './pages/TK/TK';


import './styles/App.css';
import './styles/global.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
      }
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => console.log('Service Worker registered:', registration.scope))
        .catch((error) => console.log('Service Worker registration failed:', error));
    });
  });
}

function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/get_csrf_token/'); 
        
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Chưa đăng nhập");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout/'); 
    } catch (err) {
      console.error("Lỗi đăng xuất");
    }
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'PARTNERS':
        return <PartnerManagement setActiveTab={setActiveTab} />;
      case 'INVENTORY':
        return <InventoryManagement setActiveTab={setActiveTab} />;
      case 'PRODUCTION':
        return <ProductionManagement setActiveTab={setActiveTab} />;
      case 'SALES':
        return <SalesManagement setActiveTab={setActiveTab} />;
      case 'PRODUC':
        return <ProductManagement setActiveTab={setActiveTab} />;
      case 'TK':
        return <ReportDash setActiveTab={setActiveTab} />;
      case 'UNITS':
        return <UnitManagement setActiveTab={setActiveTab} />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/*"
              element={
                <Main 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  isAuthenticated={isAuthenticated} 
                  onLogout={handleLogout} 
                  user={user}
                >
                  {renderContent()}
                </Main>
              }
            />
          </>
          
        )}
      </Routes>
    </Router>
  );
}

export default App;
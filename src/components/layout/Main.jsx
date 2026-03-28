import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Main.css';

const Main = ({ children, activeTab, setActiveTab, isAuthenticated, onLogout, user, avatar }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // Dùng cho menu Danh mục ở Sidebar
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false); // Dùng riêng cho menu Avatar góc phải

  const getTitle = () => {
    switch (activeTab) {
      case 'DASHBOARD': return (<><i className="fas fa-chart-pie" style={{ marginRight: 8 }}></i> Bảng Điều Khiển</>);
      case 'SALES': return (<><i className="fas fa-coins" style={{ marginRight: 8 }}></i> Quản Lý Đơn Hàng</>);
      case 'INVENTORY': return (<><i className="fas fa-boxes" style={{ marginRight: 8 }}></i> Quản Lý Kho Hàng</>);
      case 'PRODUCTION': return (<><i className="fas fa-industry" style={{ marginRight: 8 }}></i> Quản Lý Sản Xuất</>);
      case 'PRODUC': return (<><i className="fas fa-industry" style={{ marginRight: 8 }}></i> Sản phẩm</>);
      case 'PARTNERS': return (<><i className="fas fa-users" style={{ marginRight: 8 }}></i> Quản Lý Đối Tác</>);
      case 'UNITS': return (<><i className="fas fa-ruler" style={{ marginRight: 8 }}></i> Quản Lý Đơn Vị Tính</>);
      case 'TK': return (<><i className="fas fa-industry" style={{ marginRight: 8 }}></i> Báo cáo tổng hợp</>);
      default: return 'Xưởng Sản Xuất Gỗ';
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar Desktop */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>

      <div className="sidebar-header">
        <h2>
          <Link 
            to="/dashboard" 
            style={{ textDecoration: 'none', color: 'inherit' }}
            onClick={() => handleNavClick('DASHBOARD')}
          >
            <i className="fas fa-industry" style={{ marginRight: 8 }}></i> Xưởng Gỗ
          </Link>
        </h2>
        <button 
          className="sidebar-close" 
          onClick={() => setMobileSidebarOpen(false)}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
            onClick={() => handleNavClick('DASHBOARD')}
          >
            <i className="fas fa-chart-pie" style={{ marginRight: 8 }}></i> Bảng Điều Khiển
          </button>
          <button 
            className={`nav-btn ${activeTab === 'SALES' ? 'active' : ''}`}
            onClick={() => handleNavClick('SALES')}
          >
            <i className="fas fa-coins" style={{ marginRight: 8 }}></i> Đơn Hàng
          </button>
          <button 
            className={`nav-btn ${activeTab === 'PRODUCTION' ? 'active' : ''}`}
            onClick={() => handleNavClick('PRODUCTION')}
          >
            <i className="fas fa-industry" style={{ marginRight: 8 }}></i> Sản Xuất
          </button>
          <button 
            className={`nav-btn ${activeTab === 'INVENTORY' ? 'active' : ''}`}
            onClick={() => handleNavClick('INVENTORY')}
          >
            <i className="fas fa-boxes" style={{ marginRight: 8 }}></i> Kho Hàng
          </button>
          <div className="dropdown">
            <button 
              className={`nav-btn ${['PARTNERS','UNITS','PRODUC'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <i className="fas fa-list" style={{ marginRight: 8 }}></i> Danh mục
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <button 
                  className={`nav-btn ${activeTab === 'PARTNERS' ? 'active' : ''}`}
                  onClick={() => handleNavClick('PARTNERS')}
                >
                  <i className="fas fa-users" style={{ marginRight: 8 }}></i> Đối Tác
                </button>

                <button 
                  className={`nav-btn ${activeTab === 'UNITS' ? 'active' : ''}`}
                  onClick={() => handleNavClick('UNITS')}
                >
                  <i className="fas fa-ruler" style={{ marginRight: 8 }}></i> Đơn Vị Tính
                </button>

                <button 
                  className={`nav-btn ${activeTab === 'PRODUC' ? 'active' : ''}`}
                  onClick={() => handleNavClick('PRODUC')}
                >
                  <i className="fas fa-box" style={{ marginRight: 8 }}></i> Sản phẩm
                </button>
              </div>
            )}
          </div>
          <button 
            className={`nav-btn ${activeTab === 'TK' ? 'active' : ''}`}
            onClick={() => handleNavClick('TK')}
          >
            <i className="fas fa-boxes" style={{ marginRight: 8 }}></i> Báo cáo
          </button>
    
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
      )}

      {/* Main content */}
      <main className="main-content">
        
        <header className="main-header" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '15px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          backgroundColor: '#e6cda3', 
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)' 
        }}>
          
          {/* Trái: Toggle menu mobile và Tiêu đề */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="menu-toggle"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 style={{ marginLeft: 16, margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center' }}>{getTitle()}</h1>
          </div>

          {/* Phải: Thông tin User và Nút Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAuthenticated && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px', display: { xs: 'none', sm: 'inline' } }}>
                  Xin chào, <strong style={{ color: '#8b4513' }}>{user?.username || user?.first_name || user?.email || 'Quản trị viên'}</strong>
                </span>

                {/* Khung Avatar */}
                <div 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    backgroundColor: '#8b4513', color: 'white',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    cursor: 'pointer', fontWeight: 'bold', overflow: 'hidden',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user?.username || user?.first_name || user?.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                {/* Menu Dropdown Đăng xuất đổ xuống */}
                {profileDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '45px', right: '0',
                    backgroundColor: 'white', border: '1px solid #ddd',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '4px',
                    padding: '5px 0', zIndex: 1000, minWidth: '150px'
                  }}>
                    <button 
                      onClick={onLogout}
                      style={{ 
                        width: '100%', padding: '10px 15px', border: 'none', 
                        background: 'transparent', cursor: 'pointer', 
                        textAlign: 'left', color: '#dc3545', fontSize: '15px',
                        display: 'flex', alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i> 
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
        {/* ========================================================= */}
        
        <div className="content-body">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item-mobile ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
          onClick={() => handleNavClick('DASHBOARD')}
        >
          <i className="fas fa-chart-pie"></i>
          <span>Điều Khiển</span>
        </button>
        <button 
          className={`nav-item-mobile ${activeTab === 'SALES' ? 'active' : ''}`}
          onClick={() => handleNavClick('SALES')}
        >
          <i className="fas fa-coins"></i>
          <span>Đơn</span>
        </button>
        <button 
          className={`nav-item-mobile ${activeTab === 'PRODUCTION' ? 'active' : ''}`}
          onClick={() => handleNavClick('PRODUCTION')}
        >
          <i className="fas fa-industry"></i>
          <span>SX</span>
        </button>
        <button 
          className={`nav-item-mobile ${activeTab === 'INVENTORY' ? 'active' : ''}`}
          onClick={() => handleNavClick('INVENTORY')}
        >
          <i className="fas fa-boxes"></i>
          <span>Kho</span>
        </button>
        <button 
          className={`nav-item-mobile ${activeTab === 'TK' ? 'active' : ''}`}
          onClick={() => handleNavClick('TK')}
        >
          <i className="fas fa-boxes"></i>
          <span>Thống kê</span>
        </button>
        <button 
          className={`nav-item-mobile ${activeTab === 'PARTNERS' ? 'active' : ''}`}
          onClick={() => handleNavClick('PARTNERS')}
        >
  
          <i className="fas fa-industry"></i>
          <span>SP</span>
        </button>
        <button 
          className={`nav-item-mobile ${activeTab === 'PRODUC' ? 'active' : ''}`}
          onClick={() => handleNavClick('PRODUC')}
        >
          <i className="fas fa-users"></i>
          <span>Đối Tác</span>
        </button>
      </nav>
    </div>
  );
};

export default Main;
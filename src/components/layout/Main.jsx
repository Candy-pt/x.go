import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Main.css';

const Main = ({ children, activeTab, setActiveTab, isAuthenticated, onLogout, user, avatar }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'DASHBOARD': return (<><i className="fas fa-chart-pie" style={{ marginRight: 8 }}></i> Bảng Điều Khiển</>);
      case 'SALES': return (<><i className="fas fa-coins" style={{ marginRight: 8 }}></i> Quản Lý Đơn Hàng</>);
      case 'INVENTORY': return (<><i className="fas fa-boxes" style={{ marginRight: 8 }}></i> Quản Lý Kho Hàng</>);
      case 'PRODUCTION': return (<><i className="fas fa-industry" style={{ marginRight: 8 }}></i> Quản Lý Sản Xuất</>);
      case 'PRODUC': return (<><i className="fas fa-industry" style={{ marginRight: 8 }}></i> Sản phẩm</>);
      case 'PARTNERS': return (<><i className="fas fa-users" style={{ marginRight: 8 }}></i> Quản Lý Đối Tác</>);
      case 'UNITS': return (<><i className="fas fa-ruler" style={{ marginRight: 8 }}></i> Quản Lý Đơn Vị Tính</>);
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
          <hr className="nav-divider" />
          <button className="nav-btn logout-btn" onClick={onLogout}>
            <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }}></i> Đăng Xuất
          </button>
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
      )}

      {/* Main content */}
      <main className="main-content">
        <header className="main-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="menu-toggle"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <h1 style={{ marginLeft: 16 }}>{getTitle()}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAuthenticated ? (
              <>
                {avatar && <img src={avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }} />}
                { (user && (user.first_name || user.email)) ? (
                  <span style={{ fontWeight: 500, marginRight: 8 }}>{user.first_name || user.email}</span>
                ) : null }
                <button className="logout-btn-header" onClick={onLogout} style={{ fontWeight: 600, color: '#b00', background: '#fff', border: '1px solid #b00', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>Đăng xuất</button>
              </>
            ) : null}
          </div>
        </header>
        
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
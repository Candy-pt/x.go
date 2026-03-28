import { useState } from 'react';
import TK1 from './TK1';
import TK2 from './TK2';
import ProductionReport from './TK3';

import './thongke.css';

const ReportDash = () => {
    // State quản lý tab đang mở (Mặc định mở tab Tồn kho)
    const [activeTab, setActiveTab] = useState('STOCK');

    return (
        <div className="report-dashboard">

            {/* Thanh điều hướng Tab */}
            <div className="report-tab1" >

                <button 
                className={`tab-btn ${activeTab === 'STOCK' ? 'active' : ''}`}
                onClick={() => setActiveTab('STOCK')}
                >
                Tồn Kho Hiện Tại
                </button>

                <button 
                className={`tab-btn ${activeTab === 'TRANSACTIONS' ? 'active' : ''}`}
                onClick={() => setActiveTab('TRANSACTIONS')}
                >
                    Thống kê Nhập / Xuất
                </button>

                <button 
                    className={`tab-btn ${activeTab === 'PRODUCTION' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PRODUCTION')}
                >
                    Năng Suất Sản Xuất
                </button>
            </div>

            {/* KHU VỰC HIỂN THỊ NỘI DUNG TƯƠNG ỨNG VỚI TAB */}
            <div className="report-content">
                {activeTab === 'STOCK' && <TK1 />}
                
                {activeTab === 'TRANSACTIONS' && <TK2 /> }
                {activeTab === 'PRODUCTION' && <ProductionReport />}
            </div>

        </div>
    );
};

export default ReportDash;
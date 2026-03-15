import React, { useState, useMemo } from 'react';
import './thongke.css';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const Tabthongke = ({ orders, machines }) => {
  const [timeRange, setTimeRange] = useState('day'); // 'day', 'week', 'month'

  // 1. THỐNG KÊ TỔNG HÀNG HÓA (Section 6)
  const totalProducts = useMemo(() => {
    const summary = {};
    orders.forEach(order => {
      order.runs?.forEach(run => {
        run.outputs?.forEach(out => {
          const key = out.product_name;
          summary[key] = (summary[key] || 0) + parseFloat(out.quantity);
        });
      });
    });
    return summary;
  }, [orders]);

  // 2. LOGIC XỬ LÝ DỮ LIỆU BIỂU ĐỒ NĂNG SUẤT (Section 5)
  const chartData = useMemo(() => {
    // Trong thực tế, bạn sẽ map qua các runs và group theo ngày/tuần/tháng
    // Ở đây tôi giả lập cấu trúc dữ liệu dựa trên timeRange để bạn thấy giao diện
    const dataTemplates = {
      day: [
        { name: 'Thứ 2', May_01: 120, May_02: 150 },
        { name: 'Thứ 3', May_01: 140, May_02: 130 },
        { name: 'Thứ 4', May_01: 180, May_02: 170 },
        { name: 'Thứ 5', May_01: 100, May_02: 190 },
        { name: 'Hôm nay', May_01: 210, May_02: 160 },
      ],
      week: [
        { name: 'Tuần 1', May_01: 800, May_02: 950 },
        { name: 'Tuần 2', May_01: 940, May_02: 830 },
        { name: 'Tuần 3', May_01: 1100, May_02: 1070 },
        { name: 'Tuần 4', May_01: 1200, May_02: 1190 },
      ],
      month: [
        { name: 'Tháng 1', May_01: 4000, May_02: 3500 },
        { name: 'Tháng 2', May_01: 3000, May_02: 4200 },
        { name: 'Tháng 3', May_01: 4500, May_02: 4800 },
      ]
    };
    return dataTemplates[timeRange];
  }, [timeRange]);

  return (
    <div className="stats-layout fade-in">
      
      {/* SECTION 6: TỔNG LƯỢNG HÀNG TOÀN XƯỞNG */}
      <div className="stats-card full-width bg-gradient-blue">
        <div className="card-header">
          <h3><i className="fas fa-layer-group"></i> Tổng Sản Lượng Toàn Hệ Thống</h3>
        </div>
        <div className="product-summary-grid">
          {Object.entries(totalProducts).map(([name, qty]) => (
            <div key={name} className="summary-item-premium">
              <span className="name">{name}</span>
              <span className="value">{qty.toLocaleString()} <small>đv</small></span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-main-grid">
        {/* SECTION 5: BIỂU ĐỒ NĂNG SUẤT MÁY */}
        <div className="stats-card flex-2">
          <div className="card-header-flex">
            <h3><i className="fas fa-chart-line"></i> Năng Suất Theo Máy</h3>
            <div className="time-filter-btns">
              <button className={timeRange === 'day' ? 'active' : ''} onClick={() => setTimeRange('day')}>Ngày</button>
              <button className={timeRange === 'week' ? 'active' : ''} onClick={() => setTimeRange('week')}>Tuần</button>
              <button className={timeRange === 'month' ? 'active' : ''} onClick={() => setTimeRange('month')}>Tháng</button>
            </div>
          </div>
          <div className="chart-wrapper" style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: '#f5f5f5'}} />
                <Legend />
                <Bar dataKey="May_01" fill="#4e73df" name="Máy Xẻ 01" radius={[4, 4, 0, 0]} />
                <Bar dataKey="May_02" fill="#1cc88a" name="Máy Xẻ 02" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 1 & 2: TRẠNG THÁI MÁY */}
        <div className="stats-card flex-1">
          <div className="card-header">
            <h3><i className="fas fa-microchip"></i> Giám Sát Real-time</h3>
          </div>
          <div className="machine-list-vertical">
            {machines.map(m => (
              <div key={m.id} className={`machine-status-card ${m.status}`}>
                <div className="m-info">
                  <strong>{m.name}</strong>
                  <span className="m-status-text">{m.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}</span>
                </div>
                <div className="m-indicator"></div>
              </div>
            ))}
          </div>
          <hr />
          <div className="reconciliation-preview">
            <h4><i className="fas fa-check-double"></i> Đối soát nhanh</h4>
            <small>Tỷ lệ khớp kho hiện tại: <strong className="text-success">98.5%</strong></small>
            <div className="progress-bar-mini">
              <div className="progress-fill" style={{width: '98.5%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tabthongke;
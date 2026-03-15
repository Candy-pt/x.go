import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TabProductionStats = ({ orders, runs, machines }) => {
  // 1. Thống kê tổng hàng hóa theo mặt hàng (Section 6)
  const totalByProduct = {};
  runs.forEach(run => {
    run.outputs.forEach(out => {
      totalByProduct[out.product_name] = (totalByProduct[out.product_name] || 0) + out.quantity;
    });
  });

  return (
    <div className="stats-container fade-in">
      {/* SECTION 6: TỔNG LƯỢNG HÀNG TẤT CẢ XƯỞNG */}
      <section className="stats-section">
        <h3><i className="fas fa-warehouse"></i> Tổng Kho Thành Phẩm Sản Xuất (Toàn Xưởng)</h3>
        <div className="product-summary-grid">
          {Object.entries(totalByProduct).map(([name, qty]) => (
            <div key={name} className="product-card">
              <span className="product-name">{name}</span>
              <span className="product-qty">{qty.toLocaleString()} <small>SP</small></span>
            </div>
          ))}
        </div>
      </section>

      <div className="main-stats-grid">
        {/* SECTION 1 & 2: GIÁM SÁT THEO MÁY */}
        <section className="machine-monitor">
          <h3><i className="fas fa-microchip"></i> Giám Sát Máy Sản Xuất</h3>
          <div className="machine-list">
            {machines.map(m => (
              <div key={m.id} className={`machine-item status-${m.status}`}>
                <div className="machine-header">
                  <h4>Máy {m.name}</h4>
                  <span className="status-indicator">{m.status === 'active' ? 'Đang chạy' : 'Dừng'}</span>
                </div>
                <div className="machine-body">
                  <h5>Mặt hàng đã sản xuất:</h5>
                  <ul>
                    {/* Giả sử logic lọc sản phẩm theo từng máy */}
                    {m.produced_items.map(item => (
                      <li key={item.id}>{item.name}: <strong>{item.qty}</strong></li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: NĂNG SUẤT (CHART) */}
        <section className="productivity-chart">
          <h3><i className="fas fa-chart-line"></i> Năng Suất Theo Thời Gian</h3>
          <div className="filter-time">
            <button className="active">Ngày</button>
            <button>Tuần</button>
            <button>Tháng</button>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dummyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="May_01" fill="#8884d8" name="Máy 01" />
                <Bar dataKey="May_02" fill="#82ca9d" name="Máy 02" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
};
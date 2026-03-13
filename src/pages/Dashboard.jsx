import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import './Dashboard.css';

const Dashboard = ({ setActiveTab }) => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [statsRes, ordersRes, batchesRes] = await Promise.all([
        api.get('dashboard-stats/').catch(() => ({ data: null })),
        api.get('sales/orders/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('inventory/batches/?page_size=100').catch(() => ({ data: { results: [] } })),
      ]);
      setStats(statsRes.data || {});
      setOrders(ordersRes.data.results || ordersRes.data || []);
      setBatches(batchesRes.data.results || batchesRes.data || []);
    } catch (err) {
      console.error('Lỗi dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); // Tăng lên 60s để đỡ tốn tài nguyên
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC TÍNH TOÁN DỮ LIỆU THỰC ---
  
  // 1. Biểu đồ doanh thu thực tế (7 ngày gần nhất)
  // 1. State điều khiển bộ lọc biểu đồ
  const [chartRange, setChartRange] = useState('7DAYS'); // '7DAYS', 'MONTH', 'YEAR'

  // 2. Logic nhào nặn dữ liệu biểu đồ dựa trên bộ lọc
  const dynamicChartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // --- TRƯỜNG HỢP: 7 NGÀY GẦN NHẤT ---
    if (chartRange === '7DAYS') {
      const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      return days.map(date => ({
        name: date.split('-')[2] + '/' + date.split('-')[1],
        value: orders.filter(o => o.order_date?.startsWith(date) && o.status !== 'CANCELLED')
                    .reduce((sum, o) => sum + (o.total_value || 0), 0)
      }));
    }

    // --- TRƯỜNG HỢP: THEO THÁNG (Chia theo từng ngày trong tháng) ---
    if (chartRange === 'MONTH') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      return [...Array(daysInMonth)].map((_, i) => {
        const day = i + 1;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const total = orders.filter(o => o.order_date?.startsWith(dateStr) && o.status !== 'CANCELLED')
                            .reduce((sum, o) => sum + (o.total_value || 0), 0);
        return { name: `Ng ${day}`, value: total };
      });
    }

    // --- TRƯỜNG HỢP: THEO NĂM (Chia theo 12 tháng) ---
    if (chartRange === 'YEAR') {
      return [...Array(12)].map((_, i) => {
        const monthLabel = i + 1;
        const total = orders.filter(o => {
          if (!o.order_date) return false;
          const d = new Date(o.order_date);
          return d.getFullYear() === currentYear && d.getMonth() === i && o.status !== 'CANCELLED';
        }).reduce((sum, o) => sum + (o.total_value || 0), 0);
        return { name: `Th ${monthLabel}`, value: total };
      });
    }

    return [];
  }, [orders, chartRange]);

  // 2. Các thông số vận hành
  const inputVol = stats?.total_round_input || 0;
  const outputVol = stats?.total_blank_output || 0;
  const recoveryRate = inputVol > 0 ? (outputVol / inputVol) * 100 : 0;
  const pendingOrders = orders.filter(o => ['PENDING', 'CONFIRMED'].includes(o.status?.toUpperCase())).length;

  const fmt = (val) => new Intl.NumberFormat('vi-VN').format(val);

  if (loading) return <div className="dashboard-loading">Đang cập nhật số liệu xưởng...</div>; 

  return (
      <div className="dashboard-wrapper">
        {/* --- HEADER --- */}
        <div className="db-header">
          <div className="db-title">
            <h1>Quản lý chung</h1>
            <p>Cập nhật: {new Date().toLocaleTimeString('vi-VN')}</p>
          </div>
          <div className="db-actions">
            <button className="btn-add" onClick={() => setActiveTab('SALES')}>
              <i className="fas fa-plus"></i> Đơn Mới
            </button>
            <button className="btn-import" onClick={() => setActiveTab('INVENTORY')}>
              <i className="fas fa-file-import"></i> Nhập Kho
            </button>
          </div>
        </div>

        {/* --- HÀNG 1: CÁC THẺ KPI (Tổng cộng 4 thẻ) --- */}
        <div className="kpi-grid">
          <div className="kpi-card gold">
            <label>Doanh Thu Dự Kiến</label>
            <h3>{fmt(orders.reduce((sum, o) => sum + (o.total_value || 0), 0))} ₫</h3>
            <span className="trend">Theo {orders.length} đơn hàng</span>
          </div>
          <div className="kpi-card brown">
            <label>Tỷ Lệ Thu Hồi (Recovery)</label>
            <h3>{recoveryRate.toFixed(1)}%</h3>
            <div className="progress-mini"><div style={{width: `${recoveryRate}%`}}></div></div>
          </div>
          <div className="kpi-card green">
            <label>Đơn Chờ Xử Lý</label>
            <h3>{pendingOrders}</h3>
            <span className="trend">Cần xác nhận giao hàng</span>
          </div>
          <div className="kpi-card dark">
            <label>Sản Lượng Tuần</label>
            <h3>{stats?.total_production_week || 0} m³</h3>
            <span className="trend">Gỗ xẻ thành phẩm</span>
          </div>
        </div>

        {/* --- HÀNG 2: BIỂU ĐỒ & TRẠNG THÁI MÁY (Phải nằm trong main-db-grid) --- */}
        <div className="main-db-grid">
          {/* Biểu đồ chiếm 2 cột */}
          <div className="db-card col-span-2">
            <div className="card-header">
              <h4><i className="fas fa-chart-line"></i> Phân Tích Doanh Thu</h4>
              <div className="chart-filters">
                <button className={chartRange === '7DAYS' ? 'active' : ''} onClick={() => setChartRange('7DAYS')}>7 Ngày</button>
                <button className={chartRange === 'MONTH' ? 'active' : ''} onClick={() => setChartRange('MONTH')}>Tháng</button>
                <button className={chartRange === 'YEAR' ? 'active' : ''} onClick={() => setChartRange('YEAR')}>Năm</button>
              </div>
            </div>
            <div className="chart-box" style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" fontSize={11} tick={{fill: '#888'}} interval={chartRange === 'MONTH' ? 2 : 0} />
                  <YAxis fontSize={11} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val} />
                  <Tooltip 
                    formatter={(value) => [new Intl.NumberFormat('vi-VN').format(value) + ' ₫', 'Doanh thu']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#A45C23" strokeWidth={3} dot={chartRange === '7DAYS'} activeDot={{ r: 6 }} animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trạng thái máy chiếm 1 cột */}
          <div className="db-card">
            <div className="card-header"><h4><i className="fas fa-cog"></i> Trạng Thái Máy</h4></div>
            <div className="machine-list">
              {(stats?.machines || [1,2,3]).map((m, i) => (
                <div key={i} className="machine-item">
                  <span>{m.name || `Máy xẻ ${i+1}`}</span>
                  <span className={`status-tag ${(m.status || 'RUNNING').toLowerCase()}`}>
                    {m.status || 'RUNNING'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- HÀNG 3: BẢNG ĐƠN HÀNG & CẢNH BÁO KHO --- */}
        <div className="main-db-grid">
          <div className="db-card col-span-2">
            <div className="card-header"><h4><i className="fas fa-list"></i> Đơn Hàng Vừa Lập</h4></div>
            <table className="db-table">
              <thead>
                <tr><th>Mã</th><th>Khách</th><th>Giá Trị</th><th>Trạng Thái</th></tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id}>
                    <td><b>{o.code}</b></td>
                    <td>{o.customer_name}</td>
                    <td>{fmt(o.total_value)} ₫</td>
                    <td><span className={`pill ${o.status}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="db-card">
            <div className="card-header"><h4><i className="fas fa-exclamation-circle"></i> Cảnh Báo Kho</h4></div>
            <div className="alert-list">
              {batches.filter(b => (b.current_qty || 0) < 50).slice(0, 5).map(b => (
                <div key={b.id} className="alert-item">
                  <div className="alert-info">
                    <p>{b.product_name || b.code}</p>
                    <small>Lô: {b.code}</small>
                  </div>
                  <span className="alert-qty">{b.current_qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
};
export default Dashboard;
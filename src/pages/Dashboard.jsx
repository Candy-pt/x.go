import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import './Dashboard.css';

const Dashboard = ({ setActiveTab }) => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentTxLoading, setRecentTxLoading] = useState(false);

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

  const fetchRecentTransactions = async () => {
    setRecentTxLoading(true);
    try {
      const response = await api.get('inventory/transactions/?page=1&page_size=5');
      const data = response.data.results || response.data || [];
      setRecentTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải giao dịch gần nhất:", err);
      setRecentTransactions([]);
    } finally {
      setRecentTxLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentTransactions();
    fetchAllData();
    
    const interval = setInterval(() => {
        fetchAllData();
        fetchRecentTransactions(); 
    }, 60000); 
    
    return () => clearInterval(interval);
  }, []);

  // --- LOGIC TÍNH TOÁN DỮ LIỆU THỰC ---
  
  // 1. Biểu đồ doanh thu thực tế 
  const [chartRange, setChartRange] = useState('7DAYS'); 

  const dynamicChartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // --- 7 NGÀY  ---
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

    // --- THEO THÁNG ---
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

    // --- THEO NĂM  ---
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


  // ==========================================
  // 2. LOGIC TÍNH TOÁN CHO CÁC BIỂU ĐỒ & UI MỚI
  // ==========================================
  
  // -- Biểu đồ tròn: Cơ cấu doanh thu theo Khách Hàng --
  const revenueByCustomer = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (o.status !== 'CANCELLED') {
        const name = o.customer_name || 'Khách lẻ';
        map[name] = (map[name] || 0) + (o.total_value || 0);
      }
    });
    return Object.keys(map).map(key => ({ name: key, value: map[key] })).sort((a,b) => b.value - a.value).slice(0, 4); // Lấy top 4
  }, [orders]);
  const PIE_COLORS = ['#d97706', '#059669', '#3b82f6', '#8b4513'];

  // -- Dữ liệu Biểu đồ Cột chồng (MÔ PHỎNG - Chờ bạn tạo API lấy data sản xuất) --
  const mockProductionChart = [
    { date: 'Thứ 2', input: 120, output: 75 },
    { date: 'Thứ 3', input: 150, output: 95 },
    { date: 'Thứ 4', input: 180, output: 120 },
    { date: 'Thứ 5', input: 100, output: 65 },
    { date: 'Thứ 6', input: 200, output: 130 },
    { date: 'Thứ 7', input: 250, output: 165 },
    { date: 'CN', input: 210, output: 140 },
  ];

  // -- Tính toán Tồn kho (Dựa vào batches của bạn) --
  // Giả sử batch.product_type là 'RAW' (Nguyên liệu) hoặc khác. Nếu không có, mình chia đôi tạm.
  const rawStock = batches.filter(b => b.product_type === 'RAW' || !b.product_type).reduce((s, b) => s + (Number(b.current_qty) || 0), 0);
  const fgStock = batches.filter(b => b.product_type === 'FINISHED').reduce((s, b) => s + (Number(b.current_qty) || 0), 0);


  if (loading) return <div className="dashboard-loading">Đang cập nhật số liệu xưởng...</div>; 


  return (
      <div className="dashboard-wrapper">
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

        {/* --- CÁC THẺ KPI --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderBottom: '4px solid #f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>Doanh Thu Dự Kiến</div>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: '#333' }}>{fmt(orders.reduce((sum, o) => sum + (o.total_value || 0), 0))} ₫</h3>
          </div>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderBottom: '4px solid #8b4513', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>Tỷ Lệ Thu Hồi</div>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: '#333' }}>{recoveryRate.toFixed(1)} %</h3>
          </div>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderBottom: '4px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>Đơn Chờ Xử Lý</div>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: '#333' }}>{pendingOrders} <span style={{fontSize: '14px', fontWeight: 'normal'}}>đơn</span></h3>
          </div>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderBottom: '4px solid #3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>Sản Lượng Tuần</div>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: '#333' }}>{stats?.total_production_week || 0} m³</h3>
          </div>

          {/* KPI MỚI */}
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderBottom: '4px solid #6366f1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>Tồn Kho Nguyên Liệu</div>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: '#333' }}>{fmt(rawStock)} m³</h3>
          </div>

          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderBottom: '4px solid #ec4899', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '13px', color: '#666' }}>Tồn Kho Thành Phẩm</div>
            <h3 style={{ margin: '5px 0', fontSize: '20px', color: '#333' }}>{fmt(fgStock)} m³</h3>
          </div>
        </div>

        {/* --- HÀNG 2: BIỂU ĐỒ đường --- */}
        <div className="main-db-grid">
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

          {/* Biểu đồ Tròn Mới */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
             <h4 style={{ margin: '0 0 20px 0', color: '#444' }}><i className="fas fa-chart-pie"></i> Cơ Cấu Doanh Thu</h4>
             {revenueByCustomer.length === 0 ? <p style={{textAlign: 'center', color: '#888', marginTop: '50px'}}>Chưa có doanh thu</p> : (
               <div style={{ width: '100%', height: 300 }}>
                 <ResponsiveContainer>
                   <PieChart>
                     <Pie data={revenueByCustomer} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                       {revenueByCustomer.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                     </Pie>
                     <Tooltip formatter={(value) => fmt(value) + ' đ'} />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             )}
          </div>

          
        </div>
        {/* --- HÀNG 3: BIỂU ĐỒ cột chồng --- */}
        <div style={{ gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'  }}>
          <div>
            <h4 style={{ margin: '0 0 20px 0', color: '#444' }}><i className="fas fa-industry"></i> Hiệu Suất Sản Xuất</h4>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={mockProductionChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f5f5f5'}} />
                  <Legend />
                  <Bar dataKey="input" name="Gỗ nguyên liệu (m³)" stackId="a" fill="#d97706" />
                  <Bar dataKey="output" name="Thành phẩm (m³)" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* --- HÀNG 3: BẢNG DỮ LIỆU --- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px' }}>
          
          {/* 1. Đơn Hàng Vừa Lập */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#444' }}><i className="fas fa-list"></i> Đơn Hàng Vừa Lập</h4>
              {/* Nút Xem Tất Cả Mới */}
              <button onClick={() => setActiveTab('SALES')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer' }}>Xem tất cả →</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', color: '#888' }}>
                  <th style={{ paddingBottom: '10px' }}>Mã</th>
                  <th style={{ paddingBottom: '10px' }}>Khách</th>
                  <th style={{ paddingBottom: '10px' }}>Giá Trị</th>
                  <th style={{ paddingBottom: '10px' }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold', color: '#333' }}>{o.code || o.id}</td>
                    <td style={{ padding: '10px 0' }}>{o.customer_name}</td>
                    <td style={{ padding: '10px 0', fontWeight: '500' }}>{fmt(o.total_value)} ₫</td>
                    <td style={{ padding: '10px 0' }}>
                      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', background: '#f3f4f6', fontWeight: 'bold', color: '#555' }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 2. Giao Dịch Kho Gần Nhất (Cột mới) */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#444' }}><i className="fas fa-exchange-alt"></i> Giao Dịch Kho</h4>
            {/* <button onClick={() => setActiveTab('TRANSACTIONS')} style={{ background: 'none', border: 'none', color: '#131415', fontWeight: 'bold', cursor: 'pointer' }}>Xem thêm</button> */}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {recentTransactions.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', fontSize: '13px' }}>Chưa có giao dịch nào</div>
              ) : (
                  recentTransactions.slice(0, 5).map((tx, i) => {
                    const isImport = tx.transaction_type === 'IMPORT';
                    const color = isImport ? '#d90622' : '#059669'; // đỏ - Nhập, Xanh - Xuất
                    const sign = isImport ? '+' : '-';
                    
                    // Xử lý format thời gian (tùy thuộc vào trường ngày giờ API bạn trả về, ví dụ tx.created_at hoặc tx.date)
                    const timeString = tx.date ? new Date(tx.date).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {tx.product_name || 'Sản phẩm'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>
                            {timeString} • <span style={{ color: color, fontWeight: 'bold' }}>{isImport ? 'NHẬP' : 'XUẤT'}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: color }}>
                          {sign}{Number.isInteger(parseFloat(tx.quantity)) ? tx.quantity : parseFloat(tx.quantity).toFixed(2)}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* 3. Cảnh Báo Kho (Đã tối ưu UI) */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#dc2626' }}><i className="fas fa-exclamation-circle"></i> Cảnh Báo Kho</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {batches.filter(b => (b.current_qty || 0) < 50).slice(0, 5).map(b => {
                const isCritical = b.current_qty < 10; // Dưới 10 thì báo Đỏ, dưới 50 báo Vàng
                return (
                  <div key={b.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '10px', borderRadius: '6px', 
                    backgroundColor: isCritical ? '#fee2e2' : '#fef3c7',
                    borderLeft: `4px solid ${isCritical ? '#ef4444' : '#f59e0b'}`
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{b.product_name || b.code}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Lô: {b.code}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: isCritical ? '#b91c1c' : '#b45309' }}>{b.current_qty}</div>
                      <div style={{ fontSize: '11px', color: isCritical ? '#ef4444' : '#d97706' }}>{isCritical ? 'Sắp hết!' : 'Cần nhập'}</div>
                    </div>
                  </div>
                );
              })}
              {batches.filter(b => (b.current_qty || 0) < 50).length === 0 && (
                <div style={{ textAlign: 'center', color: '#10b981', padding: '20px' }}>Kho đang ở mức an toàn</div>
              )}
            </div>
          </div>

        </div>

       
      </div>
    );
};
export default Dashboard;

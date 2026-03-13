import React, { useState, useMemo } from 'react';
import './oder.css';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const Oder = ({ ordersAll }) => {
  // 1. State cho bộ lọc thời gian
  const [filterType, setFilterType] = useState('MONTH'); // TODAY, WEEK, MONTH, CUSTOM
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  // 1. Logic lọc dữ liệu theo thời gian (giữ nguyên như bài trước)
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    return ordersAll.filter(order => {
      const orderDate = new Date(order.order_date);
      if (filterType === 'TODAY') return orderDate >= startOfToday;
      if (filterType === 'WEEK') {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return orderDate >= lastWeek;
      }
      if (filterType === 'MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= startOfMonth;
      }
      if (filterType === 'CUSTOM') {
        if (!customRange.start || !customRange.end) return true;
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  }, [ordersAll, filterType, customRange]);

  // --- LOGIC XỬ LÝ DỮ LIỆU CHO SƠ ĐỒ ---

  // Sơ đồ 4: Top khách hàng chi đậm nhất (Bar Chart)
  const customerData = useMemo(() => {
    const customerMap = {};
    filteredData.forEach(o => {
      const name = o.customer_name || 'Khách vãng lai';
      customerMap[name] = (customerMap[name] || 0) + (o.total_value || 0);
    });
    return Object.keys(customerMap)
      .map(name => ({ name, value: customerMap[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Lấy Top 5
  }, [filteredData]);

  // Sơ đồ 5: Tỷ trọng trạng thái đơn hàng (Pie Chart)
  const statusData = useMemo(() => {
    const statusLabels = {
      'PENDING': 'Chờ xử lý',
      'CONFIRMED': 'Đã xác nhận',
      'PRODUCTION': 'Đang sản xuất',
      'COMPLETED': 'Đã giao hàng',
      'CANCELLED': 'Đã hủy đơn'
    };

  return Object.keys(statusLabels).map(st => ({
    name: statusLabels[st], // Chuyển thành tiếng Việt ở đây
    value: filteredData.filter(o => o.status === st).length
  })).filter(st => st.value > 0); // Chỉ hiện những trạng thái có đơn
}, [filteredData]);

  const COLORS = ['#f1c40f', '#3498db', '#9b59b6', '#2ecc71', '#e74c3c'];

  // 3. Tính toán các chỉ số (Logic Processing)
  const stats = useMemo(() => {
    const completedOrders = filteredData.filter(o => o.status === 'COMPLETED');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const orderCount = filteredData.length;
    const avgValue = orderCount > 0 ? totalRevenue / (completedOrders.length || 1) : 0;
    const cancelledCount = filteredData.filter(o => o.status === 'CANCELLED').length;
    const cancellationRate = orderCount > 0 ? (cancelledCount / orderCount) * 100 : 0;

    return { totalRevenue, orderCount, avgValue, cancellationRate, cancelledCount };
  }, [filteredData]);

  const fmt = (val) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';

  return (
    <div className="sales-tab-content fade-in">
      <div className="stats-header">
        <h3><i className="fas fa-chart-line"></i> Phân Tích Tình Hình Bán Hàng</h3>
        
        {/* BỘ LỌC THỜI GIAN */}
        <div className="filter-bar">
          <button className={filterType === 'TODAY' ? 'active' : ''} onClick={() => setFilterType('TODAY')}>Hôm nay</button>
          <button className={filterType === 'WEEK' ? 'active' : ''} onClick={() => setFilterType('WEEK')}>7 Ngày qua</button>
          <button className={filterType === 'MONTH' ? 'active' : ''} onClick={() => setFilterType('MONTH')}>Tháng này</button>
          <button className={filterType === 'CUSTOM' ? 'active' : ''} onClick={() => setFilterType('CUSTOM')}>Tùy chọn</button>
          
          {filterType === 'CUSTOM' && (
            <div className="custom-date-inputs">
              <input type="date" onChange={(e) => setCustomRange({...customRange, start: e.target.value})} />
              <span>đến</span>
              <input type="date" onChange={(e) => setCustomRange({...customRange, end: e.target.value})} />
            </div>
          )}
        </div>
      </div>

      {/* Ý TƯỞNG 1: THẺ CHỈ SỐ (OVERVIEW CARDS) */}
      <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-icon"><i className="fas fa-money-bill-wave"></i></div>
          <div className="stat-info">
            <label>Tổng Doanh Thu</label>
            <p>{fmt(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="stat-card orders">
          <div className="stat-icon"><i className="fas fa-shopping-cart"></i></div>
          <div className="stat-info">
            <label>Số Đơn Hàng</label>
            <p>{stats.orderCount} đơn</p>
          </div>
        </div>
        <div className="stat-card avg-value">
          <div className="stat-icon"><i className="fas fa-receipt"></i></div>
          <div className="stat-info">
            <label>Giá Trị TB Đơn</label>
            <p>{fmt(stats.avgValue)}</p>
          </div>
        </div>
        <div className="stat-card cancel">
          <div className="stat-icon"><i className="fas fa-user-times"></i></div>
          <div className="stat-info">
            <label>Tỷ Lệ Hủy</label>
            <p>{stats.cancellationRate.toFixed(1)}% ({stats.cancelledCount})</p>
          </div>
        </div>
      </div>

      {/* KHU VỰC CHI TIẾT & BIỂU ĐỒ - CHIA LƯỚI 2x2 */}
      <div className="stats-dashboard-grid">
        
        {/* 1. Danh sách đơn hàng gần đây */}
        <div className="chart-container">
          <h4><i className="fas fa-history"></i> Đơn hàng trong kỳ ({filteredData.length})</h4>
          <div className="table-responsive" style={{ maxHeight: '300px' }}>
            <table className="unit-table compact">
              <thead>
                <tr><th>Mã</th><th>Khách</th><th>Ngày</th><th>Giá trị</th></tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.slice(0, 8).map(o => (
                  <tr key={o.id}>
                    <td><b>{o.code}</b></td>
                    <td>{o.customer_name}</td>
                    <td>{new Date(o.order_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('vi-VN').format(o.total_value)}</td>
                  </tr>
                )) : <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Không có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Thanh tiến trình trạng thái (Nhìn nhanh) */}
        <div className="chart-container">
          <h4><i className="fas fa-tasks"></i> Tiến độ vận hành</h4>
          <div className="status-bars" style={{ marginTop: '15px' }}>
            {['PENDING', 'CONFIRMED', 'PRODUCTION', 'COMPLETED', 'CANCELLED'].map(st => {
              const count = filteredData.filter(o => o.status === st).length;
              const percent = filteredData.length > 0 ? (count / filteredData.length) * 100 : 0;
              const colorClass = st; // Sẽ dùng CSS để định màu
              return (
                <div key={st} className="status-progress-item">
                  <div className="label-row">
                    <span className={`status-text ${st}`}>{st === 'PRODUCTION' ? 'Đang sản xuất' : st}</span>
                    <span>{count} đơn</span>
                  </div>
                  <div className="progress-bg">
                    <div className={`progress-fill ${colorClass}`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BẢNG XẾP HẠNG KHÁCH HÀNG (Game Leaderboard Style) */}
        <div className="chart-container">
          <h4><i className="fas fa-trophy" style={{ color: 'gold' }}></i> Bảng Vinh Danh Khách Hàng</h4>
          {customerData.length > 0 ? (
            <div className="leaderboard">
              {customerData.map((cust, index) => {
                // Tính % chiều dài thanh "lực" dựa trên người đứng đầu
                const maxVal = customerData[0].value;
                const barWidth = (cust.value / maxVal) * 100;
                
                // Xác định huy chương cho Top 3
                const getRankIcon = (idx) => {
                  if (idx === 0) return <i className="fas fa-medal" style={{ color: '#FFD700' }}></i>; // Vàng
                  if (idx === 1) return <i className="fas fa-medal" style={{ color: '#C0C0C0' }}></i>; // Bạc
                  if (idx === 2) return <i className="fas fa-medal" style={{ color: '#CD7F32' }}></i>; // Đồng
                  return <span className="rank-number">{idx + 1}</span>;
                };

                return (
                  <div key={index} className={`leaderboard-item rank-${index + 1}`}>
                    <div className="rank-badge">
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="rank-info">
                      <div className="rank-name-row">
                        <span className="customer-name">{cust.name}</span>
                        <span className="customer-value">{fmt(cust.value)}</span>
                      </div>
                      <div className="rank-progress-bar">
                        <div 
                          className="rank-progress-fill" 
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data-msg">Chưa có dữ liệu vinh danh</p>
          )}
        </div>



        {/* 4. SƠ ĐỒ 5: TỶ TRỌNG (Pie Chart) */}
        <div className="chart-container">
          <h4><i className="fas fa-chart-pie"></i> Cơ cấu trạng thái đơn</h4>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={40}  // Giảm xuống để lỗ ở giữa nhỏ lại
                  outerRadius={90}  // Tăng lên để vành ngoài to ra => Đường dày hơn
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"     // Bỏ đường viền trắng giữa các miếng cho mượt
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  // Thêm cái này để Tooltip cũng hiện tiếng Việt chuẩn
                  formatter={(value, name) => [value + ' đơn', name]} 
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-msg">Chưa có trạng thái đơn</p>
          )}
        </div>

      </div> 
    </div>
  );

};
export default Oder;
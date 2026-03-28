import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
// Nếu bạn vẫn muốn dùng file CSS cũ thì bỏ comment dòng dưới này:
// import './thongke.css'; 

const ProductionReport = () => {
  const [timeRange, setTimeRange] = useState('day'); // 'day', 'week', 'month'
  
  // State chứa dữ liệu thật (Sau này bạn gọi API để set lại)
  const [orders, setOrders] = useState([]); 
  const [machines, setMachines] = useState([
      { id: 1, name: 'Máy Xẻ 01', status: 'active' },
      { id: 2, name: 'Máy Xẻ 02', status: 'inactive' }
  ]);

  // TODO: Nơi bạn gọi API lấy dữ liệu Sản xuất thực tế
  useEffect(() => {
      // Giả lập dữ liệu orders để UI hiển thị được phần "Tổng Sản Lượng"
      const mockOrders = [
          { runs: [{ outputs: [{ product_name: 'Gỗ keo', quantity: 150 }, { product_name: 'Thanh b7', quantity: 300 }] }] }
      ];
      setOrders(mockOrders);
  }, []);

  

  // 2. LOGIC XỬ LÝ DỮ LIỆU BIỂU ĐỒ NĂNG SUẤT
  const chartData = useMemo(() => {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* SECTION BIỂU ĐỒ NĂNG SUẤT */}
        <div style={{ flex: '2', minWidth: '600px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#444' }}><i className="fas fa-chart-line"></i> Năng Suất Theo Máy</h3>
            
            {/* Cụm nút bấm chuyển ngày/tuần/tháng */}
            <div style={{ display: 'flex', gap: '5px', background: '#f1f1f1', padding: '4px', borderRadius: '6px' }}>
              {['day', 'week', 'month'].map((range) => (
                  <button 
                      key={range}
                      onClick={() => setTimeRange(range)}
                      style={{
                          border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                          backgroundColor: timeRange === range ? '#fff' : 'transparent',
                          color: timeRange === range ? '#4e73df' : '#666',
                          boxShadow: timeRange === range ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                  >
                      {range === 'day' ? 'Ngày' : range === 'week' ? 'Tuần' : 'Tháng'}
                  </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 350 }}>
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

        {/* SECTION GIÁM SÁT MÁY */}
        <div style={{ flex: '1', minWidth: '300px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#444' }}><i className="fas fa-microchip"></i> Giám Sát Real-time</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
            {machines.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #eee', borderRadius: '6px', borderLeft: `4px solid ${m.status === 'active' ? '#1cc88a' : '#e74a3b'}` }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px' }}>{m.name}</strong>
                  <span style={{ fontSize: '13px', color: m.status === 'active' ? '#1cc88a' : '#e74a3b' }}>
                      {m.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
                {/* Dấu chấm nhấp nháy trạng thái */}
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: m.status === 'active' ? '#1cc88a' : '#e74a3b' }}></div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '20px' }} />
          
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}><i className="fas fa-check-double"></i> Đối soát nhanh</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <small style={{ color: '#666' }}>Tỷ lệ khớp kho:</small>
                <strong style={{ color: '#1cc88a' }}>98.5%</strong>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '4px', height: '8px' }}>
              <div style={{ width: '98.5%', backgroundColor: '#1cc88a', height: '100%', borderRadius: '4px' }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductionReport;
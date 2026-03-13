import React from 'react';

const his = ({ customer, ordersAll, onClose, setSelectedOrder }) => {
  if (!customer) return null;

  // Lọc toàn bộ đơn hàng của khách này từ trước đến nay
  const history = ordersAll.filter(o => {
    const orderCustomerId = o.customer?.id || o.customer;
    return orderCustomerId === customer.id;
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content modern-form" style={{ maxWidth: '800px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', marginBottom: '15px' }}>
          <h3>Lịch sử đơn hàng: {customer.name}</h3>
          <button className="nav-btn" onClick={onClose} style={{fontSize: '24px'}}>&times;</button>
        </div>

        <div className="modal-body">
          <p>Tổng số đơn hàng đã đặt: <strong>{history.length} đơn</strong></p>
          
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="inv-table compact">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Ngày Đặt</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Giá Trị</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map(order => (
                  <tr 
                    key={order.id} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => {
                        setSelectedOrder(order); // Cho phép bấm vào để xem chi tiết đơn đó luôn
                        onClose(); 
                    }}
                  >
                    <td><strong>{order.code}</strong></td>
                    <td>{new Date(order.order_date).toLocaleDateString('vi-VN')}</td>
                    <td>
                        <span className={`status-badge ${order.status}`}>{order.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {new Intl.NumberFormat('vi-VN').format(order.total_value)} đ
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Khách hàng này chưa có đơn hàng nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '20px', textAlign: 'right' }}>
          <button className="sub-tab-btn" onClick={onClose}>Đóng cửa sổ</button>
        </div>
      </div>
    </div>
  );
};

export default his;
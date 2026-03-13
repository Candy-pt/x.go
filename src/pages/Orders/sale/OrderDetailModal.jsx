import React from 'react';

const OrderDetailModal = ({ order, onClose, onStatusChange, onDeliver, loading }) => {
  if (!order) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modern-form" style={{ maxWidth: '800px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--primary)' }}>Chi tiết đơn hàng: {order.code}</h2>
          <button className="nav-btn" onClick={onClose} style={{ fontSize: '24px' }}>&times;</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <p><strong>Khách hàng:</strong> {order.customer?.name || order.customer_name}</p>
            <p><strong>Ngày đặt:</strong> {new Date(order.order_date).toLocaleDateString('vi-VN')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>Trạng thái hiện tại:</strong> <span className={`status-badge ${order.status}`}>{order.status}</span></p>
            <div style={{ marginTop: '10px' }}>
              <label style={{ marginRight: '10px' }}>Chuyển trạng thái:</label>
              <select 
                value={order.status} 
                onChange={(e) => onStatusChange(order.id, e.target.value)}
                disabled={loading}
              >
                <option value="PENDING">Chờ xử lý</option>
                <option value="CONFIRMED">Đã chốt</option>
                <option value="PRODUCTION">Đang sản xuất</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="inv-table compact" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}>
                <th>Sản phẩm</th>
                <th style={{ textAlign: 'right' }}>Số lượng</th>
                <th style={{ textAlign: 'right' }}>Đơn giá</th>
                <th style={{ textAlign: 'right' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((it) => (
                <tr key={it.id}>
                  <td>{it.product_name}</td>
                  <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{new Intl.NumberFormat('vi-VN').format(it.price)} đ</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {new Intl.NumberFormat('vi-VN').format(it.quantity * it.price)} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <h3 style={{ color: 'var(--primary)' }}>
            Tổng cộng: {new Intl.NumberFormat('vi-VN').format(order.total_value)} đ
          </h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
          <button className="sub-tab-btn" onClick={onClose}>Đóng</button>
          
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <button 
              className="btn-confirm-delivery" 
              onClick={() => onDeliver(order.id)} 
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : '📦 Xác nhận xuất kho'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
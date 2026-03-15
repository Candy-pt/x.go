import React from 'react';

const TabWastage = ({ loading, orders, averageWastage }) => {
  return (
    <div className="prod-tab-content fade-in">
      <h3><i className="fas fa-chart-bar" style={{ marginRight: 8 }}></i> Tra Cứu Tỷ Lệ Hao Hụt</h3>
      {loading ? (
        <div className="loading">Đang tải dữ liệu hao hụt...</div>
      ) : orders.length > 0 ? (
        <div className="wastage-results">
          <p className="info">Danh sách lệnh sản xuất đã hoàn thành và tỷ lệ hao hụt</p>
          <div className="wastage-chart">
            {orders.map((order) => (
              <div key={order.id} className="wastage-item" style={{ borderLeft: order.wastage_alert ? '4px solid #dc3545' : '4px solid #28a745' }}>
                <div className="wastage-info">
                  <strong>Mã lệnh: {order.code}</strong>
                  <span>Đơn hàng: {order.sale_order?.code || 'N/A'}</span>
                  <span>Ngày hoàn thành: {order.end_date ? new Date(order.end_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                </div>
                <div className="wastage-value">
                  <span className="wastage-percent" style={{ color: order.wastage_alert ? '#dc3545' : '#28a745' }}>{order.wastage_percent}%</span>
                  {order.wastage_alert && <span className="alert-badge">Vượt mục tiêu!</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="average">
            📊 Trung bình hao hụt: <strong>{averageWastage}%</strong> (Mục tiêu: 15%)
            {parseFloat(averageWastage) > 15 && <span style={{ color: '#dc3545', marginLeft: 10 }}>⚠ Vượt mục tiêu</span>}
          </p>
        </div>
      ) : (
        <p className="no-data">Chưa có lệnh sản xuất nào hoàn thành để tính hao hụt</p>
      )}
    </div>
  );
};

export default TabWastage;
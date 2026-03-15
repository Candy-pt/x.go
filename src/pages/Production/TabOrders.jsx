import React, { useState } from 'react';
import './order.css';

const TabOrders = ({ loading, orders, onDelete, onEdit, onViewDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Logic lọc dữ liệu
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (order.sale_order?.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="prod-tab-content fade-in">
      <div className="tab-header-actions">
        <h3><i className="fas fa-clipboard-list" style={{ marginRight: 8 }}></i> Danh Sách Lệnh Sản Xuất</h3>
        
        {/* Bộ lọc và Tìm kiếm */}
        <div className="filter-controls">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Tìm mã lệnh, mã đơn..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PLANNED">Lên kế hoạch</option>
            <option value="IN_PROGRESS">Đang chạy</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Hủy</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : filteredOrders.length > 0 ? (
        <div className="table-responsive">
          <table className="prod-table">
            <thead>
              <tr>
                <th>Mã Lệnh</th>
                <th>Đơn Hàng</th>
                <th>Ngày Bắt Đầu</th>
                <th>Trạng Thái</th>
                <th>Ghi Chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td className="clickable-cell" onClick={() => onViewDetail(order)}>
                    <strong className="order-code-link">{order.code}</strong>
                  </td>
                  <td>{order.sale_order?.code || 'N/A'}</td>
                  <td>{new Date(order.start_date).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                      {order.status === 'PLANNED' && (<><i className="fas fa-calendar-alt"></i> Lên kế hoạch</>)}
                      {order.status === 'IN_PROGRESS' && (<><i className="fas fa-cog"></i> Đang chạy</>)}
                      {order.status === 'COMPLETED' && (<><i className="fas fa-check"></i> Hoàn thành</>)}
                      {order.status === 'CANCELLED' && (<><i className="fas fa-times"></i> Hủy</>)}
                    </span>
                  </td>
                  <td>{order.note || '-'}</td>
                  <td className="action-buttons">
                    <button 
                      className="btn-view" 
                      onClick={() => onViewDetail(order)}
                      title="Xem chi tiết"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className="btn-edit" 
                      onClick={() => onEdit(order)}
                      title="Sửa lệnh"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => onDelete(order.id, order.code)} 
                      title="Xóa lệnh"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data">Không tìm thấy lệnh sản xuất nào phù hợp</p>
      )}
    </div>
  );
};

export default TabOrders;
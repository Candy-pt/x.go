import React from 'react';

const Custom = ({ customers, orders, setSelectedCustomer, setActiveTab, setCreateForm, createForm }) => {
  return (
    <div className="sales-tab-content fade-in">
      <h3><i className="fas fa-users" style={{ marginRight: 8 }}></i> Quản Lý Khách Hàng</h3>
      <div className="customers-grid">
        {customers.map(customer => {
          
          const customerOrdersCount = orders.filter(o => {
              const orderCustomerId = o.customer?.id || o.customer;
              return orderCustomerId === customer.id;
          }).length;

          return (
            <div key={customer.id} className="customer-card">
              <h4>{customer.name}</h4>
              <p><strong>SĐT:</strong> {customer.phone || '-'}</p>
              
              {/* Hiển thị số lượng đơn hàng ở đây */}
              <p>
                <strong>Số đơn hàng:</strong> 
                <span className="order-count-badge" style={{ marginLeft: 8, color: 'var(--primary)', fontWeight: 'bold' }}>
                   {customerOrdersCount} đơn
                </span>
              </p>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn-history" onClick={() => setSelectedCustomer(customer)}>
                  Xem Lịch Sử
                </button>
                <button 
                  className="btn-history" 
                  onClick={() => { 
                    setActiveTab('CREATE'); 
                    setCreateForm({...createForm, customer_id: customer.id}); 
                  }}
                >
                  Tạo Đơn
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Custom;
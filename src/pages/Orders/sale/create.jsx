import React from 'react';

const Create = ({ createForm, setCreateForm, customers, products, handleCreateOrder }) => {
  
  // Hàm cập nhật từng dòng sản phẩm (Fix lỗi không hiện chữ)
  const updateItem = (index, field, value) => {
    setCreateForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Thêm dòng mới
  const addItemField = () => {
    setCreateForm(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: '', price: '' }]
    }));
  };

  // Xóa dòng
  const removeItemField = (index) => {
    if (createForm.items.length > 1) {
      setCreateForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="sales-tab-content fade-in">
      <h3><i className="fas fa-plus" style={{ marginRight: 8 }}></i> Tạo Đơn Hàng Mới</h3>
      <form onSubmit={handleCreateOrder} className="sales-form">
        <div className="form-row">
          <div className="form-group">
            <label>Khách Hàng *</label>
            <select 
              value={createForm.customer_id} 
              onChange={(e) => setCreateForm({...createForm, customer_id: e.target.value})} 
              required
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ngày Giao Dự Kiến *</label>
            <input 
              type="date" 
              value={createForm.delivery_date} 
              onChange={(e) => setCreateForm({...createForm, delivery_date: e.target.value})} 
              required 
            />
          </div>
        </div>

        <div className="form-section">
          <h4><i className="fas fa-box" style={{ marginRight: 8 }}></i> Chi Tiết Sản Phẩm</h4>
          {createForm.items.map((item, idx) => (
            <div key={idx} className="form-row item-row">
              <div className="form-group">
                <select 
                  value={item.product_id} 
                  onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                  required
                >
                  <option value="">-- SP --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <input 
                  type="number" 
                  placeholder="SL" 
                  value={item.quantity} 
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <input 
                  type="number" 
                  placeholder="Giá" 
                  value={item.price} 
                  onChange={(e) => updateItem(idx, 'price', e.target.value)} 
                />
              </div>
              {idx > 0 && (
                <button type="button" className="btn-remove" onClick={() => removeItemField(idx)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className="btn-add-item" onClick={addItemField}>
            <i className="fas fa-plus"></i> Thêm Dòng
          </button>
        </div>

        <button type="submit" className="btn-primary">
          <i className="fas fa-check"></i> HOÀN TẤT ĐƠN HÀNG
        </button>
      </form>
    </div>
  );
};

export default Create;
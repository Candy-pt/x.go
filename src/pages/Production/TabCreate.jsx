import React from 'react';

const TabCreate = ({ form, setForm, saleOrders, onSubmit }) => {
  return (
    <div className="prod-tab-content fade-in">
      <h3>Lập Lệnh Sản Xuất</h3>
      <form onSubmit={onSubmit} className="prod-form">
        <div className="form-row">
          <div className="form-group">
            <label>Đơn Hàng *</label>
            <select 
              value={form.sale_order_id}
              onChange={(e) => setForm({...form, sale_order_id: e.target.value})}
              required
            >
              <option value="">-- Chọn đơn hàng --</option>
              {saleOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').map(o => (
                <option key={o.id} value={o.id}>{o.code} - {o.customer?.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Ngày Bắt Đầu *</label>
            <input 
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({...form, start_date: e.target.value})}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Ghi Chú</label>
          <textarea 
            value={form.note}
            onChange={(e) => setForm({...form, note: e.target.value})}
            placeholder="Nhập ghi chú"
            rows="3"
          ></textarea>
        </div>
        <button type="submit" className="btn-primary">✓ Tạo Lệnh</button>
      </form>
    </div>
  );
};

export default TabCreate;
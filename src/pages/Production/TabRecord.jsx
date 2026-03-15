import React from 'react';

const TabRecord = ({ form, orders, batches, products, onUpdateOutput, onAddOutput, onRemoveOutput, onSubmit, calculateWastage, setForm }) => {
  return (
    <div className="prod-tab-content fade-in">
      <h3>🔨 Ghi Nhận Mẻ Sản Xuất</h3>
      <form onSubmit={onSubmit} className="prod-form">
        <div className="form-section">
          <h4>📥 ĐẦU VÀO (Nguyên Liệu)</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Lệnh Sản Xuất *</label>
              <select 
                value={form.production_order_id}
                onChange={(e) => setForm({...form, production_order_id: e.target.value})}
                required
              >
                <option value="">-- Chọn lệnh SX --</option>
                {orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').map(o => (
                  <option key={o.id} value={o.id}>{o.code}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Lô Gỗ Nguyên Liệu (FIFO) *</label>
              <select 
                value={form.raw_batch_id}
                onChange={(e) => setForm({...form, raw_batch_id: e.target.value})}
                required
              >
                <option value="">-- Chọn lô --</option>
                {batches.filter(b => b.current_stock > 0).map(b => (
                  <option key={b.id} value={b.id}>{b.batch_code} - Tồn: {b.current_stock}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Số Lượng Tiêu Thụ *</label>
              <input 
                type="number" step="0.01"
                value={form.raw_qty_used}
                onChange={(e) => setForm({...form, raw_qty_used: e.target.value})}
                placeholder="m³" required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>📤 ĐẦU RA (Thành Phẩm)</h4>
          {form.outputs.map((output, idx) => (
            <div key={idx} className="form-row">
              <div className="form-group">
                <label>{idx === 0 ? 'Sản Phẩm *' : 'Sản Phẩm'}</label>
                <select value={output.product_id} onChange={(e) => onUpdateOutput(idx, 'product_id', e.target.value)}>
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.filter(p => p.product_type !== 'RAW').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{idx === 0 ? 'Số Lượng *' : 'Số Lượng'}</label>
                <input type="number" step="0.01" value={output.quantity} onChange={(e) => onUpdateOutput(idx, 'quantity', e.target.value)} placeholder="Số lượng" />
              </div>
              {idx > 0 && <button type="button" className="btn-remove" onClick={() => onRemoveOutput(idx)}>✕</button>}
            </div>
          ))}
          <button type="button" className="btn-add-output" onClick={onAddOutput}>Thêm Sản Phẩm</button>
        </div>

        <div className="wastage-preview">
          <p>📊 Hao Hụt Dự Kiến: <strong>{calculateWastage(form.raw_qty_used, form.outputs)}%</strong></p>
        </div>
        <button type="submit" className="btn-primary">✓ Ghi Nhận Mẻ</button>
      </form>
    </div>
  );
};

export default TabRecord;
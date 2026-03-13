import { useEffect, useState } from 'react';
import api from '../../services/api';
import './ProductionManagement.css';

const ProductionManagement = () => {
  const [activeTab, setActiveTab] = useState('ORDERS');
  const [orders, setOrders] = useState([]);
  const [saleOrders, setSaleOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho tab WASTAGE
  const [wastageOrders, setWastageOrders] = useState([]);
  const [averageWastage, setAverageWastage] = useState(0);
  const [wastageLoading, setWastageLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({ sale_order_id: '', start_date: '', note: '' });
  const [recordForm, setRecordForm] = useState({ 
    production_order_id: '', 
    raw_batch_id: '', 
    raw_qty_used: '', 
    outputs: [{ product_id: '', quantity: '' }],
    note: ''
  });
  const [wastageQuery, setWastageQuery] = useState({ batch_id: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, saleOrdersRes, batchesRes, productsRes] = await Promise.all([
        api.get('production/orders/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('sales/orders/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('inventory/batches/stock_report/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('products/?page_size=100').catch(() => ({ data: { results: [] } })),
      ]);

      setOrders(ordersRes.data.results || ordersRes.data || []);
      setSaleOrders(saleOrdersRes.data.results || saleOrdersRes.data || []);
      setBatches(batchesRes.data.results || batchesRes.data || []);
      setProducts(productsRes.data.results || productsRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        sale_order: Number(createForm.sale_order_id),
        start_date: createForm.start_date,
        note: createForm.note,
        status: 'PLANNED',
      };

      console.log("Dữ liệu gửi lên (không có code):", dataToSend);

      await api.post('production/orders/', dataToSend);
      alert('Tạo lệnh thành công!');
      fetchAllData();
      setActiveTab('ORDERS');
      setCreateForm({ sale_order_id: '', start_date: '', note: '' }); // reset form
    } catch (err) {
      console.error('Lỗi chi tiết:', err.response?.data);
      alert('Lỗi: ' + JSON.stringify(err.response?.data || 'Không xác định'));
    }
  };

  const handleDeleteOrder = (orderId, orderCode) => {
    if (window.confirm(`Bạn có chắc muốn xóa lệnh sản xuất ${orderCode || 'này'} không?`)) {
      api
        .delete(`production/orders/${orderId}/`)
        .then(() => {
          alert('Xóa lệnh sản xuất thành công!');
          fetchAllData();
        })
        .catch((err) => {
          console.error('Lỗi khi xóa:', err.response?.data);
          alert('Lỗi khi xóa: ' + (err.response?.data?.detail || 'Không thể xóa lệnh này'));
        });
    }
  };

  const handleRecordRun = async (e) => {
    e.preventDefault();

    try {
      const formattedOutputs = recordForm.outputs
        .filter(o => o.product_id && o.quantity && o.quantity.trim() !== '')
        .map(o => ({
          product: Number(o.product_id),
          quantity: parseFloat(o.quantity)
        }));

      if (formattedOutputs.length === 0) {
        alert("Vui lòng nhập ít nhất một sản phẩm đầu ra hợp lệ!");
        return;
      }

      const dataToSend = {
        production_order: Number(recordForm.production_order_id),
        raw_batch: Number(recordForm.raw_batch_id),
        raw_qty_used: parseFloat(recordForm.raw_qty_used),
        outputs: formattedOutputs,
        note: recordForm.note,
      };

      console.log("Dữ liệu chuẩn hóa gửi lên Server:", dataToSend);
      await api.post('production/runs/', dataToSend);
      alert("Ghi nhận mẻ xẻ thành công!");
      
      setRecordForm({ 
        production_order_id: '', 
        raw_batch_id: '', 
        raw_qty_used: '', 
        outputs: [{ product_id: '', quantity: '' }],
        note: ''
      });
      fetchAllData();
    } catch (err) {
      console.error('Chi tiết lỗi từ Backend:', err.response?.data);
      alert("Lỗi: " + (JSON.stringify(err.response?.data) || 'Không thể ghi nhận mẻ xẻ'));
    }
  };


  // Hàm tính hao hụt (đã khôi phục)
  const calculateWastage = (rawQty, outputs) => {
    const totalOutput = outputs.reduce((sum, o) => sum + (parseFloat(o.quantity) || 0), 0);
    if (rawQty <= 0) return 0;
    return (((rawQty - totalOutput) / rawQty) * 100).toFixed(2);
  };

  // Hàm fetch dữ liệu hao hụt (đã sửa để an toàn hơn)
  const fetchWastageData = async () => {
    setWastageLoading(true);
    try {
      const res = await api.get('production/orders/?page_size=100&status=COMPLETED');
      const completedOrders = (res.data.results || res.data || []).filter(
        order => order.status === 'COMPLETED' && typeof order.wastage_percent === 'number'
      );

      setWastageOrders(completedOrders);

      if (completedOrders.length > 0) {
        const total = completedOrders.reduce((sum, order) => sum + (order.wastage_percent || 0), 0);
        const avg = (total / completedOrders.length).toFixed(2);
        setAverageWastage(avg);
      } else {
        setAverageWastage(0);
      }
    } catch (err) {
      console.error('Lỗi fetch dữ liệu hao hụt:', err);
      setWastageOrders([]);
      setAverageWastage(0);
    } finally {
      setWastageLoading(false);
    }
  };

  // Gọi fetch khi tab thay đổi
  useEffect(() => {
    fetchAllData();
    if (activeTab === 'WASTAGE') {
      fetchWastageData();
    }
  }, [activeTab]);

  const addOutputField = () => {
    setRecordForm({
      ...recordForm,
      outputs: [...recordForm.outputs, { product_id: '', quantity: '' }]
    });
  };

  const removeOutputField = (idx) => {
    const newOutputs = recordForm.outputs.filter((_, i) => i !== idx);
    setRecordForm({ ...recordForm, outputs: newOutputs });
  };

  const updateOutput = (idx, field, value) => {
    const newOutputs = [...recordForm.outputs];
    newOutputs[idx][field] = value;
    setRecordForm({ ...recordForm, outputs: newOutputs });
  };


  return (
    <div className="production-container">
      <div className="production-tabs">
        <button className={`prod-tab-btn ${activeTab === 'ORDERS' ? 'active' : ''}`} onClick={() => setActiveTab('ORDERS')}>
          <i className="fas fa-clipboard-list" style={{ marginRight: 8 }}></i> Lệnh SX
        </button>
        <button className={`prod-tab-btn ${activeTab === 'CREATE' ? 'active' : ''}`} onClick={() => setActiveTab('CREATE')}>
          <i className="fas fa-plus" style={{ marginRight: 8 }}></i> Tạo Lệnh
        </button>
        <button className={`prod-tab-btn ${activeTab === 'RECORD' ? 'active' : ''}`} onClick={() => setActiveTab('RECORD')}>
          <i className="fas fa-hammer" style={{ marginRight: 8 }}></i> Ghi Nhận Mẻ
        </button>
        <button className={`prod-tab-btn ${activeTab === 'WASTAGE' ? 'active' : ''}`} onClick={() => setActiveTab('WASTAGE')}>
          <i className="fas fa-chart-bar" style={{ marginRight: 8 }}></i> Tra Hao Hụt
        </button>
      </div>

      {/* tab thứ nhất  */}
      {activeTab === 'ORDERS' && (
        <div className="prod-tab-content fade-in">
          <h3><i className="fas fa-clipboard-list" style={{ marginRight: 8 }}></i> Danh Sách Lệnh Sản Xuất</h3>
          
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : orders.length > 0 ? (
            <div className="table-responsive">
              <table className="prod-table">
                <thead>
                  <tr>
                    <th>Mã Lệnh</th>
                    <th>Đơn Hàng</th>
                    <th>Ngày Bắt Đầu</th>
                    <th>Trạng Thái</th>
                    <th>Ghi Chú</th>
                    <th>Thao tác</th>  {/* Thêm cột mới */}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td><strong>{order.code}</strong></td>
                      <td>{order.sale_order?.code || 'N/A'}</td>
                      <td>{new Date(order.start_date).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                          {order.status === 'PLANNED' && (<><i className="fas fa-calendar-alt" style={{ marginRight: 6 }}></i>Lên kế hoạch</>)}
                          {order.status === 'IN_PROGRESS' && (<><i className="fas fa-cog" style={{ marginRight: 6 }}></i>Đang chạy</>)}
                          {order.status === 'COMPLETED' && (<><i className="fas fa-check" style={{ marginRight: 6 }}></i>Hoàn thành</>)}
                          {order.status === 'CANCELLED' && (<><i className="fas fa-times" style={{ marginRight: 6 }}></i>Hủy</>)}
                        </span>
                      </td>
                      <td>{order.note || '-'}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteOrder(order.id, order.code)}
                          title="Xóa lệnh sản xuất"
                        >
                          <i className="fas fa-trash-alt"></i> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">Chưa có lệnh sản xuất nào</p>
          )}
        </div>
      )}

      {/* Tab 2: Tạo lệnh SX */}
      {activeTab === 'CREATE' && (
        <div className="prod-tab-content fade-in">
          <h3> Lập Lệnh Sản Xuất</h3>
          <form onSubmit={handleCreateOrder} className="prod-form">
            <div className="form-row">
              <div className="form-group">
                <label>Đơn Hàng *</label>
                <select 
                  value={createForm.sale_order_id}
                  onChange={(e) => setCreateForm({...createForm, sale_order_id: e.target.value})}
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
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm({...createForm, start_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <textarea 
                value={createForm.note}
                onChange={(e) => setCreateForm({...createForm, note: e.target.value})}
                placeholder="Nhập ghi chú"
                rows="3"
              ></textarea>
            </div>

            <button type="submit" className="btn-primary">✓ Tạo Lệnh</button>
          </form>
        </div>
      )}

      {/* Tab 3: Ghi nhận mẻ SX */}
      {activeTab === 'RECORD' && (
        <div className="prod-tab-content fade-in">
          <h3>🔨 Ghi Nhận Mẻ Sản Xuất</h3>
          <form onSubmit={handleRecordRun} className="prod-form">
            <div className="form-section">
              <h4>📥 ĐẦU VÀO (Nguyên Liệu)</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Lệnh Sản Xuất *</label>
                  <select 
                    value={recordForm.production_order_id}
                    onChange={(e) => setRecordForm({...recordForm, production_order_id: e.target.value})}
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
                    value={recordForm.raw_batch_id}
                    onChange={(e) => setRecordForm({...recordForm, raw_batch_id: e.target.value})}
                    required
                  >
                    <option value="">-- Chọn lô --</option>
                    {batches.filter(b => b.current_stock > 0).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.batch_code} - Tồn: {b.current_stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Số Lượng Tiêu Thụ *</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={recordForm.raw_qty_used}
                    onChange={(e) => setRecordForm({...recordForm, raw_qty_used: e.target.value})}
                    placeholder="m³"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>📤 ĐẦU RA (Thành Phẩm)</h4>
              {recordForm.outputs.map((output, idx) => (
                <div key={idx} className="form-row">
                  <div className="form-group">
                    <label>{idx === 0 ? 'Sản Phẩm *' : 'Sản Phẩm'}</label>
                    <select 
                      value={output.product_id}
                      onChange={(e) => updateOutput(idx, 'product_id', e.target.value)}
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {products.filter(p => p.product_type !== 'RAW').map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{idx === 0 ? 'Số Lượng *' : 'Số Lượng'}</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={output.quantity}
                      onChange={(e) => updateOutput(idx, 'quantity', e.target.value)}
                      placeholder="Số lượng"
                    />
                  </div>

                  {idx > 0 && (
                    <button 
                      type="button"
                      className="btn-remove"
                      onClick={() => removeOutputField(idx)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button 
                type="button"
                className="btn-add-output"
                onClick={addOutputField}
              >
                Thêm Sản Phẩm
              </button>
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <textarea 
                value={recordForm.note}
                onChange={(e) => setRecordForm({...recordForm, note: e.target.value})}
                placeholder="Ghi chú"
                rows="2"
              ></textarea>
            </div>

            <div className="wastage-preview">
              <p>📊 Hao Hụt Dự Kiến: <strong>{calculateWastage(recordForm.raw_qty_used, recordForm.outputs)}%</strong></p>
            </div>

            <button type="submit" className="btn-primary">✓ Ghi Nhận Mẻ</button>
          </form>
        </div>
      )}

      {/* Tab 4: Tra cứu hao hụt */}
     
      {activeTab === 'WASTAGE' && (
      <div className="prod-tab-content fade-in">
        <h3><i className="fas fa-chart-bar" style={{ marginRight: 8 }}></i> Tra Cứu Tỷ Lệ Hao Hụt</h3>
        
        {wastageLoading ? (
          <div className="loading">Đang tải dữ liệu hao hụt...</div>
        ) : wastageOrders.length > 0 ? (
          <>
            <div className="wastage-results">
              <p className="info">Danh sách lệnh sản xuất đã hoàn thành và tỷ lệ hao hụt</p>
              
              <div className="wastage-chart">
                {wastageOrders.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="wastage-item"
                    style={{
                      borderLeft: order.wastage_alert 
                        ? '4px solid #dc3545' 
                        : '4px solid #28a745'
                    }}
                  >
                    <div className="wastage-info">
                      <strong>Mã lệnh: {order.code}</strong>
                      <span>Đơn hàng: {order.sale_order?.code || 'N/A'}</span>
                      <span>Ngày hoàn thành: {order.end_date 
                        ? new Date(order.end_date).toLocaleDateString('vi-VN') 
                        : 'N/A'}</span>
                    </div>
                    <div className="wastage-value">
                      <span className="wastage-percent" 
                        style={{ color: order.wastage_alert ? '#dc3545' : '#28a745' }}>
                        {order.wastage_percent}%
                      </span>
                      {order.wastage_alert && (
                        <span className="alert-badge">Vượt mục tiêu!</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="average">
                📊 Trung bình hao hụt: <strong>{averageWastage}%</strong> 
                (Mục tiêu: 15%)
                {parseFloat(averageWastage) > 15 && (
                  <span style={{ color: '#dc3545', marginLeft: 10 }}>⚠ Vượt mục tiêu</span>
                )}
              </p>
            </div>
          </>
        ) : (
          <p className="no-data">Chưa có lệnh sản xuất nào hoàn thành để tính hao hụt</p>
        )}
      </div>
    )}
    </div>
  );
};

export default ProductionManagement;

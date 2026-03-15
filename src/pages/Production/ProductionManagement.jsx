
  // Form states
import { useEffect, useState } from 'react';
import api from '../../services/api';
import './ProductionManagement.css';

// Import các sub-components
import TabOrders from './TabOrders';
import TabCreate from './TabCreate';
import TabRecord from './TabRecord';
import TabWastage from './TabWastage';

const ProductionManagement = () => {
  const [activeTab, setActiveTab] = useState('ORDERS');
  const [orders, setOrders] = useState([]);
  const [saleOrders, setSaleOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [wastageOrders, setWastageOrders] = useState([]);
  const [averageWastage, setAverageWastage] = useState(0);
  const [wastageLoading, setWastageLoading] = useState(false);

  const [createForm, setCreateForm] = useState({ sale_order_id: '', start_date: '', note: '' });
  const [recordForm, setRecordForm] = useState({ 
    production_order_id: '', raw_batch_id: '', raw_qty_used: '', 
    outputs: [{ product_id: '', quantity: '' }], note: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'WASTAGE') fetchWastageData();
  }, [activeTab]);

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
    } catch (err) { console.error('Lỗi tải dữ liệu:', err); }
    finally { setLoading(false); }
  };

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
        setAverageWastage((total / completedOrders.length).toFixed(2));
      } else { setAverageWastage(0); }
    } catch (err) { console.error('Lỗi fetch dữ liệu hao hụt:', err); }
    finally { setWastageLoading(false); }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.post('production/orders/', {
        sale_order: Number(createForm.sale_order_id),
        start_date: createForm.start_date,
        note: createForm.note,
        status: 'PLANNED',
      });
      alert('Tạo lệnh thành công!');
      fetchAllData();
      setActiveTab('ORDERS');
      setCreateForm({ sale_order_id: '', start_date: '', note: '' });
    } catch (err) { alert('Lỗi: ' + JSON.stringify(err.response?.data)); }
  };

  const handleDeleteOrder = (orderId, orderCode) => {
    if (window.confirm(`Bạn có chắc muốn xóa lệnh sản xuất ${orderCode || 'này'} không?`)) {
      api.delete(`production/orders/${orderId}/`)
        .then(() => { alert('Xóa thành công!'); fetchAllData(); })
        .catch(err => alert('Lỗi khi xóa'));
    }
  };

  const handleRecordRun = async (e) => {
    e.preventDefault();
    try {
      const formattedOutputs = recordForm.outputs
        .filter(o => o.product_id && o.quantity)
        .map(o => ({ product: Number(o.product_id), quantity: parseFloat(o.quantity) }));
      
      await api.post('production/runs/', {
        production_order: Number(recordForm.production_order_id),
        raw_batch: Number(recordForm.raw_batch_id),
        raw_qty_used: parseFloat(recordForm.raw_qty_used),
        outputs: formattedOutputs,
        note: recordForm.note,
      });
      alert("Ghi nhận thành công!");
      setRecordForm({ production_order_id: '', raw_batch_id: '', raw_qty_used: '', outputs: [{ product_id: '', quantity: '' }], note: '' });
      fetchAllData();
    } catch (err) { alert("Lỗi ghi nhận mẻ"); }
  };

  const calculateWastage = (rawQty, outputs) => {
    const totalOutput = outputs.reduce((sum, o) => sum + (parseFloat(o.quantity) || 0), 0);
    return rawQty <= 0 ? 0 : (((rawQty - totalOutput) / rawQty) * 100).toFixed(2);
  };

  // 2. Hàm mở Modal Sửa
  const handleEditClick = (order) => {
    setSelectedOrder({ ...order }); // Clone dữ liệu để tránh tham chiếu trực tiếp
    setIsEditModalOpen(true);
  };

  // 3. Hàm mở Modal Chi tiết
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // 4. Hàm Lưu sau khi sửa (API Update)
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.put(`production/orders/${selectedOrder.id}/`, {
        sale_order: selectedOrder.sale_order?.id,
        start_date: selectedOrder.start_date,
        note: selectedOrder.note,
        status: selectedOrder.status, // Cho phép sửa cả trạng thái ở đây
      });
      alert('Cập nhật lệnh thành công!');
      setIsEditModalOpen(false);
      fetchAllData(); // Refresh danh sách
    } catch (err) {
      alert('Lỗi cập nhật: ' + JSON.stringify(err.response?.data));
    }
  };

  return (
    <div className="production-container">
      <div className="production-tabs">
        {['ORDERS', 'CREATE', 'RECORD', 'WASTAGE'].map(tab => (
          <button 
            key={tab}
            className={`prod-tab-btn ${activeTab === tab ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab)}
          >
            <i className={`fas fa-${tab === 'ORDERS' ? 'clipboard-list' : tab === 'CREATE' ? 'plus' : tab === 'RECORD' ? 'hammer' : 'chart-bar'}`} style={{ marginRight: 8 }}></i>
            {tab === 'ORDERS' ? 'Lệnh SX' : tab === 'CREATE' ? 'Tạo Lệnh' : tab === 'RECORD' ? 'Ghi Nhận Mẻ' : 'Tra Hao Hụt'}
          </button>
        ))}
      </div>

      {activeTab === 'ORDERS' && (
        <TabOrders 
          loading={loading} 
          orders={orders} 
          onDelete={handleDeleteOrder}
          onEdit={handleEditClick}      // Truyền hàm xuống
          onViewDetail={handleViewDetail} // Truyền hàm xuống
        /> )}
      {activeTab === 'CREATE' && <TabCreate form={createForm} setForm={setCreateForm} saleOrders={saleOrders} onSubmit={handleCreateOrder} />}
      {activeTab === 'RECORD' && (
        <TabRecord 
          form={recordForm} setForm={setRecordForm} orders={orders} batches={batches} products={products}
          onAddOutput={() => setRecordForm({...recordForm, outputs: [...recordForm.outputs, { product_id: '', quantity: '' }]})}
          onRemoveOutput={(idx) => setRecordForm({...recordForm, outputs: recordForm.outputs.filter((_, i) => i !== idx)})}
          onUpdateOutput={(idx, field, val) => {
            const newOuts = [...recordForm.outputs]; newOuts[idx][field] = val;
            setRecordForm({...recordForm, outputs: newOuts});
          }}
          calculateWastage={calculateWastage} onSubmit={handleRecordRun}
        />
      )}
      {activeTab === 'WASTAGE' && <TabWastage loading={wastageLoading} orders={wastageOrders} averageWastage={averageWastage} />}
     
      {isEditModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content fade-in">
            <div className="modal-header">
              <h3>Sửa Lệnh Sản Xuất: {selectedOrder.code}</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateOrder} className="prod-form">
              <div className="form-group">
                <label>Trạng Thái</label>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value})}
                >
                  <option value="PLANNED">Lên kế hoạch</option>
                  <option value="IN_PROGRESS">Đang chạy</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ngày Bắt Đầu</label>
                <input 
                  type="date" 
                  value={selectedOrder.start_date}
                  onChange={(e) => setSelectedOrder({...selectedOrder, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Ghi Chú</label>
                <textarea 
                  rows="3"
                  value={selectedOrder.note || ''}
                  onChange={(e) => setSelectedOrder({...selectedOrder, note: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CHI TIẾT --- */}
      {isDetailModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content detail-modal fade-in">
            <div className="modal-header">
              <h3>Chi Tiết Lệnh: {selectedOrder.code}</h3>
              <button className="close-btn" onClick={() => setIsDetailModalOpen(false)}>&times;</button>
            </div>
            <div className="detail-body">
              <div className="detail-row"><span>Đơn hàng:</span> <strong>{selectedOrder.sale_order?.code}</strong></div>
              <div className="detail-row"><span>Khách hàng:</span> {selectedOrder.sale_order?.customer?.name || 'N/A'}</div>
              <div className="detail-row"><span>Ngày tạo:</span> {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</div>
              <div className="detail-row"><span>Trạng thái:</span> <span className={`status-badge status-${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span></div>
              <hr />
              <h4>Lịch sử mẻ xẻ (Runs)</h4>
              {/* Đây là nơi bạn có thể map danh sách runs nếu API trả về trong object order */}
              <p className="no-data-sm">Chức năng xem mẻ xẻ chi tiết đang được cập nhật...</p>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setIsDetailModalOpen(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionManagement;

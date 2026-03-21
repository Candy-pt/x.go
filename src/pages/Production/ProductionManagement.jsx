import { useEffect, useState } from 'react';
import api from '../../services/api';
import './ProductionManagement.css';

// Import các sub-components
import TabOrders from './TabOrders';
import TabCreate from './TabCreate';
import TabRecord from './TabRecord';
import TabWastage from './TabWastage';
import Tabthongke from './Tabthongke'; 

const ProductionManagement = () => {
  const [activeTab, setActiveTab] = useState('ORDERS');
  const [orders, setOrders] = useState([]);
  const [saleOrders, setSaleOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [machines, setMachines] = useState([
    { id: 1, name: "Máy Xẻ Nằm 01", status: "active", today_outputs: [] },
    { id: 2, name: "Máy Xẻ Đứng 02", status: "inactive", today_outputs: [] }
  ]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [wastageOrders, setWastageOrders] = useState([]);
  const [averageWastage, setAverageWastage] = useState(0);
  const [wastageLoading, setWastageLoading] = useState(false);

  const [createForm, setCreateForm] = useState({ sale_order_id: '', start_date: '', note: '' });
  const [recordForm, setRecordForm] = useState({ 
    production_order_id: '', raw_batch_id: '', raw_qty_used: '', 
    machine_id: '', // Thêm máy vào form mẻ xẻ
    outputs: [{ product_id: '', quantity: '' }], note: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'WASTAGE' || activeTab === 'INSIGHTS') fetchWastageData();
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
        machine: recordForm.machine_id, // Gửi ID máy xuống Backend
        outputs: formattedOutputs,
        note: recordForm.note,
      });
      alert("Ghi nhận thành công!");
      setRecordForm({ production_order_id: '', raw_batch_id: '', raw_qty_used: '', machine_id: '', outputs: [{ product_id: '', quantity: '' }], note: '' });
      fetchAllData();
    } catch (err) { alert("Lỗi ghi nhận mẻ"); }
  };

  const calculateWastage = (rawQty, outputs) => {
    const totalOutput = outputs.reduce((sum, o) => sum + (parseFloat(o.quantity) || 0), 0);
    return rawQty <= 0 ? 0 : (((rawQty - totalOutput) / rawQty) * 100).toFixed(2);
  };

  const handleEditClick = (order) => {
    setSelectedOrder({ ...order }); 
    setIsEditModalOpen(true);
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.put(`production/orders/${selectedOrder.id}/`, {
        sale_order: selectedOrder.sale_order?.id,
        start_date: selectedOrder.start_date,
        note: selectedOrder.note,
        status: selectedOrder.status, 
      });
      alert('Cập nhật lệnh thành công!');
      setIsEditModalOpen(false);
      fetchAllData(); 
    } catch (err) {
      alert('Lỗi cập nhật: ' + JSON.stringify(err.response?.data));
    }
  };

  return (
    <div className="production-container">
      <div className="production-tabs">
        {[
          { id: 'ORDERS', icon: 'clipboard-list', label: 'Lệnh SX' },
          { id: 'CREATE', icon: 'plus', label: 'Tạo Lệnh' },
          { id: 'RECORD', icon: 'hammer', label: 'Ghi Nhận Mẻ' },
          { id: 'WASTAGE', icon: 'chart-bar', label: 'Hao Hụt' },
          { id: 'INSIGHTS', icon: 'chart-pie', label: 'Thống Kê' } 
        ].map(tab => (
          <button 
            key={tab.id}
            className={`prod-tab-btn ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fas fa-${tab.icon}`} style={{ marginRight: 8 }}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-render-area">
        {activeTab === 'ORDERS' && (
          <TabOrders 
            loading={loading} orders={orders} 
            onDelete={handleDeleteOrder} onEdit={handleEditClick} onViewDetail={handleViewDetail} 
          />
        )}
        
        {activeTab === 'CREATE' && <TabCreate form={createForm} setForm={setCreateForm} saleOrders={saleOrders} onSubmit={handleCreateOrder} />}
        
        {activeTab === 'RECORD' && (
          <TabRecord 
            form={recordForm} setForm={setRecordForm} orders={orders} batches={batches} products={products}
            machines={machines} // Truyền máy vào để chọn trong form
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
        
        {activeTab === 'INSIGHTS' && <Tabthongke orders={orders} machines={machines} />}
      </div>

      {/* --- MODAL SỬA --- */}
      {isEditModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content fade-in">
            <div className="modal-header">
              <h3>Sửa Lệnh: {selectedOrder.code}</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateOrder} className="prod-form">
              <div className="form-group">
                <label>Trạng Thái</label>
                <select value={selectedOrder.status} onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value})}>
                  <option value="PLANNED">Lên kế hoạch</option>
                  <option value="IN_PROGRESS">Đang chạy</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ngày Bắt Đầu</label>
                <input type="date" value={selectedOrder.start_date} onChange={(e) => setSelectedOrder({...selectedOrder, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Ghi Chú</label>
                <textarea rows="3" value={selectedOrder.note || ''} onChange={(e) => setSelectedOrder({...selectedOrder, note: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu</button>
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
              <div className="detail-row"><span>Đơn hàng:</span> <strong>{selectedOrder.sale_order?.code || 'N/A'}</strong></div>
              <div className="detail-row"><span>Trạng thái:</span> <span className={`status-badge status-${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span></div>
              <hr />
              <h4>Sản lượng đầu ra (Tổng các mẻ)</h4>
              <p>Mục này thống kê từ <code>total_output</code> của Backend: <strong>{selectedOrder.total_output || 0} SP</strong></p>
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
import { useEffect, useState } from 'react';
import api from '../../services/api';
import Notification from '../../components/Notification';
import './InventoryManagement.css';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('BATCHES');
  const [batches, setBatches] = useState([]);
  const [lowStockBatches, setLowStockBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchTransactions, setBatchTransactions] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txFilter, setTxFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({ supplier_id: '', product_id: '', quantity: '', price: '', note: '' });
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [exportData, setExportData] = useState({ batch_id: '', quantity: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [batchRes, productsRes, suppliersRes] = await Promise.all([
        api.get('inventory/batches/stock_report/?product_type=RAW').catch(() => ({ data: { results: [] } })),
        api.get('products/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('partners/?partner_type=SUPPLIER&page_size=100').catch(() => ({ data: { results: [] } })),
      ]);

      setBatches(batchRes.data.results || batchRes.data || []);
      setProducts(productsRes.data.results || productsRes.data || []);
      setSuppliers(suppliersRes.data.results || suppliersRes.data || []);
      
      // Filter low stock
      const lowStock = (batchRes.data.results || batchRes.data || []).filter(b => b.current_stock < 50);
      setLowStockBatches(lowStock);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    // Basic client-side validation
    if (!formData.product_id || !formData.supplier_id) {
      setNotification({ message: 'Vui lòng chọn nhà cung cấp và sản phẩm', type: 'error' });
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setNotification({ message: 'Số lượng phải lớn hơn 0', type: 'error' });
      return;
    }

    try {
      // Create batch and use the returned id
      const batchRes = await api.post('inventory/batches/', {
        batch_code: `LO-${Date.now()}`,
        product: formData.product_id,
        supplier: formData.supplier_id,
        note: formData.note,
      });

      const batchId = batchRes.data.id;

      // Create transaction (use 'batch' field expected by serializer)
      await api.post('inventory/transactions/', {
        batch: batchId,
        transaction_type: 'IMPORT',
        quantity: Number(formData.quantity),
        note: formData.note,
      });
      setFormData({ supplier_id: '', product_id: '', quantity: '', price: '', note: '' });
      setNotification({ message: 'Nhập kho thành công', type: 'success' });
      fetchAllData();
    } catch (err) {
      console.error('Lỗi nhập kho:', err);
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Lỗi khi nhập kho';
      setNotification({ message: msg, type: 'error' });
    }
  };

  const handleExport = async (e) => {
    e.preventDefault();
    // Validation
    const qty = Number(exportData.quantity);
    if (!exportData.batch_id) {
      setNotification({ message: 'Vui lòng chọn lô để xuất', type: 'error' });
      return;
    }
    if (!qty || qty <= 0) {
      setNotification({ message: 'Số lượng xuất phải lớn hơn 0', type: 'error' });
      return;
    }

    // check selected batch stock
    const batch = batches.find(b => String(b.id) === String(exportData.batch_id));
    if (batch && typeof batch.current_stock === 'number' && qty > batch.current_stock) {
      setNotification({ message: 'Số lượng xuất vượt quá tồn kho của lô', type: 'error' });
      return;
    }

    try {
      await api.post('inventory/transactions/', {
        batch: exportData.batch_id,
        transaction_type: 'EXPORT',
        quantity: parseFloat(recordForm.raw_qty_used),
        note: `Xuất cho mẻ sản xuất - Lệnh ${recordForm.production_order_id || 'N/A'}`,
      });
      console.log('Đã tự động xuất kho nguyên liệu');

      setExportData({ batch_id: '', quantity: '' });
      setNotification({ message: 'Xuất kho thành công', type: 'success' });
      fetchAllData();
      // refresh transactions if viewing
      if (activeTab === 'TRANSACTIONS') fetchTransactions();
    } catch (err) {
      console.error('Lỗi xuất kho:', err);
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Lỗi khi xuất kho';
      setNotification({ message: msg, type: 'error' });
    }
  };

  const openBatchDetails = async (batch) => {
    setSelectedBatch(batch);
    setShowBatchModal(true);
    setBatchTransactions([]);
    try {
      const res = await api.get(`inventory/transactions/?batch=${batch.id}&page_size=200`);
      const data = res.data.results || res.data || [];
      setBatchTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải giao dịch của lô:', err);
      setBatchTransactions([]);
    }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      let url = 'inventory/transactions/?page_size=200';
      if (txFilter !== 'ALL') url += `&transaction_type=${txFilter}`;
      const res = await api.get(url);
      const data = res.data.results || res.data || [];
      setTransactionsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải giao dịch:', err);
      setTransactionsList([]);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="inventory-container">
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}
      <div className="inventory-tabs">
        <button className={`inv-tab-btn ${activeTab === 'BATCHES' ? 'active' : ''}`} onClick={() => setActiveTab('BATCHES')}>
          <i className="fas fa-boxes" style={{ marginRight: 8 }}></i> Danh Sách Lô
        </button>
        <button className={`inv-tab-btn ${activeTab === 'IMPORT' ? 'active' : ''}`} onClick={() => setActiveTab('IMPORT')}>
          <i className="fas fa-download" style={{ marginRight: 8 }}></i> Nhập Kho
        </button>
        <button className={`inv-tab-btn ${activeTab === 'EXPORT' ? 'active' : ''}`} onClick={() => setActiveTab('EXPORT')}>
          <i className="fas fa-upload" style={{ marginRight: 8 }}></i> Xuất Kho
        </button>
        <button className={`inv-tab-btn ${activeTab === 'ALERTS' ? 'active' : ''}`} onClick={() => setActiveTab('ALERTS')}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i> Cảnh Báo ({lowStockBatches.length})
        </button>
        <button className={`inv-tab-btn ${activeTab === 'TRANSACTIONS' ? 'active' : ''}`} onClick={() => { setActiveTab('TRANSACTIONS'); fetchTransactions(); }}>
          <i className="fas fa-exchange-alt" style={{ marginRight: 8 }}></i> Giao Dịch
        </button>
      </div>

      {/* Tab 1: Danh sách lô */}
      {activeTab === 'BATCHES' && (
        <div className="inv-tab-content fade-in">
          <h3><i className="fas fa-boxes" style={{ marginRight: 8 }}></i> Danh Sách Lô Hàng</h3>
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : batches.length > 0 ? (
            <div className="table-responsive">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Mã Lô</th>
                    <th>Sản Phẩm</th>
                    <th>Nhà Cung Cấp</th>
                    <th>Tồn Kho</th>
                    <th>Đơn Vị</th>
                    <th>Ngày Nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(batch => (
                    <tr key={batch.id} className="clickable-row" onClick={() => openBatchDetails(batch)} style={{cursor: 'pointer'}}>
                      <td><strong>{batch.batch_code}</strong></td>
                      <td>{batch.product_name}</td>
                      <td>{batch.supplier_name}</td>
                      <td className={batch.current_stock < 50 ? 'low-stock' : ''}>{batch.current_stock}</td>
                      <td>{batch.unit_name}</td>
                      <td>{new Date(batch.import_date).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-data">Chưa có lô hàng nào</p>
          )}
        </div>
      )}

      {/* Tab 2: Nhập kho */}
      {activeTab === 'IMPORT' && (
        <div className="inv-tab-content fade-in">
          <h3><i className="fas fa-download" style={{ marginRight: 8 }}></i> Nhập Kho Mới</h3>
          <form onSubmit={handleImport} className="inv-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nhà Cung Cấp *</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Sản Phẩm *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.product_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Số Lượng *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Nhập số lượng"
                  required
                />
              </div>

              <div className="form-group">
                <label>Đơn Giá (tùy chọn)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Nhập giá"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Ghi Chú</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Nhập ghi chú"
                rows="3"
              ></textarea>
            </div>

            <button type="submit" className="btn-primary"><i className="fas fa-check" style={{ marginRight: 8 }}></i> Nhập Kho</button>
          </form>
        </div>
      )}

      {/* Tab 3: Xuất kho */}
      {activeTab === 'EXPORT' && (
        <div className="inv-tab-content fade-in">
          <h3><i className="fas fa-upload" style={{ marginRight: 8 }}></i> Xuất Kho (FIFO)</h3>
          <form onSubmit={handleExport} className="inv-form">
            <p className="info-text">Hệ thống sẽ tự động xuất từ lô cũ nhất (FIFO)</p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Chọn Lô *</label>
                <select 
                  value={exportData.batch_id}
                  onChange={(e) => setExportData({...exportData, batch_id: e.target.value})}
                  required
                >
                  <option value="">-- Chọn lô --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batch_code} - {b.product_name} (Tồn: {b.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Số Lượng Xuất *</label>
                <input 
                  type="number"
                  step="0.01"
                  value={exportData.quantity}
                  onChange={(e) => setExportData({...exportData, quantity: e.target.value})}
                  placeholder="Nhập số lượng"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary"><i className="fas fa-check" style={{ marginRight: 8 }}></i> Xuất Kho</button>
          </form>
        </div>
      )}

      {/* Tab 4: Cảnh báo tồn kho thấp */}
      {activeTab === 'ALERTS' && (
        <div className="inv-tab-content fade-in">
          <h3><i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i> Cảnh Báo Tồn Kho Thấp (&lt; 50)</h3>
          {lowStockBatches.length > 0 ? (
            <div className="alerts-list">
              {lowStockBatches.map(batch => (
                <div key={batch.id} className="alert-card">
                  <div className="alert-header">
                    <span className="alert-code">{batch.batch_code}</span>
                    <span className="alert-badge">{batch.current_stock} {batch.unit_name}</span>
                  </div>
                  <p><strong>Sản phẩm:</strong> {batch.product_name}</p>
                  <p><strong>Nhà cung cấp:</strong> {batch.supplier_name}</p>
                  <p><strong>Ngày nhập:</strong> {new Date(batch.import_date).toLocaleDateString('vi-VN')}</p>
                  <button className="btn-import-now"><i className="fas fa-download" style={{ marginRight: 8 }}></i> Nhập Thêm Ngay</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-alerts"><i className="fas fa-check" style={{ marginRight: 8 }}></i> Tồn kho tất cả lô đều ổn định</p>
          )}
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="inv-tab-content fade-in">
          <h3><i className="fas fa-exchange-alt" style={{ marginRight: 8 }}></i> Lịch Sử Giao Dịch</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <div>
              <label>Loại:</label>
              <select value={txFilter} onChange={(e) => setTxFilter(e.target.value)} style={{ marginLeft: 8 }}>
                <option value="ALL">Tất cả</option>
                <option value="IMPORT">Nhập</option>
                <option value="EXPORT">Xuất</option>
                <option value="ADJUST">Điều chỉnh</option>
              </select>
            </div>
            <button className="btn-primary" onClick={fetchTransactions} disabled={txLoading}>{txLoading ? 'Đang tải...' : 'Tải giao dịch'}</button>
          </div>

          {txLoading ? (
            <div>Đang tải...</div>
          ) : transactionsList.length === 0 ? (
            <div>Không có giao dịch</div>
          ) : (
            <div className="table-responsive">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Batch</th>
                    <th>Sản phẩm</th>
                    <th>Loại</th>
                    <th>Số lượng</th>
                    <th>Ghi chú</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsList.map(tx => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{tx.batch_code || tx.batch?.batch_code || tx.batch}</td>
                      <td>{tx.product_name}</td>
                      <td>{tx.transaction_type}</td>
                      <td>{tx.quantity}</td>
                      <td>{tx.note}</td>
                      <td>{new Date(tx.date).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Batch detail modal */}
      {showBatchModal && selectedBatch && (
        <div className="modal-overlay">
          <div className="modal-content modern-form inventory-batch-modal" style={{ maxWidth: 900 }}>
            <h3>Chi tiết lô: {selectedBatch.batch_code}</h3>
            <div className="batch-meta" style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <div><strong>Sản phẩm:</strong> {selectedBatch.product_name}</div>
              <div><strong>Nhà cung cấp:</strong> {selectedBatch.supplier_name}</div>
              <div><strong>Tồn hiện tại:</strong> {selectedBatch.current_stock} {selectedBatch.unit_name}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Ghi chú:</strong> {selectedBatch.note || '-'}
            </div>

            <h4>Giao dịch liên quan</h4>
            <div className="transactions-scroll">
              {batchTransactions.length === 0 ? (
                <div>Không có giao dịch cho lô này.</div>
              ) : (
                <div className="table-responsive">
                  <table className="inv-table compact">
                    <thead>
                      <tr>
                        <th>Loại</th>
                        <th>Số lượng</th>
                        <th>Người thực hiện</th>
                        <th>Ngày</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchTransactions.map(tx => (
                        <tr key={tx.id}>
                          <td style={{width: '10%'}}>{tx.transaction_type}</td>
                          <td style={{width: '15%'}}>{tx.quantity}</td>
                          <td style={{width: '20%'}}>{tx.created_by || tx.created_by?.username || '-'}</td>
                          <td style={{width: '20%'}}>{new Date(tx.date).toLocaleString('vi-VN')}</td>
                          <td style={{width: '35%'}}>{tx.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="sub-tab-btn" onClick={() => setShowBatchModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;

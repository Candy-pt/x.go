import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import Notification from '../../components/Notification';
import './InventoryManagement.css';

// Hàm tiện ích format ngày thành YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('BATCHES');
  const [batches, setBatches] = useState([]);
  const [lowStockBatches, setLowStockBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchTransactions, setBatchTransactions] = useState([]);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({ supplier_id: '', product_id: '', quantity: '', price: '', note: '' });
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productStocks, setProductStocks] = useState([]); 
  const [exportData, setExportData] = useState({ batch_id: '', quantity: '',price: '', note: '', customer_name: '' });

  // STATE MỚI CHO TÌM KIẾM VÀ PHÂN TRANG GIAO DỊCH
  const [transactionsList, setTransactionsList] = useState([]); 
  const [txLoading, setTxLoading] = useState(false);
  const [txFilter, setTxFilter] = useState('Tất cả'); 
  const [searchProduct, setSearchProduct] = useState('');
  
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return formatDate(d);
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // ==========================================

  useEffect(() => {
    fetchAllData();
  }, []);

  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [batchRes, productsRes, suppliersRes] = await Promise.all([
        api.get('inventory/batches/stock_report/?page_size=500').catch(() => ({ data: { results: [] } })),
        api.get('products/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('partners/?partner_type=SUPPLIER&page_size=100').catch(() => ({ data: { results: [] } })),
      ]);

      const allBatches = batchRes.data.results || batchRes.data || [];
      setBatches(allBatches);
      setProducts(productsRes.data.results || productsRes.data || []);
      setSuppliers(suppliersRes.data.results || suppliersRes.data || []);
      
      // 2. LOGIC TÍNH TỔNG TỒN KHO THEO SẢN PHẨM
      const productStockMap = {};

      allBatches.forEach(batch => {
        // Lấy số lượng: dự phòng cả current_stock lẫn current_qty
        const qty = Number(batch.current_stock || batch.current_qty || 0);
        
        // Lấy ID: dự phòng trường hợp API trả về cấu trúc khác nhau
        const prodId = batch.product_id || batch.product?.id || batch.product || batch.product_name; 

        if (qty > 0) { // Chỉ gom các lô có số lượng > 0
          if (!productStockMap[prodId]) {
            productStockMap[prodId] = {
              product_id: prodId,
              product_name: batch.product_name || "Chưa có tên",
              unit_name: batch.unit_name || '',
              total_stock: 0,
            };
          }
          productStockMap[prodId].total_stock += qty;
        }
      });

      const aggregatedStock = Object.values(productStockMap);
      
      // Đổ dữ liệu vào State
      setProductStocks(aggregatedStock); 

      // Logic cảnh báo tồn kho (giữ nguyên)
      const lowStockProducts = aggregatedStock.filter(p => p.total_stock < 50);
      setLowStockBatches(lowStockProducts);

    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.supplier_id) {
      setNotification({ message: 'Vui lòng chọn nhà cung cấp và sản phẩm', type: 'error' });
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setNotification({ message: 'Số lượng phải lớn hơn 0', type: 'error' });
      return;
    }

    try {
      const batchRes = await api.post('inventory/batches/', {
        batch_code: `LO-${Date.now()}`,
        product: formData.product_id,
        supplier: formData.supplier_id,
        note: formData.note,
      });

      const batchId = batchRes.data.id;

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
    
    let remainingQty = Number(exportData.quantity); // Số lượng cần xuất
    const selectedProductId = exportData.product_id;
    
    // 1. Kiểm tra đầu vào
    if (!selectedProductId) {
      setNotification({ message: 'Vui lòng chọn sản phẩm để xuất', type: 'error' });
      return;
    }
    if (!remainingQty || remainingQty <= 0) {
      setNotification({ message: 'Số lượng xuất phải lớn hơn 0', type: 'error' });
      return;
    }

    // 2. KIỂM TRA TỒN KHO DỰA VÀO DROPDOWN 
    const selectedProductFromDropdown = productStocks.find(p => String(p.product_id) === String(selectedProductId));
    
    if (!selectedProductFromDropdown) {
      setNotification({ message: 'Không tìm thấy thông tin sản phẩm', type: 'error' });
      return;
    }

    if (remainingQty > selectedProductFromDropdown.total_stock) {
      setNotification({ 
        message: `Số lượng xuất (${remainingQty}) vượt quá tổng tồn kho (${selectedProductFromDropdown.total_stock})`, 
        type: 'error' 
      });
      return;
    }

    // 3. LỌC CÁC LÔ CỦA SẢN PHẨM NÀY ĐỂ TRỪ DẦN (FIFO)
    let productBatches = batches.filter(b => {
      // Phải map đúng 100% với lúc tạo Dropdown
      const pId = String(b.product_id || b.product?.id || b.product || b.product_name);
      const stock = Number(b.current_stock || b.current_qty || 0);
      return pId === String(selectedProductId) && stock > 0;
    });

    productBatches.sort((a, b) => a.id - b.id);

    try {
      // ĐÍCH 1: TẠO ĐƠN HÀNG BÊN PHÂN HỆ SALES TRƯỚC
      const defaultCustomerId = 1;
      const orderRes = await api.post('sales/orders/', {
        customer: defaultCustomerId, // Bắt buộc phải là số ID (ForeignKey)
        status: 'COMPLETED', // Set luôn là Hoàn thành vì bán lẻ xuất hàng luôn
        note: exportData.note 
            ? `${exportData.note} (Tên khách: ${exportData.customer_name})` // Lưu tên khách vào Ghi chú
            : `Bán lẻ trực tiếp tại kho (Khách: ${exportData.customer_name || 'Vãng lai'})`,
        items: [ // Mảng chứa chi tiết sản phẩm, tên trường phải khớp SaleOrderItemSerializer
          {
            product: selectedProductId,
            quantity: remainingQty,
            price: Number(exportData.price)
          }
        ]
      });

      const newOrder = orderRes.data; // Lấy thông tin đơn hàng vừa tạo 

      // ĐÍCH 2: CHẠY VÒNG LẶP FIFO ĐỂ TRỪ KHO 
      for (const batch of productBatches) {
        if (remainingQty <= 0) break; 

        const batchStock = Number(batch.current_stock || batch.current_qty);
        const takeQty = Math.min(remainingQty, batchStock); 

        await api.post('inventory/transactions/', {
          batch: batch.id, 
          transaction_type: 'EXPORT',
          quantity: takeQty,
          // Gắn link sang Đơn hàng để kế toán dễ dò lại
          note: `Xuất cho đơn bán lẻ [${newOrder.code || newOrder.id}] (từ Lô ${batch.batch_code || batch.id})`
        });

        remainingQty -= takeQty; 
      }

      // Xóa form, báo thành công
      setExportData({ product_id: '', quantity: '', price: '', customer_name: '', note: '' });
      setNotification({ message: 'Tạo đơn bán lẻ & Xuất kho thành công!', type: 'success' });
      
      fetchAllData(); 
      if (typeof fetchRecentTransactions === 'function') {
        fetchRecentTransactions(); // Load lại 5 giao dịch gần nhất
      }

    } catch (err) {
      console.error('Lỗi tạo đơn/xuất kho:', err);
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Lỗi khi xử lý hệ thống';
      setNotification({ message: `Lỗi: ${msg}`, type: 'error' });
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

  // HÀM FETCH TRANSACTIONS 
  const fetchTransactions = useCallback(async (pageToFetch = currentPage) => {
    setTxLoading(true);
    try {
        const queryParams = new URLSearchParams({
            page: pageToFetch,
            product: searchProduct,
            start_date: startDate,
            end_date: endDate,
        });

        // Chỉ gửi type lên nếu nó khác "Tất cả"
        if (txFilter !== 'Tất cả') {
            queryParams.append('transaction_type', txFilter);
        }

        const response = await api.get(`inventory/transactions/?${queryParams.toString()}`);
        
        // Cập nhật dữ liệu từ DRF Pagination
        if (response.data.results) {
            setTransactionsList(response.data.results);
            setTotalItems(response.data.count || 0);
            
            // Lấy PAGE_SIZE từ API trả về (nếu không có mặc định là 20)
            const pageSize = response.data.page_size || 20; 
            setTotalPages(Math.ceil((response.data.count || 0) / pageSize));
        } else {
            // Fallback trong trường hợp API chưa bật phân trang
            setTransactionsList(response.data || []);
            setTotalItems((response.data || []).length);
            setTotalPages(1);
        }
        
    } catch (err) {
        console.error("Lỗi tải giao dịch:", err);
        setTransactionsList([]);
    } finally {
        setTxLoading(false);
    }
  }, [txFilter, searchProduct, startDate, endDate]); 

  useEffect(() => {
      if (activeTab === 'TRANSACTIONS') {
          fetchTransactions(currentPage);
      }
  }, [activeTab, currentPage, fetchTransactions]);


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

      {activeTab === 'EXPORT' && (
        <div className="inv-tab-content fade-in">
          <h3><i className="fas fa-upload" style={{ marginRight: 8 }}></i> Xuất Kho </h3>
          <form onSubmit={handleExport} className="inv-form">
            <p className="info-text">Hệ thống sẽ tự động xuất từ lô cũ nhất</p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Chọn Sản Phẩm *</label>
                <select 
                  value={exportData.product_id || ''}
                  onChange={(e) => setExportData({...exportData, product_id: e.target.value})}
                  required
                >
                  <option value="">-- Chọn mặt hàng cần xuất --</option>
                  {productStocks.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} (Tồn: {p.total_stock} {p.unit_name || ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Số Lượng Xuất *</label>
                <input 
                  type="number"
                  // Tự động chặn nhập quá số lượng tồn
                  max={productStocks.find(p => String(p.product_id) === String(exportData.product_id))?.total_stock || ''}
                  value={exportData.quantity || ''}
                  onChange={(e) => setExportData({...exportData, quantity: e.target.value})}
                  placeholder="Nhập số lượng"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tên Khách Hàng (Tùy chọn)</label>
                <input 
                  type="text"
                  value={exportData.customer_name || ''}
                  onChange={(e) => setExportData({...exportData, customer_name: e.target.value})}
                  placeholder="Ví dụ: Anh Tuấn mua lẻ"
                />
              </div>  
            </div>
            <div>
              <div className="form-group">
                <label>Đơn Giá Bán (VNĐ) *</label>
                <input 
                  type="number"
                  value={exportData.price || ''}
                  onChange={(e) => setExportData({...exportData, price: e.target.value})}
                  placeholder="Nhập giá bán / 1 đơn vị"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              <i className="fas fa-check" style={{ marginRight: 8 }}></i> Xuất Kho
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Cảnh báo tồn kho thấp */}
        {activeTab === 'ALERTS' && (
          <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#d32f2f' }}></i> 
              Cảnh Báo Tồn Kho Thấp ({lowStockBatches.length})
            </h3>

            {lowStockBatches.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#4caf50', background: '#e8f5e9', borderRadius: '8px' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Tuyệt vời! Tất cả sản phẩm đều đủ tồn kho an toàn.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {lowStockBatches.map((item, index) => (
                  <div key={index} style={{ 
                    border: '1px solid #ffcdd2', 
                    background: '#ffebee', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    minWidth: '260px',
                    boxShadow: '0 2px 5px rgba(211, 47, 47, 0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#c62828', fontSize: '18px' }}>
                      {item.product_name}
                    </h4>
                    
                    <p style={{ margin: '8px 0', fontSize: '14px', color: '#555' }}>
                      Loại: <strong>{item.product_type === 'RAW' ? 'Nguyên liệu gỗ' : 'Gỗ Thành phẩm'}</strong>
                    </p>
                    
                    <p style={{ margin: '8px 0', fontSize: '14px', color: '#555' }}>
                      Tổng kho hiện tại:
                    </p>
                    <p style={{ margin: '0 0 15px 0', color: '#d32f2f', fontWeight: 'bold', fontSize: '24px' }}>
                      {item.total_stock.toFixed(2)} <span style={{ fontSize: '16px' }}>{item.unit_name}</span>
                    </p>

                    <button 
                      onClick={() => setActiveTab('IMPORT')} 
                      style={{ 
                        width: '100%', padding: '10px', background: '#ef5350', color: 'white', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <i className="fas fa-plus-circle"></i> Nhập Thêm Ngay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Tab: Transactions */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="inv-tab-content fade-in">
          <h3><i className="fas fa-exchange-alt" style={{ marginRight: 8 }}></i> Lịch Sử Giao Dịch</h3>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
            
            {/* Ô 1: Lọc theo Loại */}
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Loại:</label>
                <select 
                    value={txFilter} 
                    onChange={(e) => setTxFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="Tất cả">Tất cả</option>
                    <option value="IMPORT">IMPORT</option>
                    <option value="EXPORT">EXPORT</option>
                </select>
            </div>

            {/* Ô 2: Tìm theo Tên Sản Phẩm */}
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Sản phẩm:</label>
                <input 
                    type="text" 
                    placeholder="Nhập tên gỗ, thanh..." 
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
                />
            </div>

            {/* Ô 3: Tìm theo Ngày */}
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Từ ngày:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Đến ngày:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>

            <button 
                onClick={() => {
                    setCurrentPage(1); // Reset về trang 1
                    fetchTransactions(1); // Gọi lệnh tìm kiếm
                }} 
                style={{ padding: '9px 15px', backgroundColor: '#8b4513', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Lọc Dữ Liệu
            </button>

            {/* Nút Xóa Bộ Lọc (Optional nhưng rất hữu ích) */}
            {(searchProduct || txFilter !== 'Tất cả') && (
                <button 
                    onClick={() => {
                        // 1. Xóa từ khóa và loại
                        setSearchProduct('');
                        setTxFilter('Tất cả');
                        
                        // 2. Trả ngày về lại mặc định (30 ngày trước -> Hôm nay)
                        const d = new Date();
                        d.setDate(d.getDate() - 30);
                        setStartDate(d.toISOString().split('T')[0]);
                        setEndDate(new Date().toISOString().split('T')[0]);
                        
                        // 3. Quay về trang 1
                        setCurrentPage(1);
                    }}
                    style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                    Xóa bộ lọc
                </button>
            )}

          
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                      Tìm thấy <strong>{totalItems}</strong> giao dịch
                  </span>

                  <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                          disabled={currentPage === 1} 
                          onClick={() => setCurrentPage(prev => prev - 1)}
                          style={{ padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                          Trước
                      </button>
                      
                      <span style={{ padding: '5px 10px', background: '#e6cda3', borderRadius: '4px', fontWeight: 'bold' }}>
                          Trang {currentPage} / {totalPages}
                      </span>

                      <button 
                          disabled={currentPage >= totalPages} 
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          style={{ padding: '5px 10px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                      >
                          Sau
                      </button>
                  </div>
              </div>
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

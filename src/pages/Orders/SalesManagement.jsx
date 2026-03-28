import { useEffect, useState } from 'react';
import api from '../../services/api';
import './SalesManagement.css';

// Import các mảnh ghép
import CompletedOrders from './sale/ls';
import CustomerHistoryModal from './sale/his';
import Create from './sale/create';
import Custom from './sale/Custom';
import DeliveryT from './sale/DeliveryT';
import Oder from './sale/Oder';
import OrderDetailModal from './sale/OrderDetailModal';

const SalesManagement = () => {
  const [activeTab, setActiveTab] = useState('COMPLETED_LIST');
  const [orders, setOrders] = useState([]);
  const [ordersAll, setOrdersAll] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState({});
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderActionLoading, setOrderActionLoading] = useState(false);

  // Form tạo đơn
  const [createForm, setCreateForm] = useState({ 
    customer_id: '', 
    items: [{ product_id: '', quantity: '', price: '' }], 
    delivery_date: '', 
    note: '' 
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        api.get('sales/orders/?page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('partners/?partner_type=CUSTOMER&page_size=100').catch(() => ({ data: { results: [] } })),
        api.get('products/?page_size=100').catch(() => ({ data: { results: [] } })),
      ]);

      const allOrders = ordersRes.data.results || ordersRes.data || [];
      setOrdersAll(allOrders);

      // Lọc đơn trong 6 tháng cho Kanban
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 180);
      const recentOrders = allOrders.filter(o => new Date(o.order_date) >= cutoff);
      
      setOrders(recentOrders);
      setCustomers(customersRes.data.results || customersRes.data || []);
      setProducts(productsRes.data.results || productsRes.data || []);

      const grouped = {
        PENDING: recentOrders.filter(o => o.status === 'PENDING'),
        CONFIRMED: recentOrders.filter(o => o.status === 'CONFIRMED'),
        PRODUCTION: recentOrders.filter(o => o.status === 'PRODUCTION'),
        COMPLETED: recentOrders.filter(o => o.status === 'COMPLETED'),
      };
      setOrdersByStatus(grouped);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally { setLoading(false); }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const items = createForm.items
        .filter(i => i.product_id && i.quantity > 0)
        .map(i => ({ product: i.product_id, quantity: Number(i.quantity), price: Number(i.price) || 0 }));

      if (items.length === 0) return alert('Vui lòng thêm sản phẩm');

      await api.post('sales/orders/', { ...createForm, customer: createForm.customer_id, items });
      alert('Tạo đơn thành công!');
      setCreateForm({ customer_id: '', items: [{ product_id: '', quantity: '', price: '' }], delivery_date: '', note: '' });
      fetchAllData();
      setActiveTab('KANBAN');
    } catch (err) { alert('Lỗi tạo đơn'); }
  };

  const handleDelivery = async (orderId) => {
    try {
      setOrderActionLoading(true);
      await api.post(`sales/orders/${orderId}/confirm_delivery/`);
      await fetchAllData();
      setSelectedOrder(null);
      alert('✓ Giao hàng thành công!');
    } catch (err) { alert('Lỗi giao hàng'); } 
    finally { setOrderActionLoading(false); }
  };

  const changeOrderStatus = async (orderId, newStatus) => {
    try {
      setOrderActionLoading(true);
      await api.patch(`sales/orders/${orderId}/update_status/`, { status: newStatus });
      await fetchAllData();
      setSelectedOrder(null);
    } catch (err) { alert('Lỗi cập nhật'); }
    finally { setOrderActionLoading(false); }
  };
  const tabs = [
    { id: 'COMPLETED_LIST', label: 'Đơn Hàng', icon: 'fa-check-double' },
    { id: 'CREATE', label: 'Tạo Đơn Mới', icon: 'fa-plus' },
    { id: 'CUSTOMERS', label: 'Khách Hàng', icon: 'fa-users' },
    { id: 'DELIVERY', label: 'Giao Hàng', icon: 'fa-truck' },
    { id: 'REPORTS', label: 'Thống Kê', icon: 'fa-chart-bar' }
  ];

  return (
    <div className="sales-container">
      {/* Tabs Navigation */}
      <div className="sales-tabs">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            className={`sales-tab-btn ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fas ${tab.icon}`} style={{ marginRight: 8 }}></i>
            {tab.label} {/* <--- Đây là chỗ hiển thị tiếng Việt */}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Đang tải dữ liệu...</div> : (
        <>
          {activeTab === 'COMPLETED_LIST' && (
            <CompletedOrders 
              ordersAll={ordersAll} 
              // Nếu cần in mà fetch thêm data thì truyền thêm api vào
            />
          )}
          {activeTab === 'CREATE' && (
            <Create
              createForm={createForm} setCreateForm={setCreateForm}
              customers={customers} products={products}
              handleCreateOrder={handleCreateOrder}
            />
          )}
          {activeTab === 'CUSTOMERS' && <Custom customers={customers} orders={orders} setSelectedCustomer={setSelectedCustomer} />}
          {activeTab === 'DELIVERY' && <DeliveryT orders={orders} handleDelivery={handleDelivery} loading={orderActionLoading} />}
          
          {activeTab === 'REPORTS' && <Oder ordersAll={ordersAll} setSelectedOrder={setSelectedOrder} />}
        </>
      )}

      {/* Modals */}
      {selectedCustomer && (
        <CustomerHistoryModal 
          customer={selectedCustomer}
          ordersAll={ordersAll} // Truyền toàn bộ kho đơn hàng vào để lọc
          onClose={() => setSelectedCustomer(null)}
          setSelectedOrder={setSelectedOrder} // Để từ lịch sử có thể xem chi tiết đơn
        />
      )}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onStatusChange={changeOrderStatus}
          onDeliver={handleDelivery}
          loading={orderActionLoading}
        />
      )}
    </div>
  );
};

export default SalesManagement;
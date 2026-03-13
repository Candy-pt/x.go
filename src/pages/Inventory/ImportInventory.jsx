import { useState, useEffect } from 'react';
import api from '../../services/api'; 
import Notification from "../../components/Notification";
import './ImportInventory.css'; 

const ImportInventory = () => {
    const [partners, setPartners] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        supplier: '',      
        product: '',       
        batch_code: '',    
        quantity: '',      
        note: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                
                const [partnerRes, productRes] = await Promise.all([
                    api.get('partners/?page_size=1000'),
                        api.get('products/?page_size=1000')
                ]);

                const pList = partnerRes.data.results || partnerRes.data;
                const prList = productRes.data.results || productRes.data;

                // Lọc bỏ Customer, chỉ lấy Supplier hoặc Both
                setPartners(pList.filter(p => p.partner_type !== 'CUSTOMER'));
                setProducts(prList);
            } catch (err) {
                console.error("Lỗi tải danh mục:", err);
                setNotification({ message: 'Không thể tải danh sách sản phẩm/đối tác', type: 'error' });
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);


        try {
            // Bước 1: Tạo Lô hàng (Batch)
            const batchRes = await api.post('inventory/batches/', {
                batch_code: formData.batch_code,
                product: formData.product,
                supplier: formData.supplier,
                note: formData.note
            });

            // Bước 2: Tạo Giao dịch nhập (Transaction)
            await api.post('inventory/transactions/', {
                batch: batchRes.data.id,
                transaction_type: 'IMPORT',
                quantity: formData.quantity,
                note: formData.note || "Nhập hàng đầu vào"
            });

            setNotification({ message: 'Nhập kho lô hàng thành công!', type: 'success' });
            
            // Chỉ reset mã lô và số lượng để tiện nhập nhiều lô cho cùng 1 NCC/Sản phẩm
            setFormData(prev => ({ ...prev, batch_code: '', quantity: '', note: '' }));

        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Lỗi: Trùng mã lô hoặc sai định dạng dữ liệu.';
            setNotification({ message: errorMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="import-inventory-container">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            
            <h3 className="import-header">Nhập Kho Nguyên Liệu Gỗ</h3>

            <div className="import-form-card modern-form">
                <form onSubmit={handleSubmit}>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nhà cung cấp:</label>
                            <select name="supplier" value={formData.supplier} onChange={handleChange} required>
                                <option value="">-- Chọn nhà cung cấp --</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Loại gỗ nguyên liệu:</label>
                            <select name="product" value={formData.product} onChange={handleChange} required>
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Mã số lô hàng:</label>
                            <input 
                                type="text" 
                                name="batch_code" 
                                value={formData.batch_code} 
                                onChange={handleChange} 
                                required 
                                placeholder="VD: LO-SOAN-2024-001" 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Số lượng nhập:</label>
                            <input 
                                type="number" 
                                name="quantity" 
                                value={formData.quantity} 
                                onChange={handleChange} 
                                required 
                                placeholder="Nhập khối lượng/số lượng" 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Ghi chú chi tiết:</label>
                        <textarea 
                            name="note" 
                            value={formData.note} 
                            onChange={handleChange} 
                            placeholder="Thông tin thêm về chuyến hàng, chất lượng gỗ..."
                        ></textarea>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary-large btn-submit-import">
                        {loading ? <span className="spinner"></span> : ''}
                        {loading ? 'Đang lưu hệ thống...' : 'Hoàn tất nhập kho'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ImportInventory;
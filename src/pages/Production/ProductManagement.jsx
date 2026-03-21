import { useEffect, useState } from 'react';
import api from "../../services/api"; 
import { parsePagination, buildPaginationParams } from "../../utils/pagination";
import Notification from "../../components/Notification";
import ConfirmDialog from "../../components/ConfirmDialog";
import './ProductManagement.css';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ count: 0, currentPage: 1, pageSize: 20, next: null, previous: null });
    const [units, setUnits] = useState([]);
    const [filterType, setFilterType] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({
        sku: '', name: '', product_type: 'RAW', unit: '', price: 0, description: ''
    });
    const [runData, setRunData] = useState({  machine: "" });


    useEffect(() => { fetchProducts(1); }, [filterType, searchTerm]);
    useEffect(() => { fetchUnits(); }, []);

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            let url = `products/?${buildPaginationParams(page, 20, searchTerm)}`;
            if (filterType !== 'ALL') url += `&product_type=${filterType}`;
            const res = await api.get(url);
            const paginationData = parsePagination(res);
            setProducts(paginationData.items);
            setPagination(paginationData);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const fetchUnits = async () => {
    try {
        const res = await api.get('units/');
        const unitList = res.data.results || res.data || [];  
        setUnits(unitList);
    } catch (err) {
        console.error('Lỗi fetch units:', err);
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingProduct) {
                console.log('Gọi PUT:', `products/${editingProduct.id}/`);
                const res = await api.put(`products/${editingProduct.id}/`, formData);
                console.log('PUT response:', res.data);
            } else {
                console.log('Gọi POST:', 'products/');
                const res = await api.post('products/', formData);
                console.log('POST response:', res.data);
            }

            setNotification({ message: editingProduct ? 'Cập nhật thành công!' : 'Thêm thành công!', type: 'success' });
            setShowModal(false);
            fetchProducts(pagination.currentPage);
        } catch (err) {
            const msg = err.response?.data?.detail || 
                        err.response?.data?.non_field_errors?.[0] || 
                        err.response?.data?.sku?.[0] || 
                        'Lỗi không xác định. Xem console để biết chi tiết.';
            setNotification({ message: msg, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const renderTypeTag = (type) => {
        const types = {
            'RAW': { label: 'Nguyên liệu', class: 'tag-raw' },
            'FINISHED': { label: 'Thành phẩm', class: 'tag-finished' },
            'BYPRODUCT': { label: 'Phụ phẩm', class: 'tag-byproduct' }
        };
        const config = types[type] || { label: type, class: '' };
        return <span className={`type-tag ${config.class}`}>{config.label}</span>;
    };

    return (
        <div className="product-mgmt-container">
            {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
            
            {deleteConfirm && (
                <ConfirmDialog
                    title={deleteConfirm.title} message={deleteConfirm.message}
                    onConfirm={async () => {
                        try {
                            await api.delete(`products/${deleteConfirm.id}/`);
                            setNotification({ message: 'Đã xóa sản phẩm!', type: 'success' });
                            fetchProducts(1);
                        } catch (err) { setNotification({ message: 'Không thể xóa sản phẩm này!', type: 'error' }); }
                        setDeleteConfirm(null);
                    }}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}

            <div className="unit-header">
                <h3>📦 Quản lý Danh mục Sản phẩm</h3>
                <button className="btn-primary-large" style={{width: 'auto', padding: '10px 25px'}}
                    onClick={() => { setEditingProduct(null); setFormData({sku:'', name:'', product_type:'RAW', unit:'', price:0, description:''}); setShowModal(true); }}>
                    + Thêm sản phẩm
                </button>
            </div>

            <div className="filter-bar">
                <form onSubmit={(e) => { e.preventDefault(); fetchProducts(1); }} className="search-bar" style={{flex: 1}}>
                    <input type="text" className="search-input" placeholder="Tìm theo SKU hoặc tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </form>
                <div className="filter-group">
                    {['ALL', 'RAW', 'FINISHED', 'BYPRODUCT'].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={`filter-btn ${filterType === t ? 'active' : ''}`}>
                            {t === 'ALL' ? 'Tất cả' : t === 'RAW' ? 'Gỗ thô' : t === 'FINISHED' ? 'Bán ra' : 'Phụ phẩm'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="unit-table-wrapper">
                <table className="unit-table">
                    <thead>
                        <tr>
                            <th>Mã SKU</th>
                            <th>Tên sản phẩm</th>
                            <th>Phân loại</th>
                            <th>Đơn vị</th>
                            <th style={{textAlign: 'right'}}>Giá tham khảo</th>
                            <th style={{textAlign: 'center'}}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Đang tải dữ liệu...</td></tr>
                        ) : products.map(p => (
                            <tr key={p.id}>
                                <td className="sku-text"><strong>{p.sku}</strong></td>
                                <td style={{color: 'var(--coffee-dark)', fontWeight: '500'}}>{p.name}</td>
                                <td>{renderTypeTag(p.product_type)}</td>
                                <td>{p.unit_name}</td>
                                <td style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)'}}>
                                    {new Intl.NumberFormat('vi-VN').format(p.price)} đ
                                </td>
                                <td>
                                    <div className="action-btns">
                                        <button className="btn-edit" onClick={() => { setEditingProduct(p); setFormData({sku:p.sku, name:p.name, product_type:p.product_type, unit:p.unit, price:p.price, description:p.description}); setShowModal(true); }}>Sửa</button>
                                        <button className="btn-delete" onClick={() => setDeleteConfirm({id: p.id, title: 'Xóa sản phẩm', message: `Bạn có muốn xóa ${p.name}?`})}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="product-modal-content modern-form">
                        <h3>{editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="product-form-grid">
                                <div className="form-group">
                                    <label className="form-label">Mã SKU *</label>
                                    <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} required placeholder="VD: GO-SOAN-01" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Loại hàng *</label>
                                    <select value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} required>
                                        <option value="RAW">Nguyên liệu</option>
                                        <option value="FINISHED">Thành phẩm</option>
                                        <option value="BYPRODUCT">Phụ phẩm</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Tên sản phẩm *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Tên gọi chi tiết sản phẩm" />
                            </div>

                            <div className="product-form-grid">
                                <div className="form-group">
                                    <label className="form-label">Đơn vị tính *</label>
                                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required>
                                        <option value="">-- Chọn đơn vị --</option>
                                        {Array.isArray(units) && units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Giá (VNĐ)</label>
                                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mô tả sản phẩm</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Thông tin quy cách, độ dày, yêu cầu bảo quản..." />
                            </div>

                            <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                <button type="button" className="sub-tab-btn" style={{flex: 1}} onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                <button type="submit" disabled={submitting} className="btn-primary-large" style={{flex: 2}}>
                                    {submitting ? <span className="spinner"></span> : (editingProduct ? 'Cập nhật hệ thống' : 'Lưu sản phẩm mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;
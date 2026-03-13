import { useEffect, useState } from 'react';
import api from '../../services/api';
import { parsePagination, buildPaginationParams } from '../../utils/pagination';
import Notification from "../../components/Notification";
import ConfirmDialog from "../../components/ConfirmDialog";
import './PartnerManagement.css'; 

const PartnerManagement = () => {
    // --- States ---
    const [partners, setPartners] = useState([]);
    const [pagination, setPagination] = useState({ count: 0, currentPage: 1, pageSize: 20, next: null, previous: null });
    const [filterType, setFilterType] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState(null);
    
    const [partnerHistory, setPartnerHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [notification, setNotification] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    
    const [formData, setFormData] = useState({ name: '', partner_type: 'CUSTOMER', phone: '', address: '' });

    // --- Effects ---
    useEffect(() => { 
        fetchPartners(1); 
    }, [filterType, searchTerm]);

    // --- Actions ---
    const fetchPartners = async (page = 1) => {
        setLoading(true);
        try {
            let url = `partners/?${buildPaginationParams(page, 20, searchTerm)}`;
            if (filterType !== 'ALL') url += `&partner_type=${filterType}`;
            const res = await api.get(url);
            const paginationData = parsePagination(res);
            setPartners(paginationData.items || []); 
            setPagination(paginationData);
        } catch (err) { 
            console.error(err); 
            setNotification({ message: 'Không thể tải danh sách đối tác', type: 'error' });
        } finally { 
            setLoading(false); 
        }
    };

    const fetchPartnerHistory = async (partnerId) => {
        setLoadingHistory(true);
        try {
            const res = await api.get(`partners/${partnerId}/history/`);
            setPartnerHistory(res.data);
        } catch (err) {
            setNotification({ message: 'Lỗi tải lịch sử đối tác', type: 'error' });
        } finally { 
            setLoadingHistory(false); 
        }
    };

    const handleViewDetail = (partner) => {
        setSelectedPartner(partner);
        setEditingPartner(null);
        setActiveTab('info');
        fetchPartnerHistory(partner.id);
        setShowModal(true);
    };

    const handleEdit = (partner) => {
        setEditingPartner(partner);
        setSelectedPartner(null);
        setFormData({
            name: partner.name,
            partner_type: partner.partner_type,
            phone: partner.phone || '',
            address: partner.address || ''
        });
        setShowModal(true);
    };

    const handleDeleteClick = (partner) => {
        setDeleteConfirm({
            id: partner.id,
            title: "Xác nhận xóa",
            message: `Bạn có chắc chắn muốn xóa đối tác "${partner.name}"? Hành động này không thể hoàn tác.`
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingPartner) {
                await api.put(`partners/${editingPartner.id}/`, formData);
                setNotification({ message: 'Cập nhật thành công!', type: 'success' });
            } else {
                await api.post('partners/', formData);
                setNotification({ message: 'Tạo đối tác thành công!', type: 'success' });
            }
            setShowModal(false);
            fetchPartners(pagination.currentPage);
        } catch (err) { 
            setNotification({ message: 'Lỗi: Kiểm tra lại dữ liệu nhập vào', type: 'error' }); 
        } finally { 
            setSubmitting(false); 
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);

    return (
        <div className="partner-container">
            {notification && (
                <Notification 
                    message={notification.message} 
                    type={notification.type} 
                    onClose={() => setNotification(null)} 
                />
            )}
            
            {deleteConfirm && (
                <ConfirmDialog
                    title={deleteConfirm.title} 
                    message={deleteConfirm.message}
                    onConfirm={async () => {
                        try {
                            await api.delete(`partners/${deleteConfirm.id}/`);
                            setNotification({ message: 'Đã xóa đối tác thành công!', type: 'success' });
                            fetchPartners(1);
                        } catch (err) { 
                            setNotification({ message: 'Không thể xóa đối tác này (có thể do ràng buộc dữ liệu)!', type: 'error' }); 
                        }
                        setDeleteConfirm(null);
                    }}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}

            <div className="partner-header">
                <h3><i className="fas fa-users" style={{ marginRight: 8 }}></i> Quản lý Đối tác</h3>
                <button className="btn-primary-large" style={{width: 'auto', padding: '10px 20px'}}
                    onClick={() => { 
                        setEditingPartner(null); 
                        setSelectedPartner(null); 
                        setFormData({name:'', partner_type:'CUSTOMER', phone:'', address:''}); 
                        setShowModal(true); 
                    }}>
                    <i className="fas fa-plus" style={{ marginRight: 8 }}></i> Thêm đối tác
                </button>
            </div>

            <div className="filter-bar">
                <form onSubmit={(e) => { e.preventDefault(); fetchPartners(1); }} style={{display: 'flex', gap: '10px', flex: 1}}>
                    <input type="text" className="search-input" placeholder="Tìm theo tên, SĐT..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </form>
                <div className="filter-group">
                    {['ALL', 'CUSTOMER', 'SUPPLIER', 'BOTH'].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={`filter-btn ${filterType === t ? 'active' : ''}`}>
                            {t === 'ALL' ? 'Tất cả' : t === 'CUSTOMER' ? 'Khách' : t === 'SUPPLIER' ? 'NCC' : 'Cả hai'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="unit-table-wrapper">
                <table className="unit-table">
                    <thead>
                        <tr>
                            <th>Tên đối tác</th>
                            <th>Loại</th>
                            <th>SĐT</th>
                            <th style={{textAlign: 'center'}}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partners.length > 0 ? (
                            partners.map(p => (
                                <tr key={p.id}>
                                    <td style={{fontWeight: 'bold', color: 'var(--coffee-dark)'}}>{p.name}</td>
                                    <td>
                                        <span className={`type-badge ${p.partner_type === 'SUPPLIER' ? 'type-raw' : 'type-finished'}`}>
                                            {p.partner_type}
                                        </span>
                                    </td>
                                    <td>{p.phone || '-'}</td>
                                    <td style={{textAlign: 'center'}}>
                                        <button className="btn-edit" onClick={() => handleViewDetail(p)}>Chi tiết</button>
                                        <button className="btn-edit" style={{marginLeft: '5px', backgroundColor: '#f0ad4e'}} onClick={() => handleEdit(p)}>Sửa</button>
                                        <button className="btn-delete" style={{marginLeft: '5px'}} onClick={() => handleDeleteClick(p)}>Xóa</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Không tìm thấy đối tác nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal - Giữ nguyên logic render của bạn nhưng bọc trong check hiển thị */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowModal(false)}>
                    <div className="modal-content" style={{maxWidth: '700px'}}>
                        {!selectedPartner ? (
                            <div className="modern-form">
                                <h3>{editingPartner ? 'Cập nhật đối tác' : 'Thêm đối tác mới'}</h3>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">Tên đối tác *</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label className="form-label">Loại</label>
                                            <select value={formData.partner_type} onChange={e => setFormData({...formData, partner_type: e.target.value})}>
                                                <option value="CUSTOMER">Khách hàng</option>
                                                <option value="SUPPLIER">Nhà cung cấp</option>
                                                <option value="BOTH">Cả hai</option>
                                            </select>
                                        </div>
                                        <div className="form-group"><label className="form-label">SĐT</label>
                                            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="form-group"><label className="form-label">Địa chỉ</label>
                                        <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                    </div>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <button type="button" className="sub-tab-btn" style={{flex:1}} onClick={() => setShowModal(false)}>Hủy</button>
                                        <button type="submit" className="btn-primary-large" style={{flex:2}} disabled={submitting}>
                                            {submitting ? 'Đang lưu...' : 'Lưu dữ liệu'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                                <div className="history-modal-header">
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <h3>👤 {selectedPartner.name}</h3>
                                        <button className="nav-btn" onClick={() => {setShowModal(false); setSelectedPartner(null);}} style={{background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer'}}>✕</button>
                                    </div>
                                </div>
                                <div className="modal-tabs">
                                    <button className={`modal-tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Thông tin</button>
                                    {selectedPartner.partner_type !== 'SUPPLIER' && (
                                        <button className={`modal-tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Lịch sử mua hàng</button>
                                    )}
                                </div>
                                <div className="kanban-col-content" style={{padding: '20px', minHeight: '300px'}}>
                                    {activeTab === 'info' ? (
                                        <div className="modern-form">
                                            <p><strong>Loại:</strong> {selectedPartner.partner_type}</p>
                                            <p><strong>SĐT:</strong> {selectedPartner.phone || 'Chưa cập nhật'}</p>
                                            <p><strong>Địa chỉ:</strong> {selectedPartner.address || 'Chưa cập nhật'}</p>
                                        </div>
                                    ) : (
                                        <div className="partner-history-list">
                                            {loadingHistory ? <p>Đang tải lịch sử...</p> : (
                                                partnerHistory && (
                                                    <>
                                                        <div className="stat-box-container">
                                                            <div className="stat-box"><div className="label">Tổng đơn</div><div className="value">{partnerHistory.total_orders}</div></div>
                                                            <div className="stat-box"><div className="label">Doanh thu</div><div className="value">{formatCurrency(partnerHistory.total_spent)} đ</div></div>
                                                        </div>
                                                        {partnerHistory.orders.length > 0 ? partnerHistory.orders.map(o => (
                                                            <div key={o.id} className="history-item">
                                                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                                                    <strong>{o.code}</strong><span>{formatCurrency(o.total_value)} đ</span>
                                                                </div>
                                                                <small>{o.order_date} • {o.status_display}</small>
                                                            </div>
                                                        )) : <p>Chưa có lịch sử giao dịch.</p>}
                                                    </>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerManagement;
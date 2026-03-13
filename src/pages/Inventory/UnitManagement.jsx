import { useEffect, useState } from 'react';
import api from '../../services/api';
import { parsePagination, buildPaginationParams } from '../../utils/pagination';
import Notification from "../../components/Notification";
import ConfirmDialog from "../../components/ConfirmDialog";
import './UnitManagement.css'; 

const UnitManagement = () => {
    const [units, setUnits] = useState([]);
    const [pagination, setPagination] = useState({ count: 0, currentPage: 1, pageSize: 20, next: null, previous: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [formData, setFormData] = useState({ code: '', name: '' });
    

    useEffect(() => {
        fetchUnits(1);
    }, [searchTerm]);

    const fetchUnits = async (page = 1) => {
        setLoading(true);
        try {
            const url = `units/?${buildPaginationParams(page, 20, searchTerm)}`;
            const res = await api.get(url);
            const paginationData = parsePagination(res);
            setUnits(paginationData.items);
            setPagination(paginationData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUnit) {
                await api.put(`units/${editingUnit.id}/`, formData);
                setNotification({ message: 'Cập nhật thành công!', type: 'success' });
            } else {
                await api.post('units/', formData);
                setNotification({ message: 'Thêm mới thành công!', type: 'success' });
            }
            setShowModal(false);
            setFormData({ code: '', name: '' });
            fetchUnits(pagination.currentPage);
        } catch (err) {
            setNotification({ message: 'Lỗi: Kiểm tra lại mã hoặc kết nối', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="unit-mgmt-container">
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
                        const id = deleteConfirm.id;
                        setDeleteConfirm(null);
                        try {
                            await api.delete(`units/${id}/`);
                            setNotification({ message: 'Xóa thành công!', type: 'success' });
                            fetchUnits(pagination.currentPage);
                        } catch (err) {
                            setNotification({ message: 'Không thể xóa đơn vị này!', type: 'error' });
                        }
                    }}
                    onCancel={() => setDeleteConfirm(null)}
                    confirmText="Xóa"
                    type="danger"
                />
            )}

            <div className="unit-header">
                <h3>Quản lý Đơn vị tính</h3>
                <button className="btn-primary-large" style={{width: 'auto', padding: '10px 25px'}}
                    onClick={() => { setEditingUnit(null); setFormData({ code: '', name: '' }); setShowModal(true); }}>
                    + Thêm đơn vị
                </button>
            </div>

            <div className="search-wrapper">
            <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm mã hoặc tên đơn vị..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchUnits(1))}
            />
            </div>

            <div className="unit-table-wrapper">
                <table className="unit-table">
                    <thead>
                        <tr>
                            <th>Mã ĐVT</th>
                            <th>Tên Đơn Vị</th>
                            <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{textAlign: 'center', padding: '30px'}}>Đang tải...</td></tr>
                        ) : units.map(unit => (
                            <tr key={unit.id}>
                                <td className="unit-code">{unit.code}</td>
                                <td>{unit.name}</td>
                                <td>
                                    <div className="action-btns">
                                        <button className="btn-edit" onClick={() => { setEditingUnit(unit); setFormData({code: unit.code, name: unit.name}); setShowModal(true); }}>Sửa</button>
                                        <button className="btn-delete" onClick={() => setDeleteConfirm({id: unit.id, title: 'Xác nhận xóa', message: `Xóa đơn vị ${unit.name}?`})}>Xóa</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content modern-form">
                        <h3>{editingUnit ? 'Sửa đơn vị tính' : 'Thêm mới đơn vị'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Mã đơn vị *</label>
                                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tên đơn vị *</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="sub-tab-btn" onClick={() => setShowModal(false)} style={{flex: 1}}>Hủy</button>
                                <button type="submit" disabled={submitting} className="btn-primary-large" style={{flex: 1}}>
                                    {submitting ? <span className="spinner"></span> : (editingUnit ? 'Cập nhật' : 'Tạo mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitManagement;
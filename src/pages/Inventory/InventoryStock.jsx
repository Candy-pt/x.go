import { useEffect, useState } from 'react';
import api from '../../services/api';
import './InventoryStock.css';

const InventoryStock = () => {
    const [stock, setStock] = useState([]);
    const [filterType, setFilterType] = useState('ALL'); 
    const [loading, setLoading] = useState(true);

    const fetchStock = async () => {
        setLoading(true);
        try {
            let url = 'inventory/batches/stock_report/';
            if (filterType !== 'ALL') {
                url += `?product_type=${filterType}`;
            }

            const response = await api.get(url);
            // Chuẩn hóa dữ liệu trả về từ API
            const data = response.data.results || response.data || [];
            setStock(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tải tồn kho:", error);
            setStock([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, [filterType]);

    // Hàm helper để render badge loại sản phẩm


        // Tìm hàm này và sửa lại logic bên trong
    const renderTypeBadge = (type) => {
        // Thêm dòng console.log này để kiểm tra chính xác API trả về chữ gì
        console.log("Loại sản phẩm nhận được:", type); 

        switch (type) {
            case 'RAW': 
                return <span className="type-badge type-raw">Nguyên liệu</span>;
            case 'FINISHED': 
                return <span className="type-badge type-finished">Thành phẩm</span>;
            case 'BYPRODUCT': 
                return <span className="type-badge type-byproduct">Phụ phẩm</span>;
            default: 
                // Nếu type bị undefined hoặc không khớp, trả về một nhãn mặc định để dễ nhận biết
                return <span className="type-badge" style={{background: '#eee'}}>{type || 'N/A'}</span>;
        }
    };

    return (
        <div className="inventory-stock-container">
            <div className="inventory-header">
                <h3>Tồn Kho Hiện Tại</h3>
                
                <div className="filter-group">
                    {['ALL', 'RAW', 'FINISHED', 'BYPRODUCT'].map((type) => (
                        <button 
                            key={type}
                            className={`filter-btn ${filterType === type ? 'active' : ''}`}
                            onClick={() => setFilterType(type)}
                        >
                            {type === 'ALL' ? 'Tất cả' : type === 'RAW' ? 'Nguyên liệu' : type === 'FINISHED' ? 'Thành phẩm' : 'Phụ phẩm'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <span className="spinner"></span> Đang tải dữ liệu...
                </div>
            ) : stock.length === 0 ? (
                <div className="empty-state">Không tìm thấy lô hàng nào trong kho.</div>
            ) : (
                <div className="stock-table-wrapper">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Mã Lô</th>
                                <th>Sản Phẩm</th>
                                <th>Phân Loại</th>
                                <th style={{ textAlign: 'right' }}>Số Lượng Tồn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stock.map((item) => (
                                <tr key={item.id}>
                                    <td className="batch-code">{item.batch_code}</td>
                                    <td>{item.product_name || item.product__name}</td>
                                    <td>{renderTypeBadge(item.product_type)}</td>
                                    <td className="stock-value-cell">
                                        <span className="stock-number">
                                            {new Intl.NumberFormat('vi-VN').format(item.current_stock)}
                                        </span>
                                        <span className="unit-label">
                                            {item.unit_name || item.product__unit__name}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InventoryStock;
import { useState, useEffect } from 'react';
import api from '../../services/api'; 

const TK1 = () => {
    const [inventorySummary, setInventorySummary] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStockData();
    }, []);

    const fetchStockData = async () => {
        setLoading(true);
        try {
            // Lấy toàn bộ hàng HÓA 
            const res = await api.get('inventory/batches/stock_report/?page_size=1000');
            const allBatches = res.data.results || res.data || [];
            
            processInventorySummary(allBatches);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu báo cáo tồn kho:", error);
        } finally {
            setLoading(false);
        }
    };

    const processInventorySummary = (allBatches) => {
        const summaryMap = {};

        allBatches.forEach(batch => {
            // Chỉ lấy các lô còn hàng
            if (batch.current_stock > 0.01) {
                if (!summaryMap[batch.product_name]) {
                    summaryMap[batch.product_name] = {
                        name: batch.product_name,
                        unit: batch.unit_name,
                        type: batch.product_type,
                        totalStock: 0
                    };
                }
                summaryMap[batch.product_name].totalStock += parseFloat(batch.current_stock);
            }
        });

        const summaryArray = Object.values(summaryMap).sort((a, b) => b.totalStock - a.totalStock);
        setInventorySummary(summaryArray);
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu kho...</div>;
    }

    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px' }}>
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#5c4033', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-boxes"></i> Thống kê Hàng hóa trong kho
                </h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                    Tự động cập nhật lượng tồn kho thực tế của các mặt hàng.
                </p>
            </div>

            {inventorySummary.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '10px', color: '#ccc' }}></i>
                    <p>Hiện tại kho đang trống, không có mặt hàng nào.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {inventorySummary.map((item, index) => (
                        <div key={index} style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '20px',
                            backgroundColor: item.type === 'RAW' ? '#fdf8f5' : '#f4fbfa',
                            borderLeft: `4px solid ${item.type === 'RAW' ? '#d97706' : '#059669'}`,
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                {item.type === 'RAW' ? 'Nguyên Liệu' : 'Thành Phẩm'}
                            </div>
                            <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                <span style={{ fontSize: '28px', fontWeight: 'bold', color: item.type === 'RAW' ? '#b45309' : '#047857' }}>
                                    {Number.isInteger(item.totalStock) ? item.totalStock : item.totalStock.toFixed(2)}
                                </span>
                                <span style={{ fontSize: '16px', color: '#666', fontWeight: '500' }}>
                                    {item.unit}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TK1;
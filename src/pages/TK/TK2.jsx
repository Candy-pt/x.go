import { useState, useEffect } from 'react';
import api from '../../services/api'; 
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Hàm tiện ích để lấy ngày mặc định (định dạng YYYY-MM-DD)
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

const TK2 = () => {
    // Mặc định: Lấy từ 30 ngày trước đến hôm nay
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return formatDate(d);
    });
    const [endDate, setEndDate] = useState(() => formatDate(new Date()));
    
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Tự động load dữ liệu lần đầu khi mở tab
    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            // Lấy dữ liệu transaction trong khoảng thời gian.
            const res = await api.get(`inventory/transactions/?start_date=${startDate}&end_date=${endDate}&page_size=2000`);
            const transactions = res.data.results || res.data || [];
            
            processReportData(transactions);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu báo cáo Nhập/Xuất:", error);
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (transactions) => {
        const reportMap = {};

        transactions.forEach(tx => {
            // Lấy tên sản phẩm 
            const productName = tx.product_name || 'Sản phẩm khác'; 
            
            if (!reportMap[productName]) {
                reportMap[productName] = { 
                    name: productName, 
                    totalImport: 0, 
                    totalExport: 0,
                    difference: 0
                };
            }

            const qty = parseFloat(tx.quantity) || 0;

            if (tx.transaction_type === 'IMPORT') {
                reportMap[productName].totalImport += qty;
            } else if (tx.transaction_type === 'EXPORT') {
                reportMap[productName].totalExport += qty;
            }
        });

        // Tính toán chênh lệch và chuyển thành mảng
        const finalData = Object.values(reportMap).map(item => ({
            ...item,
            difference: item.totalImport - item.totalExport
        }));

        // Sắp xếp theo lượng Nhập nhiều nhất đứng trước
        finalData.sort((a, b) => b.totalImport - a.totalImport);

        setReportData(finalData);
    };

    return (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px' }}>
            
            {/* THANH CÔNG CỤ (BỘ LỌC NGÀY) */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Từ ngày:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Đến ngày:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    />
                </div>
                <button 
                    onClick={fetchReportData} 
                    style={{ padding: '9px 20px', backgroundColor: '#8b4513', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <i className="fas fa-filter"></i> Xem Báo Cáo
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tính toán số liệu...</div>
            ) : reportData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Không có giao dịch Nhập/Xuất nào trong khoảng thời gian này.
                </div>
            ) : (
                <>
                    {/* KHU VỰC BIỂU ĐỒ BAR CHART */}
                    <div style={{ marginBottom: '40px' }}>
                        <h4 style={{ textAlign: 'center', color: '#444', marginBottom: '20px' }}>Biểu Đồ Nhập - Xuất Hàng Hóa</h4>
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fill: '#666'}} />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value, name) => [value.toFixed(2), name]} 
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="totalImport" name="Tổng Lượng Nhập" fill="#d97706" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="totalExport" name="Tổng Lượng Xuất" fill="#059669" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* KHU VỰC BẢNG DỮ LIỆU CHI TIẾT */}
                    <div>
                        <h4 style={{ color: '#444', marginBottom: '15px' }}>Bảng Số Liệu Chi Tiết</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '12px', color: '#495057' }}>Sản Phẩm</th>
                                        <th style={{ padding: '12px', color: '#d97706', textAlign: 'right' }}>Tổng Nhập</th>
                                        <th style={{ padding: '12px', color: '#059669', textAlign: 'right' }}>Tổng Xuất</th>
                                        <th style={{ padding: '12px', color: '#495057', textAlign: 'right' }}>Chênh Lệch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px', fontWeight: '500' }}>{row.name}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                                {Number.isInteger(row.totalImport) ? row.totalImport : row.totalImport.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                                {Number.isInteger(row.totalExport) ? row.totalExport : row.totalExport.toFixed(2)}
                                            </td>
                                            <td style={{ 
                                                padding: '12px', 
                                                textAlign: 'right', 
                                                fontWeight: 'bold',
                                                // Nếu chênh lệch âm (xuất nhiều hơn nhập) thì in màu đỏ, dương thì màu xanh dương
                                                color: row.difference < 0 ? '#dc3545' : '#0d6efd' 
                                            }}>
                                                {row.difference > 0 ? '+' : ''}
                                                {Number.isInteger(row.difference) ? row.difference : row.difference.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TK2;
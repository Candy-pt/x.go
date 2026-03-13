import React, { useState } from 'react'; // Thêm useState vào đây
import api from '../../../services/api';

const ls = ({ ordersAll }) => {
    // 1. Khai báo State để lưu từ khóa tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');

    // 2. Cải tiến logic lọc: Lọc đơn có status VÀ khớp với từ khóa (Mã đơn hoặc Tên khách)
    const filteredOrders = ordersAll
        .filter(o => o.status) // Giữ nguyên điều kiện lọc status của bạn
        .filter(o => 
            o.code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handlePrintInvoice = async (order) => {
        let fullOrderData = order;
        
        if (!order.items || order.items.length === 0) {
            try {
                const res = await api.get(`sales/orders/${order.id}/`);
                fullOrderData = res.data;
            } catch (err) {
                alert("Lỗi tải chi tiết đơn hàng!");
                return;
            }
        }

        const fmt = (val) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hóa đơn ${fullOrderData.code}</title>
                    <style>
                        body { font-family: "Times New Roman", serif; padding: 30px; line-height: 1.4; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        .text-right { text-align: right; }
                        .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
                        .sig-box { width: 200px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2 style="margin:0;">XƯỞNG GỖ VŨ HOA</h2>
                        <p style="margin:5px 0;">Địa chỉ: KCN Đồng Hỷ, Thái Nguyên | Điện thoại: 09xx.xxx.xxx</p>
                        <h3 style="margin:15px 0;">HÓA ĐƠN BÁN HÀNG - ${fullOrderData.code}</h3>
                    </div>
                    <p>Khách hàng: <b>${fullOrderData.customer_name}</b></p>
                    <p>Ngày hoàn thành: ${new Date().toLocaleDateString('vi-VN')}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th class="text-right">Số lượng</th>
                                <th class="text-right">Đơn giá</th>
                                <th class="text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fullOrderData.items.map(it => `
                                <tr>
                                    <td>${it.product_name}</td>
                                    <td class="text-right">${it.quantity}</td>
                                    <td class="text-right">${fmt(it.price)}</td>
                                    <td class="text-right">${fmt(it.quantity * it.price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <h3 class="text-right">Tổng cộng: ${fmt(fullOrderData.total_value)}</h3>
                    <div class="footer">
                        <div class="sig-box"><b>Người giao hàng</b><br/><i>(Ký tên)</i></div>
                        <div class="sig-box"><b>Người nhận hàng</b><br/><i>(Ký tên)</i></div>
                    </div>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="sales-tab-content fade-in">
            {/* 3. Thêm Thanh Tìm Kiếm bên trên bảng */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3><i className="fas fa-check-double" style={{ marginRight: 8 }}></i> Tất cả đơn hàng </h3>
                
                <div className="search-container" style={{ position: 'relative', width: '300px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}></i>
                    <input 
                        type="text" 
                        placeholder="Tìm mã đơn hoặc tên khách..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 15px 10px 35px',
                            borderRadius: '20px',
                            border: '1px solid #ddd',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div className="table-responsive">
                <table className="unit-table">
                    <thead>
                        <tr>
                            <th>Mã Đơn</th>
                            <th>Khách Hàng</th>
                            <th>Ngày Đặt</th>
                            <th style={{ textAlign: 'right' }}>Giá trị</th>
                            <th style={{ textAlign: 'center' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length > 0 ? filteredOrders.map(order => (
                            <tr key={order.id}>
                                <td style={{ fontWeight: 'bold' }}>{order.code}</td>
                                <td>{order.customer_name}</td>
                                <td>{new Date(order.order_date).toLocaleDateString('vi-VN')}</td>
                                <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>
                                    {new Intl.NumberFormat('vi-VN').format(order.total_value)} đ
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button 
                                        className="btn-print" 
                                        onClick={() => handlePrintInvoice(order)}
                                        style={{ background: '#DCB485', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        <i className="fas fa-print"></i> In lại hóa đơn
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                    {searchTerm ? `Không tìm thấy đơn hàng nào khớp với "${searchTerm}"` : "Chưa có dữ liệu đơn hàng."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ls;
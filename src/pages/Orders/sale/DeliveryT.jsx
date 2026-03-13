import React, { useState } from 'react';
import api from '../../../services/api';

const DeliveryT = ({ orders, handleDelivery, loading }) => {
    const [isFetching, setIsFetching] = useState(false);

    // Lọc đơn hàng cần giao
    const deliveryOrders = orders.filter(o => o.status === 'PRODUCTION' || o.status === 'CONFIRMED');

    // Hàm định dạng tiền tệ Việt Nam
    const fmt = (val) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';

    const handlePrintDirect = async (order) => {
        setIsFetching(true);
        try {
            // 1. Lấy chi tiết đơn hàng (để có mảng items)
            const res = await api.get(`sales/orders/${order.id}/`);
            const fullData = res.data;

            // 2. Logic tính toán tổng tiền
            const subtotal = fullData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const vat = subtotal * 0.1; // Thuế 10%
            const grandTotal = subtotal + vat;

            // 3. Tạo nội dung HTML Hóa đơn
            const printWindow = window.open('', '_blank');
            const htmlContent = `
                <html>
                <head>
                    <title>In Hóa Đơn - ${fullData.code}</title>
                    <style>
                        body { font-family: "Arial", sans-serif; line-height: 1.4; padding: 20px; color: #333; }
                        .header { text-align: center; border-bottom: 2px solid #4C2113; margin-bottom: 20px; padding-bottom: 10px; }
                        .header h1 { margin: 0; color: #4C2113; font-size: 22px; }
                        .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
                        .title { text-align: center; font-size: 20px; font-weight: bold; margin: 10px 0; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                        th { background-color: #f8f8f8; font-weight: bold; }
                        .summary-table { width: 300px; margin-left: auto; border: none; }
                        .summary-table td { border: none; padding: 5px; }
                        .total-row { font-weight: bold; font-size: 1.1em; color: #4C2113; border-top: 1px solid #333 !important; }
                        .signature-space { height: 80px; }
                        .footer { display: flex; justify-content: space-between; margin-top: 40px; }
                        .footer-item { text-align: center; width: 200px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>XƯỞNG SẢN XUẤT GỖ VŨ HOA</h1>
                        <p>Địa chỉ: KCN Đồng Hỷ, Thái Nguyên | SĐT: 09xx.xxx.xxx</p>
                    </div>

                    <div class="title">HÓA ĐƠN BÁN HÀNG</div>

                    <div class="info-section">
                        <div>
                            <p>Mã đơn: <b>${fullData.code}</b></p>
                            <p>Ngày lập: ${new Date(fullData.order_date).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div style="text-align: right;">
                            <p>Khách hàng: <b>${fullData.customer_name}</b></p>
                            <p>Địa chỉ: ${fullData.customer_address || '---'}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px;">STT</th>
                                <th>Sản phẩm / Quy cách</th>
                                <th style="text-align: right;">Số lượng</th>
                                <th style="text-align: right;">Đơn giá</th>
                                <th style="text-align: right;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fullData.items.map((it, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td><b>${it.product_name}</b></td>
                                    <td style="text-align: right;">${it.quantity}</td>
                                    <td style="text-align: right;">${fmt(it.price)}</td>
                                    <td style="text-align: right;"><b>${fmt(it.quantity * it.price)}</b></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <table class="summary-table">
                        <tr>
                            <td>Tạm tính:</td>
                            <td style="text-align: right;">${fmt(subtotal)}</td>
                        </tr>
                        <tr>
                            <td>Thuế VAT (10%):</td>
                            <td style="text-align: right;">${fmt(vat)}</td>
                        </tr>
                        <tr class="total-row">
                            <td>TỔNG CỘNG:</td>
                            <td style="text-align: right;">${fmt(grandTotal)}</td>
                        </tr>
                    </table>

                    ${fullData.note ? `<p style="font-style: italic;"><b>Ghi chú:</b> ${fullData.note}</p>` : ''}

                    <div class="footer">
                        <div>
                            <p><b>Người lập phiếu</b></p>
                            <div class="signature-space"></div>
                        </div>
                        <div>
                            <p><b>Khách hàng nhận hàng</b></p>
                            <div class="signature-space"></div>
                        </div>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();

        } catch (err) {
            console.error(err);
            alert("Lỗi: Không thể tải dữ liệu in!");
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="sales-tab-content fade-in">
            <h3><i className="fas fa-truck" style={{ marginRight: 8 }}></i> Xác Nhận Giao Hàng</h3>
            
            <div className="delivery-list">
                {deliveryOrders.map(order => (
                    <div key={order.id} className="delivery-item">
                        <div className="item-info">
                            <strong>{order.code}</strong> - {order.customer_name}
                            <p>Tổng tiền: <b style={{color: '#4C2113'}}>{fmt(order.total_value)}</b></p>
                        </div>
                        
                        <div className="action-group">
                            <button 
                                className="btn-print-trigger" 
                                onClick={() => handlePrintDirect(order)}
                                disabled={isFetching}
                                style={{ 
                                    marginRight: '10px', 
                                    backgroundColor: '#DCB485', 
                                    color: '#4C2113', 
                                    border: 'none', 
                                    padding: '8px 15px', 
                                    borderRadius: '4px', 
                                    cursor: 'pointer' 
                                }}
                            >
                                <i className="fas fa-print"></i> {isFetching ? '...' : 'In Hóa Đơn'}
                            </button>

                            <button className="btn-confirm-delivery" onClick={() => handleDelivery(order.id)} disabled={loading}>
                                {loading ? '...' : 'Xác Nhận Giao'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeliveryT;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Giả sử axios instance của bạn ở đây

const RegisterPage = () => {
    // State để quản lý các ô nhập liệu
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // Email là tùy chọn trong API của bạn
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // State để quản lý thông báo lỗi và thành công
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate(); // Hook để chuyển trang (yêu cầu react-router-dom)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        // 1. Kiểm tra khớp mật khẩu ở frontend
        if (password !== confirmPassword) {
            setError('Mật khẩu nhập lại không khớp!');
            setIsLoading(false);
            return;
        }

        // 2. Kiểm tra độ dài mật khẩu tối thiểu (ví dụ: 6 ký tự)
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            setIsLoading(false);
            return;
        }

        try {
            // 3. Gửi request đăng ký đến backend Django API
            const response = await api.post('/register/', {
                username,
                email, // Có thể bỏ nếu backend không cần lưu email
                password,
            });

            // 4. Xử lý khi thành công (Backend trả về code 201)
            setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng về trang đăng nhập...');
            
            // Tự động chuyển về trang đăng nhập sau 2 giây
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            // 5. Xử lý khi có lỗi từ backend (ví dụ trùng username, code 400)
            if (err.response && err.response.data && err.response.data.detail) {
                // Backend của bạn trả về lỗi chi tiết trong object 'detail'
                const backendErrors = err.response.data.detail;
                let combinedErrors = '';
                
                // Gom các lỗi lại thành một chuỗi thông báo
                for (const field in backendErrors) {
                    combinedErrors += `${field}: ${backendErrors[field].join(', ')} `;
                }
                setError(combinedErrors || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
            } else {
                setError('Không thể kết nối đến máy chủ.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- Định nghĩa Style (Giữ đồng bộ với style LoginPage) ---
    const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' };
    const formStyle = { padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '350px' };
    const titleStyle = { textAlign: 'center', marginBottom: '1.5rem' };
    const labelStyle = { display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' };
    const inputStyle = { width: '100%', padding: '8px', boxSizing: 'border-box' };
    const buttonStyle = { width: '100%', padding: '10px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem', fontWeight: 'bold', fontSize: '16px' };
    const linkContainerStyle = { textAlign: 'center', fontSize: '14px' };
    const linkStyle = { color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' };
    // Style cho thông báo lỗi/thành công
    const messageStyle = { textAlign: 'center', fontSize: '14px', padding: '8px', borderRadius: '4px', marginBottom: '1rem' };
    const errorBoxStyle = { ...messageStyle, color: 'red', background: '#fff1f0', border: '1px solid #ffa39e' };
    const successBoxStyle = { ...messageStyle, color: 'green', background: '#f6ffed', border: '1px solid #b7eb8f' };

    return (
        <div style={containerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h2 style={titleStyle}>Đăng ký Tài khoản</h2>
                
                {/* Hiện thông báo lỗi hoặc thành công */}
                {error && <p style={errorBoxStyle}>{error}</p>}
                {successMessage && <p style={successBoxStyle}>{successMessage}</p>}
                
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Tên đăng nhập (Username):</label>
                    <input type="text" placeholder="Ví dụ: nva_pro" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} required disabled={isLoading} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Email (Tùy chọn):</label>
                    <input type="email" placeholder="Ví dụ: example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} disabled={isLoading} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Mật khẩu:</label>
                    <input type="password" placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required disabled={isLoading} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Nhập lại mật khẩu:</label>
                    <input type="password" placeholder="Xác nhận lại mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} required disabled={isLoading} />
                </div>
                
                <button type="submit" style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
                    {isLoading ? 'Đang đăng ký...' : 'Đăng ký Tài khoản'}
                </button>

                <div style={linkContainerStyle}>
                    <span>Đã có tài khoản? </span>
                    <span onClick={() => navigate('/login')} style={linkStyle}>
                        Quay về Đăng nhập
                    </span>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage;
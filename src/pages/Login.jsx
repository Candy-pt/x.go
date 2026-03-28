import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Thêm hook điều hướng
import api from '../services/api';

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Khởi tạo hàm chuyển trang

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/login/', { username, password });
            localStorage.setItem('user', JSON.stringify(response.data.user));
            onLoginSuccess(response.data.user);
        } catch (err) {
            setError('Tài khoản hoặc mật khẩu không đúng!');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <form onSubmit={handleSubmit} style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '300px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Đăng nhập Hệ thống</h2>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                <div style={{ marginBottom: '1rem' }}>
                    <input type="text" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
                </div>
                
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem' }}>
                    Đăng nhập
                </button>

                {/* Phần bổ sung nút/link Đăng ký */}
                <div style={{ textAlign: 'center', fontSize: '14px' }}>
                    <span>Chưa có tài khoản? </span>
                    <span 
                        onClick={() => navigate('/register')} // Chuyển hướng sang route /register
                        style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Đăng ký ngay
                    </span>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;
import { useState } from 'react';
import api from '../services/api';  // Import api đã tạo ở Bước 1

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/login/', { username, password });
            // Giả sử backend trả về thông tin user
            localStorage.setItem('user', JSON.stringify(response.data.user));
            onLoginSuccess(response.data.user);
        } catch (err) {
            setError('Tài khoản hoặc mật khẩu không đúng!');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <form onSubmit={handleSubmit} style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h2>Đăng nhập Hệ thống</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div style={{ marginBottom: '1rem' }}>
                    <input type="text" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '8px' }} required />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đăng nhập</button>
            </form>
        </div>
    );
};

export default LoginPage;
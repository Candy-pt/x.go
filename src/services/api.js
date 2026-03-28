// // src/services/api.js
// import axios from 'axios';

// // Đọc API base URL từ biến môi trường.
// // Nếu không có, sẽ dùng '/api/' cho môi trường dev (để Vite proxy).
// const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/';

// const api = axios.create({
//   baseURL: baseURL,
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export default api;

import axios from 'axios';

const api = axios.create({
    baseURL: 'https://xgob-production.up.railway.app/api',

    withCredentials: true, // BẮT BUỘC: Để trình duyệt gửi Cookie kèm theo request
});

// Tự động lấy CSRF Token từ Cookie của Django và gắn vào Header
api.interceptors.request.use(config => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    config.headers['X-CSRFToken'] = cookieValue;
    return config;
});

export default api;

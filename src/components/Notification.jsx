import { useEffect } from 'react';

const Notification = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const bgColor = type === 'success' ? '#4C2113' : type === 'error' ? '#A45C23' : '#B38B60';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: bgColor,
            color: '#FFFFFF',
            padding: '15px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease-out'
        }}>
            <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{icon}</span>
            <span style={{ flex: 1 }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                ×
            </button>
        </div>
    );
};

export default Notification;


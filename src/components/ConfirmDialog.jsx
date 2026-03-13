const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy', type = 'danger' }) => {
    const bgColor = type === 'danger' ? '#A45C23' : '#B38B60';
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
        }}>
            <div style={{
                background: '#FFFFFF',
                padding: '30px',
                borderRadius: '12px',
                width: '400px',
                maxWidth: '90%',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#4C2113', fontSize: '1.3em' }}>
                    {title}
                </h3>
                <p style={{ margin: '0 0 25px 0', color: '#4C2113', lineHeight: '1.6' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px',
                            background: '#DCB485',
                            color: '#4C2113',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 20px',
                            background: bgColor,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;


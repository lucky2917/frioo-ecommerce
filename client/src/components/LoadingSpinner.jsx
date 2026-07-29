import React from 'react';

const LoadingSpinner = ({
    size = 'medium',
    message = 'Loading...',
    fullScreen = false
}) => {
    const sizes = {
        small: '20px',
        medium: '40px',
        large: '60px'
    };

    const spinnerSize = sizes[size] || sizes.medium;

    const spinnerStyle = {
        width: spinnerSize,
        height: spinnerSize,
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #1a1a1a',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    };

    const containerStyle = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        zIndex: 9999,
        gap: '20px'
    } : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: '15px'
    };

    const messageStyle = {
        fontFamily: 'var(--fr-font-sans)',
        fontSize: 'var(--fr-fs-body)',
        fontWeight: 'var(--fr-fw-regular)',
        lineHeight: 'var(--fr-lh-normal)',
        color: '#666',
        marginTop: '10px'
    };

    return (
        <div style={containerStyle}>
            <div style={spinnerStyle}></div>
            {message && <p style={messageStyle}>{message}</p>}
        </div>
    );
};

export default LoadingSpinner;

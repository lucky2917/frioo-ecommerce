import React, { useState, useEffect } from 'react';

export default function CouponPopup() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const welcomeSeen = localStorage.getItem('frioo_welcome_seen');
        if (!welcomeSeen) {
            setTimeout(() => setShow(true), 1500);
            localStorage.setItem('frioo_welcome_seen', 'true');
        }
    }, []);

    useEffect(() => {
        if (!document.getElementById('coupon-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'coupon-popup-styles';
            style.innerHTML = `
                @keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-pop { animation: pop 0.3s ease-out; }
                .coupon-close-btn:hover, .coupon-start-btn:hover { transform: translateY(-1px); }
            `;
            document.head.appendChild(style);
        }
    }, []);

    if (!show) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.card} className="animate-pop">
                <button className="coupon-close-btn" onClick={() => setShow(false)} style={styles.close}>&times;</button>
                <div style={{ fontSize: '3rem' }}>📍</div>
                <h2 style={styles.title}>Welcome to Frioo!</h2>
                <p style={styles.text}>
                    We currently deliver fresh juices, smoothies & salads in <strong>Visakhapatnam</strong>
                </p>
                <div style={styles.serviceBox}>
                    <div style={styles.serviceItem}>
                        <span style={styles.icon}>🚚</span>
                        <div>
                            <strong>Delivery Range</strong>
                            <p style={styles.serviceText}>Within 6 km radius</p>
                        </div>
                    </div>
                    <div style={{ ...styles.serviceItem, marginBottom: 0 }}>
                        <span style={styles.icon}>🏪</span>
                        <div>
                            <strong>Pickup Available</strong>
                            <p style={styles.serviceText}>At our Visakhapatnam store</p>
                        </div>
                    </div>
                </div>
                <button className="coupon-start-btn" onClick={() => setShow(false)} style={styles.btn}>Start Shopping</button>
            </div>
        </div>
    );
}

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
    card: { background: 'white', width: '90%', maxWidth: '380px', padding: '35px 30px', borderRadius: '20px', textAlign: 'center', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' },
    close: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#999' },
    title: { fontFamily: 'Playfair Display', fontSize: '1.75rem', margin: '10px 0', color: '#1a1a1a' },
    text: { color: '#666', marginBottom: '25px', fontSize: '0.95rem', lineHeight: '1.5' },
    serviceBox: { background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', textAlign: 'left' },
    serviceItem: { display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' },
    icon: { fontSize: '1.75rem', flexShrink: 0 },
    serviceText: { margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' },
    btn: { width: '100%', background: '#1a1a1a', color: 'white', border: 'none', padding: '15px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'transform 0.2s' }
};

import React, { useState, useEffect } from 'react';

export default function Promo() {
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  return (
    <section style={styles.section}>
      <div style={styles.content}>
        <h3 style={styles.title}>Afternoon Harvest Sale</h3>
        <p style={styles.desc}>Order within the next 2 hours to get same-day delivery + 20% off salads.</p>
        <div style={styles.timer}>{format(timeLeft)}</div>
        <button style={styles.btn}>Shop The Sale</button>
      </div>
    </section>
  );
}

const styles = {
  section: { padding: '100px 20px', textAlign: 'center', background: '#fff', borderTop: '1px solid #eee' },
  title: { fontFamily: 'Georgia, serif', fontSize: '3rem', marginBottom: '20px' },
  desc: { color: '#666', marginBottom: '30px' },
  timer: { fontSize: '2rem', fontFamily: 'Georgia, serif', margin: '20px 0', letterSpacing: '2px', color: '#1a1a1a' },
  btn: { padding: '15px 40px', background: 'transparent', color: '#1a1a1a', border: '1px solid #1a1a1a', fontSize: '0.9rem', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' },
};
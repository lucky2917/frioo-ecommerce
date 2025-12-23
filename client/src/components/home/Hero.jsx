import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <header style={styles.hero}>
      <div style={styles.textContainer}>
        <span style={styles.subtitle}>EST. 2025 — FARM TO TABLE</span>
        <h1 style={styles.title}>The Art of <br /> Fresh Living.</h1>
        <p style={styles.desc}>
          Handpicked seasonal fruits and artisanal salads, delivered with the care they deserve.
        </p>
        <Link to="/shop">
          <button style={styles.btn}>Shop Collection</button>
        </Link>
      </div>
      <div style={styles.imgContainer}>
        <img
          src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=80"
          alt="Fresh Fruits"
          style={styles.img}
        />
      </div>
    </header>
  );
}

const styles = {
  hero: { display: 'flex', flexDirection: 'row', height: '80vh', alignItems: 'center', overflow: 'hidden', background: '#fff', boxSizing: 'border-box' },
  textContainer: { flex: 1, padding: '0 5% 0 10%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  subtitle: { fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: '20px' },
  title: { fontSize: '4rem', fontFamily: 'Georgia, serif', lineHeight: '1.1', margin: '0 0 20px 0', color: '#1a1a1a' },
  desc: { fontSize: '1.1rem', lineHeight: '1.6', color: '#555', marginBottom: '40px', maxWidth: '400px' },
  imgContainer: { flex: 1, height: '100%' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  btn: { padding: '15px 40px', background: 'linear-gradient(135deg, #FFB74D 0%, #FF9800 50%, #F57C00 100%)', fontSize: '0.9rem', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' },
};

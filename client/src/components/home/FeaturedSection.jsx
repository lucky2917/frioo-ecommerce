import React from 'react';

export default function FeaturedSection({ products }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.header}>Seasonal Favorites</h2>
      <p style={styles.sub}>Picked just for you this morning.</p>
      
      <div style={styles.grid}>
        {products.slice(0, 4).map(p => (
          <div key={p.id} style={styles.card}>
            <div style={styles.imgWrapper}>
              <img src={p.images?.[0]} alt={p.title} style={styles.img} />
              <span style={styles.tag}>Fresh</span>
            </div>
            <h4 style={styles.title}>{p.title}</h4>
            <p style={styles.price}>₹{(p.price_cents / 100).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles = {
  section: { padding: '80px 10%', background: '#fdfbf7' },
  header: { fontSize: '2.5rem', fontFamily: 'Georgia, serif', margin: '0 0 10px 0', textAlign: 'center' },
  sub: { textAlign: 'center', color: '#666', marginBottom: '50px', fontStyle: 'italic', fontFamily: 'Georgia, serif' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '40px' },
  card: { cursor: 'pointer' },
  imgWrapper: { position: 'relative', marginBottom: '15px', overflow: 'hidden' },
  img: { width: '100%', height: '300px', objectFit: 'cover' },
  tag: { position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '5px 10px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' },
  title: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', margin: '0 0 5px 0' },
  price: { fontSize: '1rem', color: '#666' },
};
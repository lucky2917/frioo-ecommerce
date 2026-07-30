import React from 'react';
import SEO from '../../components/SEO';

export default function OurStores() {
  const store = {
    name: 'Frioo Visakhapatnam',
    address: 'Railway Quarters, Allipuram, Visakhapatnam Urban, Visakhapatnam, Andhra Pradesh 530004',
    lat: 17.721086639920603,
    lng: 83.29694119604164,
    phone: '+91 9347043329',
    email: 'frioo.trust@gmail.com',
    hours: '7:00 AM - 10:00 PM',
    daysOpen: 'Monday - Sunday'
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
  const embedMapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3799.8!2d${store.lng}!3d${store.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDQzJzE1LjkiTiA4M8KwMTcnNDguOSJF!5e0!3m2!1sen!2sin!4v1234567890!5m2!1sen!2sin`;

  return (
    <div className="stores-page">
      <SEO
        title="Frioo Store in Visakhapatnam — Visit Our Fresh Fruit Shop in Vizag"
        description="Visit Frioo's flagship store in Allipuram, Visakhapatnam. Fresh fruits, juices, milkshakes & salads. Open 7AM-10PM daily. Get directions to the best fruit shop in Vizag."
        canonical="/stores"
        keywords="frioo store vizag, frioo visakhapatnam location, fruit shop allipuram vizag, juice shop near me vizag, frioo store address, fresh fruit shop visakhapatnam"
      />
      <div className="stores-container">
        <div className="stores-hero">
          <div className="hero-content">
            <h1>Visit Our Store</h1>
            <p className="subtitle">Experience fresh, healthy living in person</p>
          </div>
          <div className="hero-decoration">
            <div className="decoration-circle"></div>
            <div className="decoration-circle"></div>
          </div>
        </div>

        <div className="main-store-card">
          <div className="store-content">
            <div className="flagship-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span>Flagship Store</span>
            </div>

            <h2 className="store-name">{store.name}</h2>

            <div className="store-details">
              <div className="detail-item">
                <div className="detail-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="10" r="3" />
                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                  </svg>
                </div>
                <div className="detail-content">
                  <h3>Address</h3>
                  <p>{store.address}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="detail-content">
                  <h3>Opening Hours</h3>
                  <p>{store.hours}</p>
                  <p className="days">{store.daysOpen}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="detail-content">
                  <h3>Contact</h3>
                  <p><a href={`tel:${store.phone}`}>{store.phone}</a></p>
                  <p><a href={`mailto:${store.email}`}>{store.email}</a></p>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Get Directions
              </a>
              <a href={`tel:${store.phone}`} className="btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Call Store
              </a>
            </div>
          </div>

          <div className="map-container">
            <div className="map-wrapper">
              <iframe
                src={embedMapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Frioo Store Location"
              ></iframe>
            </div>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="map-overlay-link">
              View on Google Maps →
            </a>
          </div>
        </div>

        <div className="expansion-notice">
          <div className="notice-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h2>Expanding Soon</h2>
          <p>We're bringing fresh, healthy living to more locations across Andhra Pradesh and beyond. Stay tuned for new store openings!</p>
        </div>
      </div>

      <style jsx>{`
        .stores-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #faf5ed 0%, #ffffff 50%, #f8f9fa 100%);
          padding: 100px 20px 80px;
        }

        .stores-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .stores-hero {
          position: relative;
          text-align: center;
          padding: 60px 20px;
          overflow: hidden;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .stores-hero h1 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
          margin: 0 0 16px 0;
          font-weight: var(--fr-fw-bold);
        }

        .subtitle {
          font-size: var(--fr-fs-lead);
          color: #D4AF7A;
          font-weight: var(--fr-fw-regular);
          margin: 0;
        }

        .hero-decoration {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          pointer-events: none;
        }

        .decoration-circle {
          position: absolute;
          border: 2px solid rgba(212, 175, 122, 0.1);
          border-radius: 50%;
          animation: pulse-circle 3s ease-in-out infinite;
        }

        .decoration-circle:nth-child(1) {
          width: 300px;
          height: 300px;
          top: -150px;
          left: -150px;
        }

        .decoration-circle:nth-child(2) {
          width: 500px;
          height: 500px;
          top: -250px;
          left: -250px;
          animation-delay: 1.5s;
        }

        @keyframes pulse-circle {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.1;
          }
        }

        .main-store-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          background: white;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          margin-bottom: 60px;
          position: relative;
          overflow: hidden;
        }

        .main-store-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #D4AF7A 0%, #c49a6a 100%);
        }

        .store-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .flagship-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #D4AF7A 0%, #c49a6a 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 50px;
          font-size: var(--fr-fs-label);
          font-weight: var(--fr-fw-medium);
          text-transform: uppercase;
          letter-spacing: var(--fr-track-eyebrow);
          width: fit-content;
          box-shadow: 0 4px 16px rgba(212, 175, 122, 0.3);
        }

        .store-name {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
          margin: 0;
          font-weight: var(--fr-fw-bold);
        }

        .store-details {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .detail-item {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .detail-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #faf5ed 0%, #f0e9dc 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(212, 175, 122, 0.1);
        }

        .detail-icon svg {
          color: #D4AF7A;
        }

        .detail-content h3 {
          font-size: var(--fr-fs-eyebrow);
          font-family: var(--fr-font-sans);
          line-height: var(--fr-lh-snug);
          font-weight: var(--fr-fw-medium);
          color: #999;
          text-transform: uppercase;
          letter-spacing: var(--fr-track-eyebrow);
          margin: 0 0 8px 0;
        }

        .detail-content p {
          font-size: var(--fr-fs-body);
          color: #2d2d2d;
          margin: 0;
          line-height: var(--fr-lh-normal);
        }

        .detail-content p.days {
          color: #666;
          font-size: var(--fr-fs-caption);
          margin-top: 4px;
        }

        .detail-content a {
          color: #D4AF7A;
          text-decoration: none;
          transition: color 0.3s;
        }

        .detail-content a:hover {
          color: #c49a6a;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          margin-top: auto;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
        }

        .btn-primary {
          background: linear-gradient(135deg, #D4AF7A 0%, #c49a6a 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(212, 175, 122, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 175, 122, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #D4AF7A;
          border-color: #D4AF7A;
        }

        .btn-secondary:hover {
          background: #faf5ed;
          transform: translateY(-2px);
        }

        .map-container {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }

        .map-wrapper {
          width: 100%;
          height: 100%;
          min-height: 500px;
          background: #f0f0f0;
        }

        .map-overlay-link {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: white;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          color: #2d2d2d;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transition: all 0.3s;
        }

        .map-overlay-link:hover {
          background: #D4AF7A;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212, 175, 122, 0.4);
        }

        .expansion-notice {
          text-align: center;
          background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
          padding: 60px 40px;
          border-radius: 24px;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .expansion-notice::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top right, rgba(212, 175, 122, 0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .notice-icon {
          width: 96px;
          height: 96px;
          margin: 0 auto 24px;
          background: rgba(212, 175, 122, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .notice-icon svg {
          color: #D4AF7A;
        }

        .expansion-notice h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          margin: 0 0 16px 0;
          color: white;
        }

        .expansion-notice p {
          font-size: var(--fr-fs-lead);
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          margin: 0 auto;
          line-height: var(--fr-lh-relaxed);
        }

        @media (max-width: 1024px) {
          .main-store-card {
            grid-template-columns: 1fr;
            padding: 32px;
          }

          .map-wrapper {
            min-height: 400px;
          }
        }

        @media (max-width: 768px) {
          .stores-page {
            padding: 90px 16px 60px;
          }

          .stores-hero {
            padding: 40px 16px;
          }

          .stores-hero h1 {
          }

          .subtitle {
          }

          .main-store-card {
            padding: 24px;
          }

          .store-name {
          }

          .action-buttons {
            flex-direction: column;
          }

          .expansion-notice {
            padding: 40px 24px;
          }

          .expansion-notice h2 {
          }
        }
      `}</style>
    </div>
  );
}

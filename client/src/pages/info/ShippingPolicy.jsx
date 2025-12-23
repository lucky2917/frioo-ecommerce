import React from 'react';

export default function ShippingPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Shipping & Delivery Policy</h1>
        <p className="updated">Last updated: December 22, 2025</p>

        <section>
          <h2>1. Delivery Areas</h2>
          <p>We currently deliver within Hyderabad city limits. Check your delivery area at checkout.</p>
        </section>

        <section>
          <h2>2. Delivery Times</h2>
          <p>Standard delivery: 30-60 minutes during business hours (7 AM - 10 PM). Orders placed before 9:00 PM are delivered the same day.</p>
        </section>

        <section>
          <h2>3. Delivery Charges</h2>
          <ul>
            <li>Free delivery on orders above ₹299</li>
            <li>₹49 delivery fee for orders below ₹299</li>
            <li>Minimum order: ₹99</li>
          </ul>
        </section>

        <section>
          <h2>4. Order Tracking</h2>
          <p>Track your order in real-time through our website or mobile app. You'll receive SMS updates at each stage.</p>
        </section>

        <section>
          <h2>5. Pickup Option</h2>
          <p>Choose store pickup for no additional charges. Orders are ready for pickup within 15-20 minutes.</p>
        </section>

        <section>
          <h2>6. Delivery Issues</h2>
          <p>If you experience delivery issues, contact us at +91 9347043329 or frioo.trust@gmail.com</p>
        </section>
      </div>

      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          padding: 120px 20px 60px;
          background: #fafafa;
        }
        .legal-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 48px;
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
        }
        h1 {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          color: #2d2d2d;
          margin: 0 0 12px 0;
        }
        .updated {
          color: #999;
          font-size: 0.9rem;
          margin: 0 0 32px 0;
        }
        section {
          margin-bottom: 32px;
        }
        h2 {
          font-size: 1.5rem;
          color: #2d2d2d;
          margin: 0 0 16px 0;
        }
        p, li {
          font-size: 1rem;
          line-height: 1.8;
          color: #555;
        }
        ul {
          padding-left: 20px;
        }
        @media (max-width: 768px) {
          .legal-page { padding: 100px 16px 40px; }
          .legal-container { padding: 24px; }
          h1 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
}

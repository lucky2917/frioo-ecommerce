import React from 'react';
import SEO from '../../components/SEO';

export default function ShippingPolicy() {
  return (
    <div className="legal-page">
      <SEO
        title="Shipping & Delivery Policy — Fruit Delivery in Vizag"
        description="Frioo's shipping and delivery policy for Visakhapatnam. Free delivery on orders above ₹299. 30-60 min delivery within 6km radius in Vizag. Open 7AM-10PM daily."
        canonical="/shipping"
        keywords="frioo delivery vizag, fruit delivery charges vizag, frioo shipping visakhapatnam, free delivery fruits vizag"
      />
      <div className="legal-container">
        <h1>Shipping & Delivery Policy</h1>
        <p className="updated">Last updated: December 22, 2025</p>

        <section>
          <h2>1. Delivery Areas</h2>
          <p>We currently deliver within a 6km radius of our Allipuram store in Visakhapatnam (Vizag). Check your delivery area at checkout.</p>
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
        .legal-container h1 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
          margin: 0 0 12px 0;
        }
        .legal-container .updated {
          color: #999;
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          margin: 0 0 32px 0;
        }
        .legal-container section {
          margin-bottom: 32px;
        }
        .legal-container h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
          margin: 0 0 16px 0;
        }
        .legal-container p,
        .legal-container li {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-relaxed);
          color: #555;
        }
        .legal-container ul {
          padding-left: 20px;
        }
        @media (max-width: 768px) {
          .legal-page { padding: 100px 16px 40px; }
          .legal-container { padding: 24px; }
        }
      `}</style>
    </div>
  );
}

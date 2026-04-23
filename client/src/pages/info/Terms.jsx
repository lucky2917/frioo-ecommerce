import React from 'react';
import SEO from '../../components/SEO';

export default function Terms() {
  return (
    <div className="legal-page">
      <SEO
        title="Terms of Service"
        description="Frioo's terms of service for ordering fresh fruits, juices and salads in Visakhapatnam. Read our terms for orders, pricing, and service usage."
        canonical="/terms"
      />
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="updated">Last updated: December 22, 2025</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using Frioo's services, you accept and agree to be bound by these Terms of Service.</p>
        </section>

        <section>
          <h2>2. Use of Services</h2>
          <p>You agree to use our services only for lawful purposes and in accordance with these Terms.</p>
        </section>

        <section>
          <h2>3. Orders and Pricing</h2>
          <p>All prices are in INR and subject to change. We reserve the right to refuse or cancel any order.</p>
        </section>

        <section>
          <h2>4. Product Availability</h2>
          <p>Products are subject to availability. We reserve the right to substitute items of equal or greater value if products are unavailable.</p>
        </section>

        <section>
          <h2>5. Limitation of Liability</h2>
          <p>Frioo shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
        </section>

        <section>
          <h2>6. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of our services constitutes acceptance of modified terms.</p>
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
        p {
          font-size: 1rem;
          line-height: 1.8;
          color: #555;
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

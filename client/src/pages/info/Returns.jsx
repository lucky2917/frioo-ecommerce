import React from 'react';
import SEO from '../../components/SEO';

export default function Returns() {
  return (
    <div className="legal-page">
      <SEO
        title="Returns & Refunds Policy"
        description="Frioo's returns and refunds policy for fresh fruit and juice orders in Visakhapatnam. Learn about refund eligibility, process, and order cancellation."
        canonical="/returns"
      />
      <div className="legal-container">
        <h1>Returns & Refunds Policy</h1>
        <p className="updated">Last updated: December 22, 2025</p>

        <section>
          <h2>1. Return Policy</h2>
          <p>Due to the fresh and perishable nature of our products, we do not accept returns under normal circumstances.</p>
        </section>

        <section>
          <h2>2. Damaged or Incorrect Items</h2>
          <p>If you receive damaged or incorrect items, please contact us immediately at +91 9347043329 within 2 hours of delivery.</p>
        </section>

        <section>
          <h2>3. Refund Eligibility</h2>
          <ul>
            <li>Damaged products upon delivery</li>
            <li>Incorrect items received</li>
            <li>Order cancellation before preparation</li>
            <li>Non-delivery of order</li>
          </ul>
        </section>

        <section>
          <h2>4. Refund Process</h2>
          <p>Approved refunds are processed within 5-7 business days to your original payment method. You'll receive an email confirmation once processed.</p>
        </section>

        <section>
          <h2>5. Order Cancellation</h2>
          <p>You can cancel your order before it's marked as "Preparing". Once preparation starts, cancellation is not possible.</p>
        </section>

        <section>
          <h2>6. Contact Support</h2>
          <p>For any refund or return queries, contact us at frioo.trust@gmail.com or call +91 9347043329</p>
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

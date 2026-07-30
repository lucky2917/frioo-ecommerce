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

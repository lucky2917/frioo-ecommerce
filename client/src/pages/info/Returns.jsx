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
          padding: var(--fr-s10) var(--fr-s5) var(--fr-s9);
          background: var(--fr-canvas);
        }
        .legal-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: var(--fr-s8);
          border-radius: var(--fr-r-surface);
          box-shadow: var(--fr-elev-1);
        }
        .legal-container h1 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: var(--fr-text);
          margin: 0 0 var(--fr-s3) 0;
        }
        .legal-container .updated {
          color: var(--fr-text-3);
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-normal);
          margin: 0 0 var(--fr-s6) 0;
        }
        .legal-container section {
          margin-bottom: var(--fr-s6);
        }
        .legal-container h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: var(--fr-text);
          margin: 0 0 var(--fr-s4) 0;
        }
        .legal-container p,
        .legal-container li {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-relaxed);
          color: var(--fr-text-2);
        }
        .legal-container ul {
          padding-left: var(--fr-s5);
        }
        @media (max-width: 768px) {
          .legal-page { padding: var(--fr-s9) var(--fr-s4) var(--fr-s7); }
          .legal-container { padding: var(--fr-s5); }
        }
      `}</style>
    </div>
  );
}

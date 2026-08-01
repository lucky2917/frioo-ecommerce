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
        .legal-container p {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-body);
          font-weight: var(--fr-fw-regular);
          line-height: var(--fr-lh-relaxed);
          color: var(--fr-text-2);
        }
        @media (max-width: 768px) {
          .legal-page { padding: var(--fr-s9) var(--fr-s4) var(--fr-s7); }
          .legal-container { padding: var(--fr-s5); }
        }
      `}</style>
    </div>
  );
}

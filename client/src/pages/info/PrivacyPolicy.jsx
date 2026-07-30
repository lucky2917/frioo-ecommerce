import React from 'react';
import SEO from '../../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <SEO
        title="Privacy Policy"
        description="Frioo's privacy policy. Learn how we collect, use, and protect your personal information when you shop for fresh fruits and juices in Visakhapatnam."
        canonical="/privacy"
      />
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: December 22, 2025</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including name, email address, phone number, delivery address, and payment information.</p>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Send you order confirmations and updates</li>
            <li>Improve our products and services</li>
            <li>Send promotional communications (with your consent)</li>
          </ul>
        </section>

        <section>
          <h2>3. Information Sharing</h2>
          <p>We do not sell or share your personal information with third parties except as necessary to provide our services (payment processing, delivery services).</p>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or destruction.</p>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. Contact us at frioo.trust@gmail.com to exercise these rights.</p>
        </section>

        <section>
          <h2>6. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at frioo.trust@gmail.com</p>
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

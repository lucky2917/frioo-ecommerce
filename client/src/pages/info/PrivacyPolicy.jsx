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

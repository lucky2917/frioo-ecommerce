import React from 'react';
import SEO from '../../components/SEO';

export default function Contact() {




  return (
    <div className="contact-page">
      <SEO
        title="Contact Frioo Vizag — Get in Touch for Fresh Fruit Delivery"
        description="Contact Frioo in Visakhapatnam for fresh fruit delivery, juice orders, or any queries. Call +91 9347043329 or email frioo.trust@gmail.com. Visit our store in Allipuram, Vizag."
        canonical="/contact"
        keywords="contact frioo vizag, frioo phone number, frioo visakhapatnam address, fruit delivery contact vizag, fresh juice order vizag"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Frioo Vizag",
          "url": "https://frioo.in/contact",
          "mainEntity": {
            "@type": "LocalBusiness",
            "name": "Frioo - Fresh Fruits & Juices Vizag",
            "telephone": "+91-9347043329",
            "email": "frioo.trust@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Railway Quarters, Allipuram",
              "addressLocality": "Visakhapatnam",
              "addressRegion": "Andhra Pradesh",
              "postalCode": "530004",
              "addressCountry": "IN"
            }
          }
        }}
      />
      <div className="contact-container">
        <div className="contact-header">
          <h1>Contact Frioo Vizag</h1>
          <p className="subtitle">We'd love to hear from you in Visakhapatnam</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <h2>Contact Information</h2>

            <div className="info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <div>
                <h3>Phone</h3>
                <p>+91 9347043329</p>
              </div>
            </div>

            <div className="info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <div>
                <h3>Email</h3>
                <p>frioo.trust@gmail.com</p>
              </div>
            </div>

            <div className="info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
              </svg>
              <div>
                <h3>Address</h3>
                <p>Railway Quarters, Allipuram<br />Visakhapatnam, Andhra Pradesh 530004<br />India</p>
              </div>
            </div>

            <div className="info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <h3>Business Hours</h3>
                <p>Monday - Sunday<br />7:00 AM - 10:00 PM</p>
              </div>
            </div>
          </div>

          <div className="contact-form-wrapper">
            <h2>Talk to us</h2>
            <p className="contact-unavailable-lead">
              Online messages aren&apos;t running yet, so anything sent here would go nowhere.
              Call or email instead and a person will pick it up.
            </p>
            <div className="contact-direct">
              <a className="contact-direct-action" href="tel:+919347043329">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                Call +91 93470 43329
              </a>
              <a className="contact-direct-action contact-direct-secondary" href="mailto:frioo.trust@gmail.com">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                Email frioo.trust@gmail.com
              </a>
            </div>
            <p className="contact-unavailable-note">We answer between 7:00 AM and 10:00 PM, every day.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .contact-page {
          min-height: 100vh;
          padding: 120px 20px 60px;
          background: linear-gradient(to bottom, var(--fr-surface-2) 0%, #ffffff 100%);
        }

        .contact-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .contact-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .contact-header h1 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: var(--fr-text);
          margin: 0 0 12px 0;
        }

        .subtitle {
          font-size: var(--fr-fs-lead);
          color: var(--fr-brand);
          font-weight: var(--fr-fw-regular);
        }

        .contact-content {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 48px;
        }

        .contact-info {
          background: white;
          padding: 40px;
          border-radius: var(--fr-r-surface);
          box-shadow: var(--fr-elev-2);
          height: fit-content;
        }

        .contact-info h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: var(--fr-text);
          margin: 0 0 32px 0;
        }

        .info-item {
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-item svg {
          color: var(--fr-brand);
          flex-shrink: 0;
        }

        .info-item h3 {
          font-size: var(--fr-fs-lead);
          font-family: var(--fr-font-sans);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          font-weight: var(--fr-fw-medium);
          color: var(--fr-text);
          margin: 0 0 8px 0;
        }

        .info-item p {
          font-size: var(--fr-fs-body);
          color: var(--fr-text-2);
          margin: 0;
          line-height: var(--fr-lh-normal);
        }

        .contact-form-wrapper {
          background: white;
          padding: 40px;
          border-radius: var(--fr-r-surface);
          box-shadow: var(--fr-elev-2);
        }

        .contact-form-wrapper h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: var(--fr-text);
          margin: 0 0 24px 0;
        }

        .contact-unavailable-lead { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-2); margin: 0 0 24px; max-width: var(--fr-measure); }
        .contact-direct { display: flex; flex-direction: column; gap: 12px; }
        .contact-direct-action { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 48px; padding: 0 20px; border-radius: var(--fr-r-control); background: var(--fr-brand); color: var(--fr-on-brand); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); }
        .contact-direct-action:hover { background: var(--fr-brand-press); }
        .contact-direct-secondary { background: var(--fr-surface); color: var(--fr-text); border: 1px solid var(--fr-line-strong); }
        .contact-direct-secondary:hover { background: var(--fr-surface-2); }
        .contact-unavailable-note { font-family: var(--fr-font-sans); font-size: var(--fr-fs-caption); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-normal); color: var(--fr-text-3); margin: 16px 0 0; }
        .success-message {
          background: #4CAF50;
          color: white;
          padding: 16px;
          border-radius: var(--fr-r-card);
          margin-bottom: 24px;
          text-align: center;
          font-weight: var(--fr-fw-regular);
          font-size: var(--fr-fs-body);
          line-height: var(--fr-lh-normal);
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field label {
          font-size: var(--fr-fs-caption);
          font-weight: var(--fr-fw-medium);
          color: var(--fr-text);
        }

        .form-field input,
        .form-field textarea {
          padding: 12px 16px;
          border: 2px solid #e5e5e5;
          border-radius: var(--fr-r-card);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-normal);
          font-family: var(--fr-font-sans);
          transition: all 0.3s;
          outline: none;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          border-color: var(--fr-brand);
          box-shadow: 0 0 0 3px var(--fr-line);
        }

        .form-field textarea {
          resize: vertical;
          min-height: 120px;
        }

        .submit-button {
          background: var(--fr-brand);
          color: white;
          padding: 16px 32px;
          border: none;
          border-radius: var(--fr-r-card);
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }

        .submit-button:hover {
          background: var(--fr-brand);
          transform: translateY(-2px);
          box-shadow: var(--fr-elev-2);
        }

        @media (max-width: 968px) {
          .contact-content {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 768px) {
          .contact-page {
            padding: 100px 16px 40px;
          }

          .contact-info,
          .contact-form-wrapper {
            padding: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

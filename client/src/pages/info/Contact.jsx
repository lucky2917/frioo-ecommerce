import React from 'react';
import SEO from '../../components/SEO';

export default function Contact() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <div>
                <h3>Phone</h3>
                <p>+91 9347043329</p>
              </div>
            </div>

            <div className="info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <div>
                <h3>Email</h3>
                <p>frioo.trust@gmail.com</p>
              </div>
            </div>

            <div className="info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
              </svg>
              <div>
                <h3>Address</h3>
                <p>Railway Quarters, Allipuram<br />Visakhapatnam, Andhra Pradesh 530004<br />India</p>
              </div>
            </div>

            <div className="info-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <h2>Send us a Message</h2>
            {submitted && (
              <div className="success-message">
                ✓ Thank you! We'll get back to you soon.
              </div>
            )}
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="form-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 1234567890"
                  />
                </div>
                <div className="form-field">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Tell us more..."
                />
              </div>

              <button type="submit" className="submit-button">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .contact-page {
          min-height: 100vh;
          padding: 120px 20px 60px;
          background: linear-gradient(to bottom, #faf5ed 0%, #ffffff 100%);
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
          color: #2d2d2d;
          margin: 0 0 12px 0;
        }

        .subtitle {
          font-size: var(--fr-fs-lead);
          color: #D4AF7A;
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
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          height: fit-content;
        }

        .contact-info h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
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
          color: #D4AF7A;
          flex-shrink: 0;
        }

        .info-item h3 {
          font-size: var(--fr-fs-lead);
          font-family: var(--fr-font-sans);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          font-weight: var(--fr-fw-medium);
          color: #2d2d2d;
          margin: 0 0 8px 0;
        }

        .info-item p {
          font-size: var(--fr-fs-body);
          color: #666;
          margin: 0;
          line-height: var(--fr-lh-normal);
        }

        .contact-form-wrapper {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        .contact-form-wrapper h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
          margin: 0 0 24px 0;
        }

        .success-message {
          background: #4CAF50;
          color: white;
          padding: 16px;
          border-radius: 8px;
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
          color: #2d2d2d;
        }

        .form-field input,
        .form-field textarea {
          padding: 12px 16px;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-normal);
          font-family: var(--fr-font-sans);
          transition: all 0.3s;
          outline: none;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          border-color: #D4AF7A;
          box-shadow: 0 0 0 3px rgba(212, 175, 122, 0.1);
        }

        .form-field textarea {
          resize: vertical;
          min-height: 120px;
        }

        .submit-button {
          background: #D4AF7A;
          color: white;
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
        }

        .submit-button:hover {
          background: #c49a6a;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(212, 175, 122, 0.3);
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

          .contact-header h1 {
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

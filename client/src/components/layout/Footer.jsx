import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      alert('Thank you for subscribing!');
      setEmail('');
    }
  };

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-col footer-about">
            <h3 className="footer-logo">Frioo.</h3>
            <p className="footer-tagline">Fresh fruits, juices & salads in Visakhapatnam.</p>
            <p className="footer-description">
              Vizag's favourite destination for fresh fruits, pure juices, fruit milkshakes, and healthy salads.
              Made fresh daily from farm-sourced ingredients. Delivering within 6km in Visakhapatnam.
            </p>
            <address className="footer-address" style={{fontStyle: 'normal', color: '#B0B0B0', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '15px'}}>
              Railway Quarters, Allipuram<br />
              Visakhapatnam, AP 530004<br />
              India
            </address>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="white" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 0-3.26 19.45c-.08-.73-.15-1.85.03-2.65l1.24-5.25s-.32-.63-.32-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.57 2.25-.87 3.5-.25 1.04.52 1.88 1.54 1.88 1.85 0 3.27-1.95 3.27-4.76 0-2.49-1.79-4.23-4.35-4.23-2.96 0-4.7 2.22-4.7 4.51 0 .89.34 1.85.77 2.37.08.1.1.19.07.3l-.28 1.17c-.04.18-.15.22-.34.13-1.3-.6-2.11-2.49-2.11-4 0-3.27 2.38-6.28 6.86-6.28 3.6 0 6.4 2.57 6.4 6 0 3.58-2.26 6.46-5.39 6.46-1.05 0-2.04-.55-2.38-1.19l-.65 2.47c-.23.9-.86 2.03-1.28 2.72A10 10 0 1 0 12 2z" fill="white" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/shop">Shop All</Link></li>
              <li><Link to="/shop?category=juices">Pure Juices</Link></li>
              <li><Link to="/shop?category=shakes">Fruit Shakes</Link></li>
              <li><Link to="/shop?category=salads">Fresh Salads</Link></li>
              <li><Link to="/shop?category=fruits">Fresh Fruits</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Customer Service</h4>
            <ul className="footer-links">
              <li><Link to="/orders">Track Order</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/help">Help & FAQs</Link></li>
              <li><Link to="/stores">Our Stores</Link></li>
              <li><Link to="/returns">Returns</Link></li>
            </ul>
          </div>

          <div className="footer-col footer-newsletter">
            <h4 className="footer-heading">Stay Fresh</h4>
            <p className="newsletter-text">Subscribe to get special offers, free giveaways, and updates.</p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-btn">Subscribe</button>
            </form>
            <div className="footer-contact">
              <p className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                +91 9347043329
              </p>
              <p className="contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                frioo.trust@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <p className="footer-copyright">© 2025 Frioo. All rights reserved. Made with ❤️ for healthy living.</p>
            <div className="footer-legal">
              <Link to="/privacy">Privacy Policy</Link>
              <span className="separator">•</span>
              <Link to="/terms">Terms of Service</Link>
              <span className="separator">•</span>
              <Link to="/shipping">Shipping Policy</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: linear-gradient(135deg, #2D2D2D 0%, #1a1a1a 100%);
          color: #E0E0E0;
          margin-top: auto;
        }

        .footer-main {
          padding: 60px 0 40px;
          border-bottom: 1px solid rgba(212, 175, 122, 0.2);
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 40px;
        }

        .footer-container {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 50px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
        }

        .footer-logo {
          font-family: Georgia, serif;
          font-size: 2rem;
          color: #D4AF7A;
          margin: 0 0 12px 0;
          font-weight: 700;
        }

        .footer-tagline {
          color: #D4AF7A;
          font-size: 0.95rem;
          margin: 0 0 12px 0;
          font-weight: 500;
        }

        .footer-description {
          color: #B0B0B0;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0 0 20px 0;
        }

        .footer-social {
          display: flex;
          gap: 12px;
        }

        .social-link {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(212, 175, 122, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D4AF7A;
          transition: all 0.3s;
          text-decoration: none;
        }

        .social-link:hover {
          background: #D4AF7A;
          color: #1a1a1a;
          transform: translateY(-2px);
        }

        .footer-heading {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          margin: 0 0 20px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          padding-bottom: 8px;
        }

        .footer-heading::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30px;
          height: 2px;
          background: #D4AF7A;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-links a {
          color: #B0B0B0;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.3s;
          display: inline-block;
        }

        .footer-links a:hover {
          color: #D4AF7A;
          padding-left: 5px;
        }

        .newsletter-text {
          color: #B0B0B0;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }

        .newsletter-form {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .newsletter-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid rgba(212, 175, 122, 0.3);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s;
        }

        .newsletter-input::placeholder {
          color: #777;
        }

        .newsletter-input:focus {
          border-color: #D4AF7A;
          background: rgba(255, 255, 255, 0.08);
        }

        .newsletter-btn {
          padding: 10px 20px;
          background: #D4AF7A;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .newsletter-btn:hover {
          background: #C49A6A;
          transform: translateY(-1px);
        }

        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #B0B0B0;
          font-size: 0.85rem;
          margin: 0;
        }

        .contact-item svg {
          color: #D4AF7A;
          flex-shrink: 0;
        }

        .footer-bottom {
          padding: 30px 0;
          background: rgba(0, 0, 0, 0.5);
          border-top: 1px solid rgba(212, 175, 122, 0.1);
        }

        .footer-bottom .footer-container {
          display: block;
          text-align: center;
        }

        .footer-bottom-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
        }

        .footer-copyright {
          color: #999;
          font-size: 0.9rem;
          margin: 0;
        }

        .footer-legal {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .footer-legal a {
          color: #B0B0B0;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s;
          font-weight: 500;
        }

        .footer-legal a:hover {
          color: #D4AF7A;
        }

        .separator {
          color: #555;
        }

        @media (max-width: 1024px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        @media (max-width: 768px) {
          .footer-main {
            padding: 40px 0 30px;
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 35px;
            padding: 0 20px;
          }

          .footer-about {
            text-align: center;
          }

          .footer-social {
            justify-content: center;
          }

          .footer-heading::after {
            left: 50%;
            transform: translateX(-50%);
          }

          .footer-links {
            align-items: center;
          }

          .newsletter-form {
            flex-direction: column;
          }

          .footer-bottom-content {
            flex-direction: column;
            text-align: center;
          }

          .footer-legal {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
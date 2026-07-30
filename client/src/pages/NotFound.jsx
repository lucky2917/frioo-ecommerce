import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';

export default function NotFound() {
    return (
        <div className="not-found-page">
            <SEO title="Page Not Found" description="The page you are looking for doesn't exist." />
            <Navbar />

            <div className="nf-container">
                <div className="nf-content">
                    <div className="nf-emoji">🥛</div>
                    <h1 className="nf-title">404: Spilled Milk?</h1>
                    <p className="nf-text">
                        Oops! The page you're looking for seems to have been consumed (or doesn't exist).
                        Don't worry, there's plenty more freshness where that came from.
                    </p>
                    <Link to="/" className="nf-btn">Back to Freshness</Link>
                </div>
            </div>

            <Footer />

            <style>{`
        .not-found-page {
          background-color: #FAFAFA;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .nf-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }
        .nf-content {
          max-width: 500px;
          background: white;
          padding: 60px 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
          animation: fadeUp 0.5s ease;
        }
        .nf-emoji { font-size: 5rem; margin-bottom: 20px; }
        .nf-title {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-headline);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-tight);
          letter-spacing: var(--fr-track-headline);
          color: #3E2723;
          margin-bottom: 15px;
        }
        .nf-text {
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-lead);
          font-weight: var(--fr-fw-regular);
          color: #666;
          line-height: var(--fr-lh-normal);
          margin-bottom: 40px;
        }
        .nf-btn {
          display: inline-block;
          background: #C5A065;
          color: white;
          padding: 14px 35px;
          border-radius: 30px;
          font-family: var(--fr-font-sans);
          font-size: var(--fr-fs-control);
          font-weight: var(--fr-fw-medium);
          line-height: var(--fr-lh-control);
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(197, 160, 101, 0.3);
        }
        .nf-btn:hover {
          background: #1a1a1a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

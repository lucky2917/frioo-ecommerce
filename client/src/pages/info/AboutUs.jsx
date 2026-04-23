import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

export default function AboutUs() {
    return (
        <div className="info-page">
            <SEO
                title="About Frioo — Vizag's Favourite Fresh Fruit & Juice Destination"
                description="Learn about Frioo, Visakhapatnam's most-loved fresh fruit and juice brand. Born in Vizag, we deliver 100% natural fruits, juices, milkshakes & salads daily. Our story, mission & values."
                canonical="/about"
                keywords="about frioo vizag, frioo visakhapatnam, fruit shop vizag story, best juice shop vizag about, fresh fruit brand vizag"
            />
            <div className="info-container">
                <div className="info-header">
                    <h1>About Frioo — Vizag's Fresh Fruit Destination</h1>
                    <p className="subtitle">Fresh fruits, vibrant flavors, healthy living in Visakhapatnam</p>
                </div>

                <div className="info-content">
                    <section className="info-section">
                        <h2>Our Story in Vizag</h2>
                        <p>
                            Frioo was born in the heart of Visakhapatnam with a simple vision: to make healthy living accessible, delicious, and convenient for every family in Vizag.
                            We believe that fresh, nutritious fruits and juices should be a part of everyone's daily routine in Vizag, not a luxury.
                        </p>
                        <p>
                            What started as a small juice bar in Allipuram, Visakhapatnam has grown into Vizag's most trusted source for fresh juices, fruit shakes,
                            salads, and premium fruits. Every product we offer is crafted with care, using only the finest locally-sourced ingredients from Andhra Pradesh.
                        </p>
                    </section>

                    <section className="info-section">
                        <h2>Our Mission in Visakhapatnam</h2>
                        <p>
                            To deliver the perfect blend of taste and nutrition to every household in Vizag through handcrafted products made fresh daily.
                            We're committed to sourcing the best fruits from Andhra Pradesh farms and creating products that fuel healthy, vibrant lives across Visakhapatnam.
                        </p>
                    </section>

                    <section className="info-section">
                        <h2>What We Offer in Vizag</h2>
                        <div className="offerings-grid">
                            <div className="offering-card">
                                <h3>Pure Fruit Juices in Vizag</h3>
                                <p>100% fresh, no additives, no preservatives. Just pure fruit goodness delivered in Visakhapatnam.</p>
                            </div>
                            <div className="offering-card">
                                <h3>Fruit Milkshakes</h3>
                                <p>Creamy, delicious blends that satisfy your cravings while keeping you healthy.</p>
                            </div>
                            <div className="offering-card">
                                <h3>Fresh Salads</h3>
                                <p>Colorful, nutrient-packed salads made from the freshest ingredients.</p>
                            </div>
                            <div className="offering-card">
                                <h3>Fresh Fruits</h3>
                                <p>Premium quality fruits, carefully selected for maximum freshness and flavor.</p>
                            </div>
                        </div>
                    </section>

                    <section className="info-section">
                        <h2>Our Values</h2>
                        <ul className="values-list">
                            <li><strong>Quality First:</strong> We never compromise on ingredient quality</li>
                            <li><strong>Freshness Guaranteed:</strong> Everything is made fresh daily</li>
                            <li><strong>Customer Focus:</strong> Your health and satisfaction drive everything we do</li>
                            <li><strong>Sustainability:</strong> We care about the planet and practice responsible sourcing</li>
                        </ul>
                    </section>

                    <div className="cta-section">
                        <h2>Ready to start your healthy journey?</h2>
                        <Link to="/shop" className="cta-button">Shop Now</Link>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .info-page {
          min-height: 100vh;
          padding: 120px 20px 60px;
          background: linear-gradient(to bottom, #faf5ed 0%, #ffffff 100%);
        }

        .info-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .info-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .info-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          color: #2d2d2d;
          margin: 0 0 12px 0;
        }

        .subtitle {
          font-size: 1.25rem;
          color: #D4AF7A;
          font-weight: 500;
        }

        .info-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          padding: 48px;
        }

        .info-section {
          margin-bottom: 48px;
        }

        .info-section:last-child {
          margin-bottom: 0;
        }

        .info-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          color: #2d2d2d;
          margin: 0 0 20px 0;
        }

        .info-section p {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #555;
          margin: 0 0 16px 0;
        }

        .offerings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-top: 24px;
        }

        .offering-card {
          background: #faf5ed;
          padding: 24px;
          border-radius: 12px;
          border: 2px solid #f0e9dc;
        }

        .offering-card h3 {
          font-size: 1.25rem;
          color: #2d2d2d;
          margin: 0 0 12px 0;
        }

        .offering-card p {
          font-size: 0.95rem;
          color: #666;
          margin: 0;
        }

        .values-list {
          list-style: none;
          padding: 0;
          margin: 24px 0 0 0;
        }

        .values-list li {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #555;
          margin-bottom: 16px;
          padding-left: 32px;
          position: relative;
        }

        .values-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #D4AF7A;
          font-weight: bold;
          font-size: 1.25rem;
        }

        .cta-section {
          margin-top: 48px;
          padding-top: 48px;
          border-top: 2px solid #f0e9dc;
          text-align: center;
        }

        .cta-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          color: #2d2d2d;
          margin: 0 0 24px 0;
        }

        .cta-button {
          display: inline-block;
          background: #D4AF7A;
          color: white;
          padding: 16px 40px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.05rem;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cta-button:hover {
          background: #c49a6a;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(212, 175, 122, 0.3);
        }

        @media (max-width: 768px) {
          .info-page {
            padding: 100px 16px 40px;
          }

          .info-header h1 {
            font-size: 2.25rem;
          }

          .info-content {
            padding: 32px 24px;
          }

          .offerings-grid {
            grid-template-columns: 1fr;
          }

          .info-section h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
        </div>
    );
}

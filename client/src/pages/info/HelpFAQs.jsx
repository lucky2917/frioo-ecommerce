import React, { useState } from 'react';
import SEO from '../../components/SEO';

export default function HelpFAQs() {
    const [openFAQ, setOpenFAQ] = useState(null);

    const faqs = [
        {
            category: 'Orders & Delivery',
            questions: [
                {
                    q: 'How do I place an order?',
                    a: 'Simply browse our products, add items to your cart, and proceed to checkout. You can choose between delivery and pickup options.'
                },
                {
                    q: 'What are your delivery hours?',
                    a: 'We deliver from 7:00 AM to 10:00 PM, seven days a week. Orders placed before 9:00 PM are delivered the same day.'
                },
                {
                    q: 'Is there a minimum order amount?',
                    a: 'Yes, the minimum order amount is ₹99 for delivery. There is no minimum for store pickup.'
                },
                {
                    q: 'How long does delivery take?',
                    a: 'Standard delivery takes 30-60 minutes during business hours. You can track your order in real-time.'
                }
            ]
        },
        {
            category: 'Products',
            questions: [
                {
                    q: 'Are your juices 100% natural?',
                    a: 'Yes! All our juices are made from 100% fresh fruits with no added preservatives, colors, or artificial flavors.'
                },
                {
                    q: 'How fresh are the products?',
                    a: 'All products are made fresh daily. Fruits are sourced daily to ensure maximum freshness and quality.'
                },
                {
                    q: 'Do you offer organic products?',
                    a: 'We offer a selection of organic fruits and ingredients. Look for the "Organic" label on product pages.'
                }
            ]
        },
        {
            category: 'Payments',
            questions: [
                {
                    q: 'What payment methods do you accept?',
                    a: 'We accept all major payment methods including credit/debit cards, UPI, net banking, and digital wallets.'
                },
                {
                    q: 'Is it safe to pay online?',
                    a: 'Absolutely! We use industry-standard encryption and secure payment gateways to protect your information.'
                },
                {
                    q: 'Can I pay by cash?',
                    a: 'Cash on delivery is not available. We only accept online payments for hygiene and safety reasons.'
                }
            ]
        },
        {
            category: 'Returns & Refunds',
            questions: [
                {
                    q: 'What is your return policy?',
                    a: 'Due to the fresh nature of our products, we don\'t accept returns. If you receive a damaged or incorrect item, please contact us immediately.'
                },
                {
                    q: 'How do I get a refund?',
                    a: 'Refunds are processed for damaged/incorrect items or order cancellations before preparation. Contact our support team within 24 hours.'
                },
                {
                    q: 'How long do refunds take?',
                    a: 'Approved refunds are processed within 5-7 business days to your original payment method.'
                }
            ]
        }
    ];

    const toggleFAQ = (index) => {
        setOpenFAQ(openFAQ === index ? null : index);
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.flatMap(category =>
            category.questions.map(faq => ({
                "@type": "Question",
                "name": faq.q,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.a
                }
            }))
        )
    };

    return (
        <div className="faq-page">
            <SEO
                title="Help & FAQs — Frioo Fresh Fruit Delivery Vizag"
                description="Find answers to common questions about Frioo's fresh fruit delivery in Visakhapatnam. Orders, delivery hours, payment methods, returns & more. Delivering within 6km radius in Vizag."
                canonical="/faq"
                keywords="frioo faq, frioo vizag delivery, fruit delivery questions vizag, frioo payment methods, frioo return policy, fresh juice delivery hours vizag"
                structuredData={faqSchema}
            />
            <div className="faq-container">
                <div className="faq-header">
                    <h1>Help & FAQs</h1>
                    <p className="subtitle">Find answers to common questions</p>
                </div>

                <div className="faq-content">
                    {faqs.map((category, catIndex) => (
                        <div key={catIndex} className="faq-category">
                            <h2 className="category-title">{category.category}</h2>
                            <div className="faq-list">
                                {category.questions.map((faq, qIndex) => {
                                    const faqIndex = `${catIndex}-${qIndex}`;
                                    const isOpen = openFAQ === faqIndex;

                                    return (
                                        <div key={qIndex} className={`faq-item ${isOpen ? 'open' : ''}`}>
                                            <button
                                                className="faq-question"
                                                onClick={() => toggleFAQ(faqIndex)}
                                            >
                                                <span>{faq.q}</span>
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    className="chevron"
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                            <div className="faq-answer">
                                                <p>{faq.a}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="contact-cta">
                    <h2>Still have questions?</h2>
                    <p>Our support team is here to help you</p>
                    <a href="/contact" className="contact-button">Contact Us</a>
                </div>
            </div>

            <style jsx>{`
        .faq-page {
          min-height: 100vh;
          padding: 120px 20px 60px;
          background: linear-gradient(to bottom, #faf5ed 0%, #ffffff 100%);
        }

        .faq-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .faq-header h1 {
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

        .faq-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
          padding: 48px;
          margin-bottom: 48px;
        }

        .faq-category {
          margin-bottom: 40px;
        }

        .faq-category:last-child {
          margin-bottom: 0;
        }

        .category-title {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
          margin: 0 0 24px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #f0e9dc;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          border: 2px solid #f0e9dc;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .faq-item.open {
          border-color: #D4AF7A;
        }

        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          font-size: var(--fr-fs-control);
          font-family: var(--fr-font-sans);
          line-height: var(--fr-lh-control);
          font-weight: var(--fr-fw-medium);
          color: #2d2d2d;
          transition: all 0.3s;
        }

        .faq-question:hover {
          background: #faf5ed;
        }

        .faq-item.open .faq-question {
          background: #faf5ed;
        }

        .chevron {
          flex-shrink: 0;
          transition: transform 0.3s;
          color: #D4AF7A;
        }

        .faq-item.open .chevron {
          transform: rotate(180deg);
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }

        .faq-item.open .faq-answer {
          max-height: 500px;
        }

        .faq-answer p {
          padding: 0 24px 20px 24px;
          margin: 0;
          font-size: var(--fr-fs-body);
          line-height: var(--fr-lh-relaxed);
          color: #666;
        }

        .contact-cta {
          text-align: center;
          background: white;
          padding: 48px 32px;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }

        .contact-cta h2 {
          font-family: var(--fr-font-display);
          font-size: var(--fr-fs-title);
          font-weight: var(--fr-fw-bold);
          line-height: var(--fr-lh-snug);
          letter-spacing: var(--fr-track-headline);
          color: #2d2d2d;
          margin: 0 0 12px 0;
        }

        .contact-cta p {
          font-size: var(--fr-fs-body);
          line-height: var(--fr-lh-normal);
          color: #666;
          margin: 0 0 24px 0;
        }

        .contact-button {
          display: inline-block;
          background: #D4AF7A;
          color: white;
          padding: 16px 40px;
          border-radius: 8px;
          font-weight: var(--fr-fw-medium);
          font-size: var(--fr-fs-control);
          line-height: var(--fr-lh-control);
          text-decoration: none;
          transition: all 0.3s;
        }

        .contact-button:hover {
          background: #c49a6a;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(212, 175, 122, 0.3);
        }

        @media (max-width: 768px) {
          .faq-page {
            padding: 100px 16px 40px;
          }

          .faq-header h1 {
          }

          .faq-content {
            padding: 24px;
          }

          .faq-question {
            padding: 16px 20px;
          }
        }
      `}</style>
        </div>
    );
}

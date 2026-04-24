import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Environment } from '@react-three/drei';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import './FriooAI/FriooAI.css';

import { runFriooAI } from '../utils/friooAI';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { showToast } from '../utils/toast';

import ScrollBridge from './FriooAI/components/ScrollBridge';
import RobotScene from './FriooAI/components/RobotScene';
import HeroSection from './FriooAI/sections/HeroSection';
import CapabilitiesSection from './FriooAI/sections/CapabilitiesSection';
import PrivacySection from './FriooAI/sections/PrivacySection';
import BioScanForm from './FriooAI/components/BioScanForm';
import IdentityMorph from './FriooAI/components/IdentityMorph';

function Overlay({ viewState, formActions, setIntroComplete, scrollProgress, setCtaHovered, replayObj, setReplayObj, scrollControl }) {
    const { loading, results, formData, resultTab, resultTier, introComplete, ctaHovered } = viewState;
    const { updateForm, toggleAllergy, runAnalysis, handleOrder, setResultTab, setResultTier, scrollToSection } = formActions;

    useEffect(() => { const t = setTimeout(() => setIntroComplete(true), 3500); return () => clearTimeout(t); }, [setIntroComplete]);

    const [graphW, setGraphW] = useState('0%');
    const precisionVal = useMotionValue(0);

    const getCurrentPlan = () => {
        if (!results) return null;
        if (!results.results) return null;

        const plans = resultTab === 'salads' ? results.results.salads : results.results.juices;
        if (!plans) return null;

        return plans[resultTier] || null;
    };
    const activePlan = getCurrentPlan();

    return (
        <div className="v5-overlay-content">
            <HeroSection
                introComplete={introComplete}
                setIntroComplete={setIntroComplete}
                setCtaHovered={setCtaHovered}
                scrollToSection={scrollToSection}
            />

            <CapabilitiesSection />

            <section className="v5-sec action-sec">
                <div className="terminal-wrap">
                    <motion.div className="glass-terminal" initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}>
                        <div className="gt-head"><h3>BIO-SCAN TERMINAL v4.0</h3><div className="pulse-dot"></div></div>
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div key="loading" className="gt-state loading"><div className="scan-anim"></div><div className="scan-text">PROCESSING BIO-DATA...</div></motion.div>
                            ) : results ? (
                                <motion.div key="results" className="gt-state results">
                                    <div className="res-metrics-grid">
                                        <div className="metric-card"><span className="metric-label">BMI INDEX</span><span className="metric-value">{results.metrics?.bmi?.toFixed(1) || '--'}</span></div>
                                        <div className="metric-card"><span className="metric-label">HYDRATION</span><span className="metric-value">{results.metrics?.hydrationNeed > 0 ? 'LOW' : 'GOOD'}</span></div>
                                        <div className="metric-card"><span className="metric-label">SLEEP SCORE</span><span className="metric-value">{results.metrics?.sleepDebt > 0 ? 'DEFICIT' : 'OPTIMAL'}</span></div>
                                    </div>

                                    <div className="result-tabs">
                                        <button className={`tab-btn ${resultTab === 'salads' ? 'active' : ''}`} onClick={() => setResultTab('salads')}>SALAD BOWLS</button>
                                        <button className={`tab-btn ${resultTab === 'juices' ? 'active' : ''}`} onClick={() => setResultTab('juices')}>JUICE BLENDS</button>
                                    </div>

                                    <div className="tier-selector">
                                        <button className={`tier-pill ${resultTier === 'low' ? 'active' : ''}`} onClick={() => setResultTier('low')}>ESSENTIAL</button>
                                        <button className={`tier-pill ${resultTier === 'mid' ? 'active' : ''}`} onClick={() => setResultTier('mid')}>BALANCED</button>
                                        <button className={`tier-pill ${resultTier === 'high' ? 'active' : ''}`} onClick={() => setResultTier('high')}>PREMIUM</button>
                                    </div>

                                    {activePlan && (
                                        <div className="plan-card-pro">
                                            <div className="plan-header">
                                                <h4>{activePlan.title}</h4>
                                                <div className="plan-price">₹{activePlan.price}</div>
                                            </div>
                                            <p className="plan-desc">{activePlan.desc}</p>
                                            <div className="ingredients-list">
                                                <span className="ing-label">INGREDIENTS:</span>
                                                <div className="ing-tags">
                                                    {activePlan.fruits?.map((f, i) => (
                                                        <span key={i} className="ing-tag">{f.title}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button className="order-btn-pro" onClick={() => handleOrder(activePlan, resultTab)}>
                                                ADD TO CART
                                            </button>
                                        </div>
                                    )}
                                    <button className="reset-link" onClick={() => window.location.reload()}>← NEW ANALYSIS</button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" className="gt-state form">
                                    <BioScanForm
                                        formData={formData}
                                        updateForm={updateForm}
                                        toggleAllergy={toggleAllergy}
                                        runAnalysis={runAnalysis}
                                        loading={loading}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            <footer className="frioo-footer">
                <div className="footer-container">
                    <div className="footer-main">
                        <div className="footer-col brand-col">
                            <div className="footer-logo">FRIOO AI</div>
                            <p className="footer-tagline">Advanced nutrition intelligence powered by AI. Personalized meal plans decoded for your unique biology.</p>
                            <div className="footer-social">
                                <a href="https://twitter.com/frioo" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>
                                <a href="https://instagram.com/frioo" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                                <a href="https://linkedin.com/company/frioo" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div className="footer-col">
                            <h4 className="footer-heading">Products</h4>
                            <ul className="footer-links">
                                <li><a href="/shop">Salad Bowls</a></li>
                                <li><a href="/shop">Juice Blends</a></li>
                                <li><a href="/shop">Smoothie Packs</a></li>
                                <li><a href="/friooai">AI Nutrition</a></li>
                                <li><a href="/shop">Custom Plans</a></li>
                            </ul>
                        </div>

                        <div className="footer-col">
                            <h4 className="footer-heading">Resources</h4>
                            <ul className="footer-links">
                                <li><a href="/blog">Blog</a></li>
                                <li><a href="/recipes">Recipes</a></li>
                                <li><a href="/nutrition-guide">Nutrition Guide</a></li>
                                <li><a href="/faq">FAQs</a></li>
                                <li><a href="/support">Support</a></li>
                            </ul>
                        </div>

                        <div className="footer-col">
                            <h4 className="footer-heading">Company</h4>
                            <ul className="footer-links">
                                <li><a href="/about">About Us</a></li>
                                <li><a href="/careers">Careers</a></li>
                                <li><a href="/press">Press Kit</a></li>
                                <li><a href="/contact">Contact</a></li>
                                <li><a href="/partners">Partners</a></li>
                            </ul>
                        </div>

                        <div className="footer-col">
                            <h4 className="footer-heading">Legal</h4>
                            <ul className="footer-links">
                                <li><a href="/privacy">Privacy Policy</a></li>
                                <li><a href="/terms">Terms of Service</a></li>
                                <li><a href="/cookies">Cookie Policy</a></li>
                                <li><a href="/shipping">Shipping Policy</a></li>
                                <li><a href="/refunds">Refund Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-newsletter">
                        <h4 className="newsletter-heading">Stay Updated</h4>
                        <p className="newsletter-desc">Get the latest nutrition insights and exclusive offers.</p>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input type="email" placeholder="Enter your email" className="newsletter-input" />
                            <button type="submit" className="newsletter-btn">Subscribe</button>
                        </form>
                    </div>

                    <div className="footer-bottom">
                        <p>© 2024 Frioo. All rights reserved.</p>
                        <div className="footer-payment">
                            <span>Payment methods:</span>
                            <div className="payment-icons">
                                <span className="payment-icon">💳</span>
                                <span className="payment-icon">🏦</span>
                                <span className="payment-icon">📱</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function FriooAI() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [introComplete, setIntroComplete] = useState(false);

    const [ctaHovered, setCtaHovered] = useState(false);
    const [replayObj, setReplayObj] = useState({ c1: 0 });

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [resultTab, setResultTab] = useState('salads');
    const [resultTier, setResultTier] = useState('mid');
    const [formData, setFormData] = useState({ age: 25, height: 165, weight: 60, sleep: 7, water: 2, activity: 'moderate', stress: 'medium', goal: 'energy', allergies: [] });

    const scrollProgress = useMotionValue(0);
    const [scrollControl, setScrollControl] = useState(null);

    const updateForm = (f, v) => setFormData(p => ({ ...p, [f]: v }));
    const toggleAllergy = (a) => setFormData(p => ({ ...p, allergies: p.allergies.includes(a) ? p.allergies.filter(i => i !== a) : [...p.allergies, a] }));
    const runAnalysis = () => { setLoading(true); setTimeout(() => { setResults(runFriooAI(formData)); setLoading(false); }, 1500); };
    const handleOrder = (plan, type) => {
        const list = plan.fruits?.map(f => f.title).join(', ') || 'Custom blend';
        addToCart({ id: plan.id, title: `AI ${type}: ${plan.title}`, price: plan.price, images: ['/ai-bowl-placeholder.png'], description: plan.desc, isVirtual: true }, 'Standard', plan.price, { note: `Ingredients: ${list}` });
        showToast(`${plan.title} added to cart! 🎉`, 'success');
    };

    const scrollToSection = (idx) => scrollControl?.el?.scrollTo({ top: scrollControl.el.clientHeight * idx, behavior: 'smooth' });

    useEffect(() => {
        const rootEl = document.querySelector('.frioo-v5-root');
        if (!rootEl || !scrollControl?.el) return;

        const handleScroll = () => {
            const scrollPercent = rootEl.scrollTop / (rootEl.scrollHeight - rootEl.clientHeight);
            if (scrollControl.el) {
                scrollControl.el.scrollTop = scrollPercent * (scrollControl.el.scrollHeight - scrollControl.el.clientHeight);
            }
        };

        rootEl.addEventListener('scroll', handleScroll);
        return () => rootEl.removeEventListener('scroll', handleScroll);
    }, [scrollControl]);

    return (
        <div className="frioo-v5-root">
            <div className="top-bar">
                <div className="nav-logo">FRIOO AI</div>
                <button className="exit-btn" onClick={() => navigate('/')}>EXIT</button>
            </div>

            <Canvas shadows dpr={[1, 2]} camera={{ fov: 30, position: [0, 0, 8] }} className="v5-canvas">
                <ambientLight intensity={2.0} />
                <directionalLight position={[5, 8, 5]} intensity={2} castShadow />
                <pointLight position={[-5, 2, 5]} intensity={1.5} color="#00f0ff" />
                <React.Suspense fallback={null}>
                    <Environment preset="city" />
                    <ScrollControls pages={5} damping={0.1}>
                        <ScrollBridge motionValue={scrollProgress} setScrollControl={setScrollControl} />
                        <RobotScene introComplete={introComplete} scroll={scrollControl} ctaHovered={ctaHovered} />
                    </ScrollControls>
                </React.Suspense>
            </Canvas>

            <Overlay
                viewState={{ loading, results, formData, resultTab, resultTier, introComplete, ctaHovered }}
                formActions={{ updateForm, toggleAllergy, runAnalysis, handleOrder, setResultTab, setResultTier, scrollToSection }}
                setIntroComplete={setIntroComplete}
                scrollProgress={scrollProgress}
                setCtaHovered={setCtaHovered}
                replayObj={replayObj}
                setReplayObj={setReplayObj}
                scrollControl={scrollControl}
            />

        </div>
    );
}

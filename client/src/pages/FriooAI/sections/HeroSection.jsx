import { motion } from 'framer-motion';
import SystemFeed from '../components/SystemFeed';
import IdentityMorph from '../components/IdentityMorph';

function HeroSection({ introComplete, setIntroComplete, setCtaHovered, scrollToSection }) {
    return (
        <section className="v5-sec hero">
            <div className="v5-hero-grid">
                <div className="hero-left">
                    <SystemFeed />

                    <div className="identity-block">
                        <IdentityMorph onComplete={() => setIntroComplete(true)} />
                        <p className="subline">Advanced nutrition, decoded for your biology.</p>
                    </div>

                    <motion.button
                        className="hero-cta"
                        onClick={() => scrollToSection(4)}
                        onHoverStart={() => setCtaHovered(true)}
                        onHoverEnd={() => setCtaHovered(false)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: introComplete ? 1 : 0, y: introComplete ? 0 : 20 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        [ INITIALIZE BIO-SCAN ]
                    </motion.button>

                    <motion.div
                        className="scroll-cue"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: introComplete ? 1 : 0 }}
                        transition={{ delay: 1.2 }}
                    >
                        SCROLL TO ACCESS CORE MODULES ↓
                    </motion.div>
                </div>

                <div className="hero-right">
                </div>
            </div>
        </section>
    );
}

export default HeroSection;

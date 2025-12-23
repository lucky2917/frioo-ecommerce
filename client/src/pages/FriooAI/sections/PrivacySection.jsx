import { motion } from 'framer-motion';

/**
 * PrivacySection - Data privacy badge
 * Highlights zero data retention policy
 */
function PrivacySection() {
    return (
        <section className="v5-sec privacy-sec">
            <motion.div
                className="privacy-badge"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
            >
                <span className="icon">🛡️</span>
                <h4>ZERO_DATA_RETENTION_PROTOCOL</h4>
                <p>Local processing only.</p>
            </motion.div>
        </section>
    );
}

export default PrivacySection;

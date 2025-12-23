import { motion } from 'framer-motion';

/**
 * FadeIn - Ultra-smooth fade-in animation wrapper
 * 
 * For elements that need simple, elegant fade transitions
 */
export default function FadeIn({ children, delay = 0, duration = 0.4, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                duration,
                delay,
                ease: [0.16, 1, 0.3, 1] // Framer's expo out
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

import { motion } from 'framer-motion';

export default function FadeIn({ children, delay = 0, duration = 0.4, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
                duration,
                delay,
                ease: [0.16, 1, 0.3, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

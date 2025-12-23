import React from 'react';
import { motion } from 'framer-motion';

/**
 * ScrollReveal - Framer-Quality Scroll Animation Component
 * 
 * Optimized for smooth, glitch-free animations with professional easing.
 * No heavy blur effects, no retriggering glitches.
 */
export default function ScrollReveal({
    children,
    direction = 'up', // 'up', 'left', 'right'
    delay = 0,
    duration = 0.6,
    className = ''
}) {
    // Framer's signature easing curve (expo out)
    const customEase = [0.16, 1, 0.3, 1];

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 30 : 0,
            x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
            scale: 0.98, // Subtle scale (not too much!)
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                duration: duration,
                delay: delay,
                ease: customEase, // Smooth professional easing
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
                once: true, // ✅ NO GLITCHES - only animates once
                amount: 0.15, // Trigger when 15% visible
                margin: "0px 0px -100px 0px" // Start animation slightly before element enters
            }}
            variants={variants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

import React from 'react';
import { motion } from 'framer-motion';

export default function ScrollReveal({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.6,
    className = ''
}) {
    const customEase = [0.16, 1, 0.3, 1];

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === 'up' ? 30 : 0,
            x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
            scale: 0.98,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                duration: duration,
                delay: delay,
                ease: customEase,
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
                once: true,
                amount: 0.15,
                margin: "0px 0px -100px 0px"
            }}
            variants={variants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

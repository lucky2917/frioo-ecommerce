import React from 'react';
import { motion } from 'framer-motion';

export default function StaggerText({
    text,
    className = '',
    delay = 0,
    stagger = 0.04
}) {
    const words = text.split(" ");

    const customEase = [0.16, 1, 0.3, 1];

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: stagger,
                delayChildren: delay
            }
        }
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: customEase
            }
        },
        hidden: {
            opacity: 0,
            y: 15,
            transition: {
                duration: 0.5,
                ease: customEase
            }
        }
    };

    return (
        <motion.h2
            className={className}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{
                once: true,
                amount: 0.3
            }}
        >
            {words.map((word, index) => (
                <motion.span
                    variants={child}
                    style={{ display: 'inline-block', marginRight: '0.25em' }}
                    key={index}
                >
                    {word}
                </motion.span>
            ))}
        </motion.h2>
    );
}

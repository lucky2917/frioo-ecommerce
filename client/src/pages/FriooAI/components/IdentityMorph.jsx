import { useState, useEffect } from 'react';

/**
 * IdentityMorph - Animated text component for "FRIOO AI"
 * Features blinking cursor that morphs into "::ONLINE" status
 */
function IdentityMorph({ onComplete }) {
    const [suffix, setSuffix] = useState('_');

    useEffect(() => {
        // Blinking cursor phase
        const blinkInterval = setInterval(() => {
            setSuffix(prev => prev === '_' ? ' ' : '_');
        }, 500);

        // Morph to ::ONLINE after 3 seconds
        const morphTimeout = setTimeout(() => {
            clearInterval(blinkInterval);
            setSuffix('::ONLINE');
            if (onComplete) onComplete();
        }, 3000);

        return () => {
            clearInterval(blinkInterval);
            clearTimeout(morphTimeout);
        };
    }, [onComplete]);

    return (
        <h1 className="hero-identity">
            FRIOO<br />AI<span className={suffix !== '_' && suffix !== ' ' ? 'cyan-morph' : ''}>{suffix}</span>
        </h1>
    );
}

export default IdentityMorph;

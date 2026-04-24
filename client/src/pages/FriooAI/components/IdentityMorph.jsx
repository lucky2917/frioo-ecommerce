import { useState, useEffect } from 'react';

function IdentityMorph({ onComplete }) {
    const [suffix, setSuffix] = useState('_');

    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setSuffix(prev => prev === '_' ? ' ' : '_');
        }, 500);

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

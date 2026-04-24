import { useState, useEffect } from 'react';

function CountUp({ target, duration = 2, decimals = 1 }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp = null;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);

            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(ease * target);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [target, duration]);

    return <span className="val-dyn">{count.toFixed(decimals)}</span>;
}

export default CountUp;

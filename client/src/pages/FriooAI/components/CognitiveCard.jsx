import { motion } from 'framer-motion';
import { useEffect } from 'react';
import CountUp from './CountUp';

/**
 * CognitiveCard - Neural processing stats with animated bar graph
 */
function CognitiveCard({ replayKey, onReplay }) {
    const barHeights = [0.6, 0.85, 0.4, 0.95, 0.7, 0.3, 0.8, 0.55, 0.9, 0.75, 0.45, 0.85];

    // Trigger replay on mount (when card becomes active)
    useEffect(() => {
        onReplay?.();
    }, []);

    return (
        <div className="v4-card cognitive">
            <div className="card-top">
                <span className="code">SYS_01 // COGNITIVE_ENGINE</span>
                <h3>Neural Processing</h3>
            </div>

            <div className="metrics-grid">
                <div className="metric">
                    <div>
                        <CountUp key={replayKey} target={99.4} duration={2.5} />
                    </div>
                    <label>ACCURACY SCORE</label>
                </div>
            </div>

            <div className="bar-container">
                <div className="bar-bg-grid">
                    <span className="grid-row"></span>
                    <span className="grid-row"></span>
                    <span className="grid-row"></span>
                </div>
                <div className="bar-viz">
                    {barHeights.map((h, i) => (
                        <div key={i} className="bar-col">
                            <motion.div
                                className="bar-fill"
                                initial={{ height: '0%' }}
                                animate={{ height: `${h * 100}%` }}
                                transition={{
                                    duration: 1.2,
                                    delay: i * 0.04,
                                    ease: 'backOut'
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="graph-legend">
                <span>00Hz</span>
                <span>NEURAL_FLUX</span>
                <span>100Hz</span>
            </div>
        </div>
    );
}

export default CognitiveCard;

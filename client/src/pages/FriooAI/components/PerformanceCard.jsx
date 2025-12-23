import { motion } from 'framer-motion';

/**
 * PerformanceCard - Performance metrics comparison
 */
function PerformanceCard() {
    const metrics = [
        { label: 'FriooAI', value: 99.4, color: '#00f0ff' },
        { label: 'GenericAI', value: 87.2, color: '#666' },
        { label: 'NutriBase', value: 82.8, color: '#444' }
    ];

    return (
        <div className="v4-card performance">
            <div className="card-top">
                <span className="code">SYS_02 // PERFORMANCE_ENGINE</span>
                <h3>Accuracy Benchmark</h3>
            </div>

            <div className="perf-comparison">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="perf-row">
                        <span className="perf-label">{metric.label}</span>
                        <div className="perf-bar-container">
                            <motion.div
                                className="perf-bar"
                                style={{
                                    background: `linear-gradient(90deg, ${metric.color}, ${metric.color}88)`,
                                    boxShadow: `0 0 10px ${metric.color}44`
                                }}
                                initial={{ width: '0%' }}
                                animate={{ width: `${metric.value}%` }}
                                transition={{
                                    duration: 1.5,
                                    delay: idx * 0.2,
                                    ease: 'easeOut'
                                }}
                            />
                            <span className="perf-value">{metric.value}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="perf-stats">
                <div className="stat-item">
                    <span className="stat-value">2.3ms</span>
                    <span className="stat-label">Avg Response</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">99.9%</span>
                    <span className="stat-label">Uptime</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">15M+</span>
                    <span className="stat-label">Analyses</span>
                </div>
            </div>
        </div>
    );
}

export default PerformanceCard;

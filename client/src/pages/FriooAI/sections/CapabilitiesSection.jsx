import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import CountUp from '../components/CountUp';

/**
 * CapabilitiesSection - Sticky AI core + scrolling capability list
 * Professional data visualizations and benchmarks
 */
function CapabilitiesSection() {
    const [activeCapability, setActiveCapability] = useState(0);
    const capabilityRefs = [useRef(null), useRef(null), useRef(null)];

    // IntersectionObserver for capability tracking
    useEffect(() => {
        const observers = capabilityRefs.map((ref, index) => {
            if (!ref.current) return null;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveCapability(index);
                    }
                },
                { threshold: 0.6 }
            );

            observer.observe(ref.current);
            return observer;
        });

        return () => {
            observers.forEach((observer) => observer?.disconnect());
        };
    }, []);

    // Capability 1: Accuracy Graph Data
    const accuracyData = [
        { category: 'Macro', value: 99.4 },
        { category: 'Micro', value: 98.7 },
        { category: 'Context', value: 99.1 },
        { category: 'Inter.', value: 97.8 }
    ];

    // Capability 2: Benchmark Comparison
    const benchmarks = [
        { name: 'FriooAI', score: 99.4, color: '#00f0ff' },
        { name: 'GenericAI', score: 87.2, color: '#666' },
        { name: 'NutriBase', score: 82.8, color: '#444' }
    ];

    // Capability 3: Knowledge Base Stats
    const knowledgeStats = [
        { label: 'Compounds', value: 12.4, suffix: 'M', delay: 0 },
        { label: 'Regions', value: 195, suffix: '', delay: 0.2 },
        { label: 'Updates/day', value: 48, suffix: 'K', delay: 0.4 }
    ];

    return (
        <section className="capabilities-section">
            {/* Sticky AI Core Indicator */}
            <div className="ai-core-sticky">
                <div className="robot-viewport">
                    <div className="capability-indicator">
                        <div className="indicator-label">SYS_0{activeCapability + 1}</div>
                        <div className="indicator-status">ACTIVE</div>
                    </div>
                </div>
            </div>

            {/* Scrolling Capability List */}
            <div className="capability-list">
                {/* CAPABILITY 1: Cognitive Reasoning */}
                <div
                    ref={capabilityRefs[0]}
                    className={`capability-block ${activeCapability === 0 ? 'active' : ''}`}
                >
                    <div className="capability-number">SYS_01 // COGNITIVE_ENGINE</div>
                    <h3 className="capability-title">Neural Processing</h3>
                    <div className="capability-divider"></div>
                    <p className="capability-description">
                        Multi-dimensional analysis of biometric signals, lifestyle patterns, and dietary constraints in a single inference pass.
                    </p>

                    {/* Accuracy Graph */}
                    <div className="accuracy-graph">
                        {accuracyData.map((item, idx) => (
                            <div key={idx} className="accuracy-bar">
                                <div className="bar-label">{item.category}</div>
                                <div className="bar-track">
                                    <motion.div
                                        className="bar-fill"
                                        initial={{ width: '0%' }}
                                        whileInView={{ width: `${item.value}%` }}
                                        transition={{ duration: 1.5, delay: idx * 0.1 }}
                                        viewport={{ once: false }}
                                    />
                                </div>
                                <div className="bar-value">{item.value}%</div>
                            </div>
                        ))}
                    </div>

                    <div className="capability-metric">
                        <div className="metric-value">
                            <CountUp target={99.4} duration={2.5} />
                            <span className="metric-suffix">%</span>
                        </div>
                        <div className="metric-label">Overall Accuracy</div>
                    </div>
                </div>

                {/* CAPABILITY 2: Comparative Intelligence */}
                <div
                    ref={capabilityRefs[1]}
                    className={`capability-block ${activeCapability === 1 ? 'active' : ''}`}
                >
                    <div className="capability-number">SYS_02 // PERFORMANCE_ENGINE</div>
                    <h3 className="capability-title">Benchmark Performance</h3>
                    <div className="capability-divider"></div>
                    <p className="capability-description">
                        Real-time comparative analysis against industry-leading models and static nutrition databases.
                    </p>

                    {/* Benchmark Comparison */}
                    <div className="benchmark-chart">
                        {benchmarks.map((bench, idx) => (
                            <div key={idx} className="benchmark-row">
                                <div className="bench-name">{bench.name}</div>
                                <div className="bench-bar-container">
                                    <motion.div
                                        className="bench-bar"
                                        style={{
                                            background: `linear-gradient(90deg, ${bench.color}, ${bench.color}88)`,
                                            boxShadow: `0 0 10px ${bench.color}44`
                                        }}
                                        initial={{ width: '0%' }}
                                        whileInView={{ width: `${bench.score}%` }}
                                        transition={{ duration: 1.5, delay: idx * 0.2 }}
                                        viewport={{ once: false }}
                                    />
                                    <span className="bench-value">{bench.score}%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="capability-metric">
                        <div className="metric-value">
                            <CountUp target={2.3} duration={2} decimals={1} />
                            <span className="metric-suffix">ms</span>
                        </div>
                        <div className="metric-label">Avg Response Time</div>
                    </div>
                </div>

                {/* CAPABILITY 3: Global Knowledge Base */}
                <div
                    ref={capabilityRefs[2]}
                    className={`capability-block ${activeCapability === 2 ? 'active' : ''}`}
                >
                    <div className="capability-number">SYS_03 // KNOWLEDGE_BASE</div>
                    <h3 className="capability-title">Global Data Network</h3>
                    <div className="capability-divider"></div>
                    <p className="capability-description">
                        Continuously updated nutrition intelligence graph spanning regions, cuisines, and compound interactions.
                    </p>

                    {/* Knowledge Stats Grid */}
                    <div className="knowledge-grid">
                        {knowledgeStats.map((stat, idx) => (
                            <motion.div
                                key={idx}
                                className="knowledge-stat"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: stat.delay, duration: 0.6 }}
                                viewport={{ once: false }}
                            >
                                <div className="stat-number">
                                    <CountUp target={stat.value} duration={2.5} decimals={stat.suffix === 'M' ? 1 : 0} />
                                    <span className="stat-suffix">{stat.suffix}</span>
                                </div>
                                <div className="stat-label">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Network visualization placeholder */}
                    <div className="network-viz">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="network-node"
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 0.6 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                viewport={{ once: false }}
                                style={{
                                    left: `${Math.random() * 80 + 10}%`,
                                    top: `${Math.random() * 60 + 20}%`
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CapabilitiesSection;

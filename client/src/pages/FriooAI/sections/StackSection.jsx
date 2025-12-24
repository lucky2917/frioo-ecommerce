// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import CognitiveCard from '../components/CognitiveCard';
import PerformanceCard from '../components/PerformanceCard';
import KnowledgeCard from '../components/KnowledgeCard';

/**
 * StackSection - Cards with AnimatePresence for exclusive visibility
 * Only one card rendered at a time - true architectural separation
 */
function StackSection({ activeCard, replayObj, setReplayObj }) {
    const transitionConfig = {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] // iOS-style ease
    };

    return (
        <section className="v5-sec stack-sec">
            <div className="stack-wrapper">
                <AnimatePresence mode="wait">
                    {activeCard === 0 && (
                        <motion.div
                            key="card-1"
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.98 }}
                            transition={transitionConfig}
                            className="card-container"
                        >
                            <CognitiveCard
                                replayKey={replayObj.c1}
                                onReplay={() => setReplayObj(prev => ({ ...prev, c1: Math.random() }))}
                            />
                        </motion.div>
                    )}

                    {activeCard === 1 && (
                        <motion.div
                            key="card-2"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -40 }}
                            transition={transitionConfig}
                            className="card-container"
                        >
                            <PerformanceCard />
                        </motion.div>
                    )}

                    {activeCard === 2 && (
                        <motion.div
                            key="card-3"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -40 }}
                            transition={transitionConfig}
                            className="card-container"
                        >
                            <KnowledgeCard />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

export default StackSection;

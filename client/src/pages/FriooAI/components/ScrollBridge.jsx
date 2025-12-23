import { useEffect } from 'react';
import { useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/**
 * ScrollBridge - Bridges R3F scroll state to Framer Motion
 * Syncs ScrollControls offset with a Framer Motion value
 */
function ScrollBridge({ motionValue, setScrollControl }) {
    const scroll = useScroll();

    useEffect(() => {
        setScrollControl(scroll);
    }, [scroll, setScrollControl]);

    useFrame(() => {
        motionValue.set(scroll.offset);
    });

    return null;
}

export default ScrollBridge;

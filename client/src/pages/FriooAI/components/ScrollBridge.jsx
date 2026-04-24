import { useEffect } from 'react';
import { useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

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

import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const robotUrl = `/frioo_bot.glb?v=${Date.now()}`;

function RobotScene({ introComplete, scroll, ctaHovered }) {
    const { scene } = useGLTF(robotUrl);
    const modelRef = useRef();
    const opacityRef = useRef(0);
    const { width } = useThree((state) => state.viewport);
    const isMobile = width < 5;

    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.transparent = true;
                child.material.opacity = 0;
                child.material.side = THREE.DoubleSide;

                if (child.material.name.includes('Eye') || child.name.includes('Eye')) {
                    child.material.emissive = new THREE.Color('#00f0ff');
                    child.material.emissiveIntensity = 2;
                }

                if (child.material.metalness > 0) {
                    child.material.envMapIntensity = 1.0;
                }
            }
        });

        if (modelRef.current) {
            modelRef.current.rotation.order = 'YXZ';
        }
    }, [scene]);

    useFrame((state, delta) => {
        if (!modelRef.current) return;

        const rawOffset = scroll?.offset || 0;
        const offset = Math.min(Math.max(rawOffset, 0), 1);
        const damp = THREE.MathUtils.damp;

        opacityRef.current = damp(opacityRef.current, introComplete ? 1 : 0, 2.0, delta);
        scene.traverse((child) => {
            if (child.isMesh) child.material.opacity = opacityRef.current;
        });

        let tx = 0, ty = -2, calcRy = 0;
        let targetScale = 1.0;
        const isHero = offset < 0.1;

        if (isMobile) {
            if (offset < 0.1) {
                tx = 0;
                ty = -0.5;
                targetScale = 1.25;
                calcRy = 0;
            } else {
                tx = 0;
                ty = -2.5;
                targetScale = 1.1;
                calcRy = -0.2;
            }
        } else {
            if (offset < 0.2) {
                tx = 2.5;
                ty = -2.0;
                targetScale = 1.9;
                calcRy = -0.3;

                if (introComplete && ctaHovered) {
                    calcRy = -0.5;
                    ty = -1.95;
                }
            } else if (offset < 0.75) {
                tx = -2.8;
                ty = -2.5;
                calcRy = 0.5;
                targetScale = 2.4;
            } else {
                tx = 2.8;
                ty = -2.0;
                calcRy = -0.5;
                targetScale = 2.2;
            }
        }

        const SPEED = 2.0;
        modelRef.current.position.x = damp(modelRef.current.position.x, tx, SPEED, delta);
        modelRef.current.position.y = damp(modelRef.current.position.y, ty, SPEED, delta);
        modelRef.current.rotation.y = damp(
            modelRef.current.rotation.y,
            calcRy,
            ctaHovered ? 4.0 : 2.0,
            delta
        );

        const s = damp(modelRef.current.scale.x, targetScale, SPEED, delta);
        modelRef.current.scale.set(s, s, s);

        if (isHero && introComplete) {
            const time = state.clock.elapsedTime;

            const breathIntensity = 0.008;
            const breathCycle = Math.sin(time * 1.2) * breathIntensity;
            modelRef.current.position.y += breathCycle;

            if (!ctaHovered) {
                const headLookSpeed = 0.5;
                const headLookRange = 0.15;
                const headLookOffset = Math.sin(time * headLookSpeed) * headLookRange;
                modelRef.current.rotation.y += headLookOffset * 0.1;
            }

            const swayCycle = Math.sin(time * 0.7) * 0.003;
            modelRef.current.rotation.z = swayCycle;
        } else {
            const currentZ = modelRef.current.rotation.z;
            modelRef.current.rotation.z = damp(currentZ, 0, 2.0, delta);
        }
    });

    return <primitive ref={modelRef} object={scene} />;
}

useGLTF.preload(robotUrl);

export default RobotScene;

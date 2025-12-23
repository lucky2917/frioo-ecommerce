import { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const robotUrl = `/frioo_bot.glb?v=${Date.now()}`;

/**
 * RobotScene - 3D robot model with animations and interactions
 * Features:
 * - Fade-in reveal animation
 * - Scroll-based positioning and poses
 * - CTA hover interaction (gaze follow)
 * - Idle animations (breathing, head movement, sway)
 */
function RobotScene({ introComplete, scroll, ctaHovered }) {
    const { scene } = useGLTF(robotUrl);
    const modelRef = useRef();
    const opacityRef = useRef(0);
    const { width } = useThree((state) => state.viewport);
    const isMobile = width < 5;

    // Material setup (runs once)
    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.transparent = true;
                child.material.opacity = 0;
                child.material.side = THREE.DoubleSide;

                // Eye glow effect
                if (child.material.name.includes('Eye') || child.name.includes('Eye')) {
                    child.material.emissive = new THREE.Color('#00f0ff');
                    child.material.emissiveIntensity = 2;
                }

                if (child.material.metalness > 0) {
                    child.material.envMapIntensity = 1.0;
                }
            }
        });

        // Set rotation order for smoother animations
        if (modelRef.current) {
            modelRef.current.rotation.order = 'YXZ';
        }
    }, [scene]);

    // Animation loop
    useFrame((state, delta) => {
        if (!modelRef.current) return;

        const rawOffset = scroll?.offset || 0;
        const offset = Math.min(Math.max(rawOffset, 0), 1);
        const damp = THREE.MathUtils.damp;

        // A. Fade-in reveal
        opacityRef.current = damp(opacityRef.current, introComplete ? 1 : 0, 2.0, delta);
        scene.traverse((child) => {
            if (child.isMesh) child.material.opacity = opacityRef.current;
        });

        // B. Position & pose based on scroll
        let tx = 0, ty = -2, calcRy = 0;
        let targetScale = 1.0;
        const isHero = offset < 0.1;

        if (isMobile) {
            // Mobile: simpler layout
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
            // Desktop: 70/30 split with multiple poses
            if (offset < 0.2) {
                // HERO POSE
                tx = 2.5;
                ty = -2.0;
                targetScale = 1.9;
                calcRy = -0.3;

                // Gaze interaction on CTA hover
                if (introComplete && ctaHovered) {
                    calcRy = -0.5;
                    ty = -1.95;
                }
            } else if (offset < 0.75) {
                // ANALYZE POSE
                tx = -2.8;
                ty = -2.5;
                calcRy = 0.5;
                targetScale = 2.4;
            } else {
                // EXECUTE POSE
                tx = 2.8;
                ty = -2.0;
                calcRy = -0.5;
                targetScale = 2.2;
            }
        }

        // Smooth transitions
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

        // C. Idle animations (only in hero section)
        if (isHero && introComplete) {
            const time = state.clock.elapsedTime;

            // Breathing animation
            const breathIntensity = 0.008;
            const breathCycle = Math.sin(time * 1.2) * breathIntensity;
            modelRef.current.position.y += breathCycle;

            // Head look around (when not hovering on CTA)
            if (!ctaHovered) {
                const headLookSpeed = 0.5;
                const headLookRange = 0.15;
                const headLookOffset = Math.sin(time * headLookSpeed) * headLookRange;
                modelRef.current.rotation.y += headLookOffset * 0.1;
            }

            // Subtle body sway
            const swayCycle = Math.sin(time * 0.7) * 0.003;
            modelRef.current.rotation.z = swayCycle;
        } else {
            // Reset body sway when scrolling away
            const currentZ = modelRef.current.rotation.z;
            modelRef.current.rotation.z = damp(currentZ, 0, 2.0, delta);
        }
    });

    return <primitive ref={modelRef} object={scene} />;
}

// Preload the model
useGLTF.preload(robotUrl);

export default RobotScene;

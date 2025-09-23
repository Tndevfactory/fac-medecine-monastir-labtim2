// frontend/components/ui/AnimatedMedicalBackground.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';

interface AnimatedMedicalBackgroundProps {
  // No props needed for now, but can be extended for customization
}

// === LOGO CONFIGURATION ===
// Use your stethoscope_logo.png from the public directory.
// For other suggestions, you can uncomment and add them later using their paths or Data URIs.
const medicalImagePaths = [
  '/animated_background/stethoscope_logo.png',
  '/animated_background/pill_png.png',
  '/animated_background/medical.png',
  '/animated_background/ecg.png',
  '/animated_background/eeg.png',
       
  // `data:image/svg+xml,... (ECG Line SVG Data URI)`,
  // `data:image/svg+xml,... (DNA Helix SVG Data URI)`,
  // `data:image/svg+xml,... (Syringe SVG Data URI)`,
  // `data:image/svg+xml,... (Medical Cross SVG Data URI)`,
  // `data:image/svg+xml,... (Microscope SVG Data URI)`,
  // `data:image/svg+xml,... (Pill SVG Data URI)`,
  // `data:image/svg+xml,... (Ambulance SVG Data URI)`,
  // `data:image/svg+xml,... (Brain SVG Data URI)`,
  // `data:image/svg+xml,... (Bones SVG Data URI)`,
];
// === END LOGO CONFIGURATION ===


interface LogoState {
  id: string;
  imageUrl: string; // Now stores the image path
  initialX: number;
  currentY: number;
  speed: number;
  scale: number;
  rotation: number;
  opacity: number;
}

const AnimatedMedicalBackground: React.FC<AnimatedMedicalBackgroundProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [logos, setLogos] = useState<LogoState[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Initialize logos on mount
  useEffect(() => {
    console.log('AnimatedMedicalBackground: useEffect for initialization fired.');
    const newLogos: LogoState[] = [];
    const numLogos = 200; // Still many logos for density
    // const logoBaseSize = 60; // Base size for image container - now less critical as image itself dictates size

    if (!containerRef.current) {
      console.log('AnimatedMedicalBackground: containerRef.current is null on initial effect. Component might not be fully mounted or visible.');
      return;
    }

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    console.log(`AnimatedMedicalBackground: Container dimensions - Width: ${containerWidth}, Height: ${containerHeight}`);


    for (let i = 0; i < numLogos; i++) {
      const imageUrl = medicalImagePaths[Math.floor(Math.random() * medicalImagePaths.length)]; // Pick from available paths
      const initialX = Math.random() * containerWidth;
      const initialY = Math.random() * (containerHeight * 2) - containerHeight; // Distribute from -containerHeight to +containerHeight

      newLogos.push({
        id: `logo-${i}`,
        imageUrl,
        initialX,
        currentY: initialY,
        speed: 0.2 + Math.random() * 0.5, // Slower, varied speeds
        scale: 0.5 + Math.random() * 0.8, // Scale between 0.5 and 1.3
        rotation: Math.random() * 360,
        opacity: 0.1 + Math.random() * 0.3, // Very subtle opacity for depth
      });
    }
    setLogos(newLogos);
    console.log(`AnimatedMedicalBackground: Initialized ${newLogos.length} logos.`);

    return () => {
      console.log('AnimatedMedicalBackground: Cleanup for initialization effect.');
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Animation loop for vertical movement
  useEffect(() => {
    console.log('AnimatedMedicalBackground: useEffect for animation loop fired. Logos count:', logos.length);
    if (logos.length === 0) {
      console.log('AnimatedMedicalBackground: No logos to animate yet. Waiting for initialization.');
      return;
    }

    const animate = () => {
      // console.log('AnimatedMedicalBackground: Animation frame.'); // Too verbose, uncomment only if needed
      setLogos(prevLogos => {
        if (!containerRef.current) {
          console.warn('AnimatedMedicalBackground: containerRef.current is null during animation frame. Stopping animation.');
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
          }
          return prevLogos; // Return previous state if container is gone
        }

        const containerHeight = containerRef.current.offsetHeight;

        return prevLogos.map(logo => {
          let { currentY, speed, scale } = logo;
          const logoHeight = 50 * scale; // Approximate height for collision - adjust if PNGs are much larger/smaller

          currentY += speed;

          // Loop from top to bottom
          if (currentY > containerHeight + logoHeight / 2) {
            currentY = -logoHeight / 2; // Reset to just above the top
            // Optionally, randomize X position, rotation, speed, scale, opacity again when looping
            if (containerRef.current) {
              logo.initialX = Math.random() * containerRef.current.offsetWidth;
            }
            logo.rotation = Math.random() * 360;
            logo.speed = 0.2 + Math.random() * 0.9;
            logo.scale = 0.5 + Math.random() * 0.8;
            logo.opacity = 0.1 + Math.random() * 0.3;
          }

          return {
            ...logo,
            currentY,
          };
        });
      });
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);
    console.log('AnimatedMedicalBackground: Animation loop started.');

    return () => {
      console.log('AnimatedMedicalBackground: Cleanup for animation loop effect.');
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [logos]); // Rerun if logos array itself changes (e.g., on initial load)

  // --- DEBUGGING VISUAL CUE ---
  // A small, bright, fixed square to confirm the component is rendering
  const [debugSquareVisible, setDebugSquareVisible] = useState(false);
  useEffect(() => {
    // Set a timeout to make sure the component has had time to mount
    const timer = setTimeout(() => {
      setDebugSquareVisible(true);
      console.log('AnimatedMedicalBackground: Debug square set to visible.');
    }, 500); // Give it a little time after mount
    return () => clearTimeout(timer);
  }, []);
  // --- END DEBUGGING VISUAL CUE ---

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden"
      style={{
        backgroundColor: '#ffffff', // Pure white background
        pointerEvents: 'none', // Ensure no interaction with background elements
      }}
    >
      {/* DEBUGGING SQUARE - Will be a small red square at top-left if component renders
      {debugSquareVisible && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          width: '50px',
          height: '50px',
          backgroundColor: 'red',
          zIndex: 9999, // Ensure it's on top
        }}></div>
      )} */}

      {logos.map(logo => (
        <div
          key={logo.id}
          className="absolute"
          style={{
            left: logo.initialX, // Use initialX as fixed X position
            top: logo.currentY,
            transform: `translate(-50%, -50%) rotate(${logo.rotation}deg) scale(${logo.scale})`,
            opacity: logo.opacity, // Apply random opacity
            width: '80px', // Base size for image container, adjust if your PNG is much larger
            height: '80px',
            display: 'flex', // Use flex to center the image within its div
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Using a regular <img> tag for the PNG */}
          <img
            src={logo.imageUrl}
            alt="Medical Icon"
            className="w-full h-full object-contain" // Ensure image scales within its container
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null; // Prevent infinite loops
              (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='red' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E`;
              console.error(`AnimatedMedicalBackground: Failed to load image for logo ${logo.id} from path: ${logo.imageUrl}. Fallback to red X applied.`);
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default AnimatedMedicalBackground;

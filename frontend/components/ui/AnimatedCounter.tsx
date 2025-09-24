// components/ui/AnimatedCounter.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  endValue: number;
  duration?: number; // Duration in milliseconds
  suffix?: string;
  prefix?: string;
  numberClassName?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  endValue,
  duration = 3000, // Increased duration for slower animation (e.g., 3000ms or 4000ms)
  suffix = '',
  prefix = '',
  numberClassName = '',
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let startTimestamp: DOMHighResTimeStamp | null = null;
            const animateCount = (timestamp: DOMHighResTimeStamp) => {
              if (!startTimestamp) startTimestamp = timestamp;
              const progress = Math.min((timestamp - startTimestamp) / duration, 1);
              setCount(Math.floor(progress * endValue));

              if (progress < 1) {
                requestAnimationFrame(animateCount);
              }
            };
            requestAnimationFrame(animateCount);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [endValue, duration]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className={`font-extrabold text-5xl md:text-6xl lg:text-7xl ${numberClassName}`}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
    </div>
  );
};

export default AnimatedCounter;
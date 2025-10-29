import React, { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  timerMs: number;
  distance: number;
};

export default function AnimatedHorizontalList({ children, timerMs, distance }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / timerMs, 1); // 0 to 1
      const left = progress * distance;

      if (ref.current) {
        ref.current.style.left = `${left}px`;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      startTimeRef.current = null; // Reset on cleanup
    };
  }, [timerMs, distance]); // only rerun animation when these change

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '180px',
        left: '0px',
        zIndex: 11,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';

type AnimatedListProps = {
  items: string[];
  duration?: number; // ms to move downward
  distance?: number; // px to move
};

export default function AnimatedList({
  items,
  duration = 3000, // 3 seconds
  distance = 100 // 100px down
}: AnimatedListProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) {
        setStartTime(timestamp);
        frameId = requestAnimationFrame(step);
        return;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1); // 0 to 1
      const currentTop = progress * distance;

      if (ref.current) {
        ref.current.style.top = `${currentTop}px`;
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [duration, distance]);

  return (
    <span
      ref={ref}
      style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        zIndex: 11,
        display: 'inline-block'
      }}
    >
      <ul style={{ listStyle: 'none', marginLeft: 16, padding: 0 }}>
        {items.map((label) => (
          <li key={label} style={{ marginBottom: '10px' }}>{label}</li>
        ))}
      </ul>
    </span>
  );
}

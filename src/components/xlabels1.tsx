import { useState, useEffect } from 'react';

type Props = {
  currentMultiplier: number;
};

export default function XLabels({ currentMultiplier }: Props) {
  // State to toggle between start and end marginBottom
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to generate an array of multipliers, animation time, and marginBottom values
  const getMultipliers = () => {
    const ranges = [
      { min: 1, max: 5, values: [5, 4, 3, 2, 1], time: 10000, startMarginBottom: 12, endMarginBottom: 2 },
      { min: 5.01, max: 10, values: [10, 9, 8, 7, 6, 5], time: 1800, startMarginBottom: 11, endMarginBottom: 2 },
      { min: 10.01, max: 15, values: [15, 14, 13, 12, 11, 10], time: 1600, startMarginBottom: 10, endMarginBottom: 2 },
      { min: 15.01, max: 20, values: [20, 19, 18, 17, 16, 15], time: 1400, startMarginBottom: 9, endMarginBottom: 2 },
      { min: 20.01, max: 25, values: [25, 24, 23, 22, 21, 20], time: 1200, startMarginBottom: 8, endMarginBottom: 2 },
      { min: 25.01, max: 30, values: [30, 29, 28, 27, 26, 25], time: 1000, startMarginBottom: 7, endMarginBottom: 2 },
      { min: 30.01, max: 35, values: [35, 34, 33, 32, 31, 30], time: 900, startMarginBottom: 6, endMarginBottom: 2 },
      { min: 35.01, max: 40, values: [40, 39, 38, 37, 36, 35], time: 800, startMarginBottom: 5, endMarginBottom: 2 },
      { min: 40.01, max: 45, values: [45, 44, 43, 42, 41, 40], time: 700, startMarginBottom: 4, endMarginBottom: 2 },
      { min: 45.01, max: 50, values: [50, 49, 48, 47, 46, 45], time: 600, startMarginBottom: 3, endMarginBottom: 2 },
      { min: 50.01, max: 55, values: [55, 54, 53, 52, 51, 50], time: 500, startMarginBottom: 3, endMarginBottom: 2 },
      { min: 55.01, max: 60, values: [60, 59, 58, 57, 56, 55], time: 400, startMarginBottom: 3, endMarginBottom: 2 },
      { min: 60.01, max: 65, values: [65, 64, 63, 62, 61, 60], time: 300, startMarginBottom: 3, endMarginBottom: 2 },
      { min: 65.01, max: 70, values: [70, 69, 68, 67, 66, 65], time: 200, startMarginBottom: 2, endMarginBottom: 1 },
      { min: 70.01, max: 75, values: [75, 74, 73, 72, 71, 70], time: 200, startMarginBottom: 2, endMarginBottom: 1 },
      { min: 75.01, max: 80, values: [80, 79, 78, 77, 76, 75], time: 200, startMarginBottom: 2, endMarginBottom: 1 },
      { min: 80.01, max: 85, values: [85, 84, 83, 82, 81, 80], time: 200, startMarginBottom: 2, endMarginBottom: 1 },
      { min: 85.01, max: 90, values: [90, 89, 88, 87, 86, 85], time: 200, startMarginBottom: 2, endMarginBottom: 1 },
      { min: 90.01, max: 95, values: [95, 94, 93, 92, 91, 90], time: 200, startMarginBottom: 2, endMarginBottom: 1 },
      { min: 95.01, max: 100, values: [100, 99, 98, 97, 96, 95], time: 200, startMarginBottom: 2, endMarginBottom: 1 },
    ];

    const range = ranges.find(
      ({ min, max }) => currentMultiplier > min && currentMultiplier <= max
    );
    return range
      ? { values: range.values, time: range.time, startMarginBottom: range.startMarginBottom, endMarginBottom: range.endMarginBottom }
      : { values: [], time: 2000, startMarginBottom: 10, endMarginBottom: 2 };
  };

  const { values: multipliers, time, startMarginBottom, endMarginBottom } = getMultipliers();

  // Effect to trigger animation
  useEffect(() => {
    // Reset to start state
    setIsAnimating(false);

    if (multipliers.length === 0) return;

    // Trigger animation after a brief delay to ensure initial render
    const timeout = setTimeout(() => {
      setIsAnimating(true);
    }, 0);

    return () => clearTimeout(timeout); // Cleanup on unmount or multiplier change
  }, [currentMultiplier, time, startMarginBottom, endMarginBottom]);

  return (
    <>
      {multipliers.length > 0 && (
        <span
          style={{
            top: '0px',
            left: '0px',
            position: 'absolute',
            zIndex: 11,
            display: 'inline-block',
          }}
        >
          <ul style={{ listStyle: 'none', marginLeft: 16, padding: 0 }}>
            {multipliers.map((multiplier) => (
              <li
                key={multiplier}
                style={{
                  marginBottom: isAnimating ? `${endMarginBottom}px` : `${startMarginBottom}px`,
                  transition: `margin-bottom ${time}ms ease-out`,
                }}
              >
                {multiplier}x
              </li>
            ))}
          </ul>
        </span>
      )}
    </>
  );
}
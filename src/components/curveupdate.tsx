'use client';

import { useEffect, useRef } from 'react';
import curvePoints from '../data/points';

type Point = { x: number; y: number };

const BezierCanvasPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Small initial line (not from corner)
    const initialStart: Point = { x: 50, y: 550 };
    const initialEnd: Point = { x: 100, y: 500 };

    const drawLine = (start: Point, end: Point, progress: number) => {
      const x = start.x + (end.x - start.x) * progress;
      const y = start.y + (end.y - start.y) * progress;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const drawFullLine = (start: Point, end: Point) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    };

    const drawCubicBezier = (
      start: Point,
      cp1: Point,
      cp2: Point,
      end: Point
    ) => {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
      ctx.stroke();
    };

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';

      const first = curvePoints[0];
      const mainStart = first.start;
      const mainEnd = first.end;

      if (elapsed <= 10) {
        // Animate only the small initial line
        drawLine(initialStart, initialEnd, elapsed / 10);
      } else {
        // Show full straight line
        drawFullLine(mainStart, mainEnd);

        // Draw latest cubic bezier curve
        const currentCurve = [...curvePoints].reverse().find(cp => elapsed >= cp.time);
        if (currentCurve) {
          drawCubicBezier(
            currentCurve.start,
            currentCurve.control1,
            currentCurve.control2,
            currentCurve.end
          );
        }
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        style={{ border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default BezierCanvasPage;

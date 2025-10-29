"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const startx = -50;
const starty = 170;

interface ControlPoint {
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
  pointB: { x: number; y: number };
}

interface GameVisualProps {
  currentMultiplier: number;
  onCashout: (multiplier: number) => void;
  dude55: boolean;
  dude56: string;
  betAmount: string;
  Gametimeremaining: number;
  GameStatus: string;
  tValues: {
    number: number;
    color: string;
    svg: string;
  }[];
}

const GameVisual: React.FC<GameVisualProps> = ({ Gametimeremaining, GameStatus, currentMultiplier, dude55, dude56, betAmount, tValues }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fishRef = useRef<HTMLDivElement | null>(null);
  const curveAnimationRef = useRef<number>(0);
  const backgroundImage = useRef<HTMLDivElement | null>(null);

  const pointBRef = useRef<{ x: number; y: number }>({ x: startx, y: starty });
  const [previousTimeRemaining, setPreviousTimeRemaining] = useState<number | null>(null);
  const tValuesRef = useRef(tValues);
  const dude55Ref = useRef(dude55);
  const [userClickT, setUserClickT] = useState<number | null>(null); // Store the t value when user clicked
  const [currentControlPoints, setCurrentControlPoints] = useState<ControlPoint | null>(null); // Store current control points

  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);

  // Move getBezierPoint outside useEffect to make it accessible in JSX
  function getBezierPoint(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
    const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
    return { x, y };
  }

  useEffect(() => {
    tValuesRef.current = tValues;
    dude55Ref.current = dude55;
  }, [tValues, dude55]);

  useEffect(() => {
    if (isNaN(Gametimeremaining)) {
      return;
    } else {
      setPreviousTimeRemaining(Gametimeremaining);
    }
  }, [Gametimeremaining]);

  useEffect(() => {
    async function fetchControlPoints() {
      try {
        const response = await fetch('/api/bezier');
        const data = await response.json();
        if (!data || !data.frames) return;
        const mappedPoints = data.frames.map((frame: any) => ({
          cp1: frame.cp1 || { x: 300, y: 50 },
          cp2: frame.cp2 || { x: 300, y: 50 },
          pointB: frame.pointB || { x: 300, y: 50 },
        }));
        setControlPoints(mappedPoints);
      } catch (error) {
        console.error('Error fetching control points:', error);
      }
    }
    fetchControlPoints();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fish = fishRef.current;
    if (!canvas || !fish) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (controlPoints.length === 0) return;

    let t = 0;
    let transitionIndex = 0;

    let currentCP1 = { x: startx, y: starty };
    let currentCP2 = { x: startx, y: starty };
    let currentPointB = { x: startx, y: starty };
    let targetCP1 = controlPoints[0].cp1;
    let targetCP2 = controlPoints[0].cp2;
    let targetPointB = controlPoints[0].pointB;

    function getBezierTangent(t: number, p0: any, p1: any, p2: any, p3: any) {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;

      const dx = -3 * uu * p0.x + 3 * (uu - 2 * u * t) * p1.x + 3 * (2 * t * u - tt) * p2.x + 3 * tt * p3.x;
      const dy = -3 * uu * p0.y + 3 * (uu - 2 * u * t) * p1.y + 3 * (2 * t * u - tt) * p2.y + 3 * tt * p3.y;
      return Math.atan2(dy, dx);
    }

    let logged = false;

    const fish1 = new window.Image();
    fish1.src = "/images/chippy.svg";
    fish1.onload = () => {
      requestAnimationFrame(animate);
    };

    function animate() {
      if (!canvas || !ctx || !fish1.complete) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(startx, starty);

      const cp1x = currentCP1.x + (targetCP1.x - currentCP1.x) * t;
      const cp1y = currentCP1.y + (targetCP1.y - currentCP1.y) * t;
      const cp2x = currentCP2.x + (targetCP2.x - currentCP2.x) * t;
      const cp2y = currentCP2.y + (targetCP2.y - currentCP2.y) * t;
      const pointBx = currentPointB.x + (targetPointB.x - currentPointB.x) * t;
      const pointBy = currentPointB.y + (targetPointB.y - currentPointB.y) * t;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pointBx, pointBy);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      tValues.forEach((dotT) => {
        const { x, y } = getBezierPoint(
          dotT.number,
          { x: startx, y: starty },
          { x: cp1x, y: cp1y },
          { x: cp2x, y: cp2y },
          { x: pointBx, y: pointBy }
        );

        const img = new window.Image();
        img.src = dotT.svg;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = dotT.color;
        ctx.fill();

        img.onload = () => {
          ctx.drawImage(img, x - 8, y - 8, 20, 20);
        };
      });

      ctx.save();
      ctx.translate(pointBx, pointBy);
      ctx.drawImage(fish1, -25, -25, 50, 50);
      ctx.restore();

      pointBRef.current = { x: pointBx, y: pointBy };

      // Store current control points for use in JSX
      setCurrentControlPoints({
        cp1: { x: cp1x, y: cp1y },
        cp2: { x: cp2x, y: cp2y },
        pointB: { x: pointBx, y: pointBy },
      });

      // Calculate t for red dot when user clicks (dude55)
      if (dude55 && !logged) {
        // Map the multiplier to a t value (0 to 1) for the Bezier curve
        const clickT = Math.min(currentMultiplier / 10, 1); // Adjust denominator based on max multiplier
        setUserClickT(clickT);
        console.log("Recording t because dude55 is true:", clickT.toFixed(4));
        logged = true;
      }

      t += 0.01;

      if (t <= 1) {
        curveAnimationRef.current = requestAnimationFrame(animate);
      } else {
        if (controlPoints.length === 0) return;
        transitionIndex = (transitionIndex + 1) % controlPoints.length;
        t = 0;
        currentCP1 = targetCP1;
        currentCP2 = targetCP2;
        currentPointB = targetPointB;
        targetCP1 = controlPoints[transitionIndex].cp1;
        targetCP2 = controlPoints[transitionIndex].cp2;
        targetPointB = controlPoints[transitionIndex].pointB;
        curveAnimationRef.current = requestAnimationFrame(animate);
      }
    }

    if (GameStatus === "Running") {
      animate();
    } else {
      if (curveAnimationRef.current) {
        cancelAnimationFrame(curveAnimationRef.current);
      }
    }

    return () => {
      if (curveAnimationRef.current) {
        cancelAnimationFrame(curveAnimationRef.current);
      }
    };
  }, [GameStatus, dude55, controlPoints]);

  return (
    <div className="relative h-64 bg-gray-900 rounded-lg overflow-hidden mb-4">
      <Image 
        src="/images/123b.png" 
        alt="Background image" 
        fill
        className="relative rounded-lg overflow-hidden" 
      />
      {GameStatus === "Running" && (
        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-full"
          />
          {GameStatus === "Running" && (
            <>
              <span style={{ 
                top: '100px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                display: 'block', 
                position: 'absolute',
                color: currentMultiplier > 5 ? 'red' : currentMultiplier > 2 ? 'yellow' : 'white',
                fontSize: '2rem',
              }}>
                {currentMultiplier}x
              </span>
              {dude55 && userClickT !== null && currentControlPoints && (
                <div
                  className="absolute w-4 h-4 bg-red-500 rounded-full"
                  style={{
                    // Calculate position of red dot based on userClickT
                    ...(() => {
                      const { x, y } = getBezierPoint(
                        userClickT,
                        { x: startx, y: starty },
                        currentControlPoints.cp1,
                        currentControlPoints.cp2,
                        currentControlPoints.pointB
                      );
                      return {
                        left: x,
                        top: y,
                        transform: "translate(-50%, -50%)",
                      };
                    })(),
                  }}
                >
                  {dude56} and your bet amount {betAmount}
                </div>
              )}
            </>
          )}
          <div style={{ display: "none" }} ref={fishRef} className="absolute w-6 h-6">
            <Image
              src="/images/chippy.svg"
              alt="End Fish"
              width={24}
              height={24}
              className="absolute w-6 h-6"
              style={{
                transform: `translate(${pointBRef.current.x - 12}px, ${pointBRef.current.y - 12}px)`,
                marginTop: `-150px`,
              }}
            />
          </div>
        </div>
      )}
      {GameStatus === "Crashed" && (
        <>
          <span style={{
            top: '50%', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'block', 
            position: 'absolute',
          }}>
            <Image width={275} height={275} src="/explode1.svg" alt="Explosion effect" />
          </span>
          <span style={{ 
            top: '100px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'block', 
            position: 'absolute',
            color: currentMultiplier > 5 ? 'red' : currentMultiplier > 2 ? 'yellow' : 'white',
            fontSize: '2rem',
          }}>
            {currentMultiplier}x
          </span>
        </>
      )}
      {GameStatus === "Waiting" && (
        <span style={{ 
          top: '100px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          display: 'block', 
          position: 'absolute',
          color: 'white',
          fontSize: '2rem',
          width: '100%',
          textAlign: 'center',
        }}>
          Launch in
          {(typeof Gametimeremaining === 'number' && !isNaN(Gametimeremaining) ? (
            <> {Gametimeremaining} {Gametimeremaining > 1 ? `secs` : `sec`}</>
          ) : (
            <> {previousTimeRemaining} {previousTimeRemaining != null && previousTimeRemaining > 1 ? 'secs' : 'sec'}</>
          ))}
        </span>
      )}
    </div>
  );
};

export default GameVisual;
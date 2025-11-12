import { useRef, useEffect, useState } from 'react';
import Image from "next/image";
import XLabels  from './xlabels';
import YLabels  from './ylabels';

// Defines the Point interface for x, y coordinates used in Bezier curve points
interface Point {
  x: number; // x-coordinate of a point
  y: number; // y-coordinate of a point
}

// Defines the ControlPoint interface for Bezier curve control points and end point
interface ControlPoint {
  cp1: { x: number; y: number }; // First control point for the Bezier curve
  cp2: { x: number; y: number }; // Second control point for the Bezier curve
  pointB: { x: number; y: number }; // End point of the Bezier curve segment
  num: number; // Identifier or index for the control point (purpose unclear from context)
  time: number; // Duration of the animation for this segment (in milliseconds)
}

// Defines the Startxy interface for initial coordinates fetched from an API
interface Startxy {
  xvalue: string; // x-coordinate as a string (to be parsed to number)
  yvalue: string; // y-coordinate as a string (to be parsed to number)
}

// Defines the props interface for the BezierAnimation component
interface GameVisualProps {
  currentMultiplier: number; // Current multiplier value (likely for game logic)
  timer5: number; // Timer value (purpose unclear from context)
  onCashout: (multiplier: number) => void; // Callback function for cashout action
  dude55: boolean; // Boolean flag (purpose unclear, possibly game state)
  dude56: string; // String value (purpose unclear, possibly game identifier)
  betAmount: string; // Bet amount as a string (likely to be parsed to number)
  Gametimeremaining: number; // Remaining time for the game
  GameStatus: string; // Current status of the game (e.g., running, ended)
  tValues: { number: number; color: string; svg: string }[]; // Array of objects containing number, color, and SVG data (likely for rendering)
}

// Defines a type alias for Keyframe, which is an array of Points representing a Bezier curve
type Keyframe = Point[];

// Declares the BezierAnimation functional component with GameVisualProps
const BezierAnimation: React.FC<GameVisualProps> = ({
  Gametimeremaining, // Remaining game time prop
  GameStatus, // Game status prop
  currentMultiplier, // Current multiplier prop
  dude55, // Boolean flag prop
  dude56, // String prop
  betAmount, // Bet amount prop
  timer5, // Timer prop 
  tValues, // Array of t-value objects prop
}) => {
  // Creates a ref for the canvas element to access its DOM node
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Creates a ref for the starting point (pointB) with initial coordinates
  const pointBRef = useRef<Point>({ x: 10, y: 190 });
  // State to store keyframes (arrays of points for Bezier curves)
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  // State to store transition durations for each keyframe
  const [transitionDurations, setTransitionDurations] = useState<number[]>([]);
  // State to store the starting coordinates fetched from the API
  const [startxy, setStartxy] = useState<Startxy | null>(null);
  const [previousTimeRemaining, setPreviousTimeRemaining] = useState<number | null>(null);

  // useEffect to fetch initial coordinates from the API when the component mounts
  useEffect(() => {
    // Async function to fetch starting x, y coordinates
    async function fetchStartxy() {
      try {
        // Makes a GET request to the /api/coordinates endpoint
        const response = await fetch('/api/coordinates?uniqueName=backgroundimage');
        // Checks if the response is not OK (e.g., 404, 500)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parses the JSON response into Startxy type
        const data: Startxy = await response.json();
        // Updates the startxy state with the fetched data
        setStartxy(data);
        // Updates the pointBRef with parsed x, y coordinates
        pointBRef.current = {
          x: parseInt(data.xvalue, 10),
          y: parseInt(data.yvalue, 10),
        };
      } catch (error) {
        // Logs any errors that occur during the fetch
        console.error('Error fetching coordinates:', error);
        // Sets startxy to null on error
        setStartxy(null);
        // Resets pointBRef to default coordinates on error
        pointBRef.current = { x: 10, y: 190 };
      }
    }
    // Calls the fetch function
    fetchStartxy();
  }, []); // Empty dependency array means this runs once on mount

  // useEffect to fetch Bezier curve control points from the API
  useEffect(() => {
    // Async function to fetch control points
    async function fetchControlPoints() {
      try {
        // Makes a GET request to the /api/bezier endpoint
        const response = await fetch('/api/bezier');
        // Parses the JSON response
        const data = await response.json();
        // Checks if data or data.frames is missing
        if (!data || !data.frames) return;

        // Gets the starting point from pointBRef
        const startPoint = pointBRef.current;

        // Maps the fetched frames to keyframes, skipping the first frame
        const newKeyframes: Keyframe[] = data.frames.slice(1).map((frame: ControlPoint) => [
          startPoint, // Starting point from pointBRef
          frame.cp1, // First control point
          frame.cp2, // Second control point
          frame.pointB, // End point
        ]);

        // Filters and maps frames to get transition durations, skipping the first duration
        const newTransitionDurations: number[] = data.frames
          .slice(1) // Skips the first frame
          .filter((frame: ControlPoint) => frame.time > 0)
          .map((frame: ControlPoint) => frame.time);

        // Updates keyframes state
        setKeyframes(newKeyframes);
        // Updates transitionDurations state
        setTransitionDurations(newTransitionDurations);
      } catch (error) {
        // Logs any errors that occur during the fetch
        console.error('Error fetching control points:', error);
      }
    }
    // Calls the fetch function
    fetchControlPoints();
  }, [startxy]); // Re-runs when startxy changes

  // useEffect to handle canvas animation
  useEffect(() => {
    // Gets the canvas element from the ref
    const canvas = canvasRef.current;
    // Skips if canvas or keyframes are not available
    if (!canvas || keyframes.length === 0) return;

    // Gets the 2D rendering context of the canvas
    const ctx = canvas.getContext('2d');
    // Skips if context is not available
    if (!ctx) return;

    // Variable to store the animation start time
    let startTime: number | null = null;
    // Variable to store the animation frame ID
    let animationFrameId: number;

    // Function to draw the Bezier curve and points
    const draw = (points: Point[]) => {
      // Clears the canvas for the next frame
      ctx.clearRect(0, 0, 400, 200);

      // Begins a new path for the Bezier curve
      ctx.beginPath();
      // Moves to the starting point
      ctx.moveTo(points[0].x, points[0].y);
      // Draws a cubic Bezier curve using control points and end point
      ctx.bezierCurveTo(
        points[1].x,
        points[1].y,
        points[2].x,
        points[2].y,
        points[3].x,
        points[3].y
      );
      // Sets the stroke color to white
      ctx.strokeStyle = 'white';
      // Sets the line width to 2 pixels
      ctx.lineWidth = 2;
      // Strokes the Bezier curve
      ctx.stroke();

      // Draws each point as a small red circle
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); // Draws a circle at point p
        ctx.fillStyle = 'red'; // Sets fill color to red
        ctx.fill(); // Fills the circle
      });
    };

    // Animation function called for each frame
    const animate = (time: number) => {
      // Sets startTime on first call
      if (!startTime) startTime = time;
      // Calculates elapsed time since animation start
      const elapsed = time - startTime; // in milliseconds

      // Finds the current keyframe segment based on elapsed time
      let cumulativeTime = 0;
      let segmentIndex = 0;
      for (; segmentIndex < transitionDurations.length; segmentIndex++) {
        if (elapsed < cumulativeTime + transitionDurations[segmentIndex]) {
          break;
        }
        cumulativeTime += transitionDurations[segmentIndex];
      }

      // If beyond the last keyframe, draws the final keyframe and continues
      if (segmentIndex === transitionDurations.length) {
        draw(keyframes[keyframes.length - 1]);
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      // Calculates interpolation parameter t for the current segment
      const t = (elapsed - cumulativeTime) / transitionDurations[segmentIndex];
      // Interpolates between current and next keyframe points
      const currentPoints: Point[] = keyframes[segmentIndex].map((p, i) => ({
        x: p.x + t * (keyframes[segmentIndex + 1][i].x - p.x),
        y: p.y + t * (keyframes[segmentIndex + 1][i].y - p.y),
      }));

      // Draws the interpolated points
      draw(currentPoints);
      // Requests the next animation frame
      animationFrameId = requestAnimationFrame(animate);
    };

    // Starts the animation
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup function to cancel animation on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [keyframes, transitionDurations]); // Re-runs when keyframes or transitionDurations change

  // Renders the component
  return (
    // Container div with relative positioning, black background, and fixed height
    <div className="relative h-64 bg-black overflow-hidden mb-4">
   {GameStatus === "Running" && (
        <div className="absolute inset-0">
        
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-full"
            style={{
              zIndex: 1001,
            }}
          />
          {/*<BezierCanvasPage />*/}
          <span
            style={{
              top: "100px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "block",
              position: "absolute",
              zIndex: 1000,
              color:
                currentMultiplier > 5
                  ? "red"
                  : currentMultiplier > 2
                  ? "yellow"
                  : "white",
              fontSize: "2rem",
            }}
          >
            {currentMultiplier}x
          </span>
{/* */}
<XLabels currentMultiplier={currentMultiplier} timer5={timer5} canvasheight={canvasRef.current?.height} canvaswidth={canvasRef.current?.width} />
<YLabels currentMultiplier={currentMultiplier} timer5={timer5} canvasheight={canvasRef.current?.height} canvaswidth={canvasRef.current?.width}/>


          {dude55 && (
            <div
              className="absolute w-4 h-4 bg-red-500 rounded-full"
              style={{
                left: pointBRef.current.x - currentMultiplier * 10,
                top: pointBRef.current.y + currentMultiplier * 5,
                transform: "translate(-50%, -50%)",
              }}
            >
              {dude56} and your bet amount {betAmount}
            </div>
          )}
        </div>
      )}
      {GameStatus === "Crashed" && (
        <>
         <div
  style={{
 //   display: "flex",
 //   justifyContent: "center",
 //   alignItems: "center",
   // height: "100vh", // Full viewport height
    //width: "100vw",  // Full viewport width
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1,
  }}
>
  
  <Image
    width={200}
    height={200}
    src="/explode1.svg"
    alt="Explosion effect"
  />

</div>
          <span
            style={{
              top: "100px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "block",
              position: "absolute",
              color:
                currentMultiplier > 5
                  ? "red"
                  : currentMultiplier > 2
                  ? "yellow"
                  : "white",
              fontSize: "2rem",
              zIndex: 1000,
            }}
          >
            {currentMultiplier}x
          </span>
        </>
      )}
      {GameStatus === "Waiting" && (
        <span
          style={{
            top: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "block",
            position: "absolute",
            color: "white",
            fontSize: "2rem",
            width: "100%",
            textAlign: "center",
          }}
        >
          Launch in{" "}
          {typeof Gametimeremaining === "number" && !isNaN(Gametimeremaining) ? (
            <>
              {Gametimeremaining}{" "}
              {Gametimeremaining > 1 ? "secs" : "sec"}
            </>
          ) : (
            <>
              {previousTimeRemaining}{" "}
              {previousTimeRemaining != null && previousTimeRemaining > 1
                ? "secs"
                : "sec"}
            </>
          )}
        </span>
      )}
    </div>
  );
};

// Exports the BezierAnimation component as the default export
export default BezierAnimation;
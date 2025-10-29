"use client";

import * as THREE from 'three';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

import { useGameStore, GameState } from '../store/gameStore2';
import { toast } from 'react-toastify'; // Ensure you have the toast library


import styles from '../styles/Game1.module.css';

const height = 2000;
const coeffB = 0.5;
const coeffA = height*0.16;

let rocketImage: HTMLImageElement;
let explodeImage: HTMLImageElement;
let parachuteImage: HTMLImageElement;
let backgroundImage: HTMLImageElement;
let svgImage: HTMLImageElement;


  

if (typeof window !== 'undefined') {
	rocketImage = new Image();
	rocketImage.src = '/images/chippy.svg';

	explodeImage = new Image();
	explodeImage.src = 'explode.svg';

	parachuteImage = new Image();
	parachuteImage.src = 'parachute.svg';

	backgroundImage = new Image();
	backgroundImage.src = 'under3.png';

	svgImage = new Image();
	svgImage.src = '1.svg'; // Update with your SVG path
	
}

const rocketWidth = 440;
const rocketHeight = 440;

function curveFunction(t: number, width: number, height: number) {
	const startX = 0;  // Start from the left edge of the canvas
	const startY = 50;  // Start from the bottom of the canvas
	
	const controlX = width * 0.85; // Control point X starts at 85% of canvas width
	const controlY = height - 1500; // Control point Y to curve upwards
	
	const endX = t * width; // End X based on time (t) and canvas width
	const endY = height - (500 * Math.min(1, t / 1000)); // Simulates incline & leveling
  
	let bezierY: number;
  
	// Normalize `t` to be between 0 and 1
	const normalizedT = Math.min(t, 1);
  
	// Use linear motion for the first 85% of the canvas width (0 <= t < 0.85)
	if (normalizedT < 0.85) {
	  bezierY = startY; // Stay at the bottom during linear movement
	} else {
	  // Quadratic Bezier curve formula after 85% width
	  bezierY =
		(1 - normalizedT) ** 2 * startY + 2 * (1 - normalizedT) * normalizedT * controlY + normalizedT ** 2 * endY;
	}
  
	return bezierY;
  }
  
 // Dynamic SVG paths
 const imagePaths = {
	rocket: 'fish.svg',
	explode: 'explode.svg',
	parachute: 'parachute.svg',
	background: 'under3.png',
	additional1: '1.svg',
	additional2: '2.svg', // Add more SVG paths here
  };

// Function to preload multiple images
function preloadImages(imagePaths: string[]) {
	const images1: Record<string, HTMLImageElement> = {};
	imagePaths.forEach((path) => {
	  const img = new Image();
	  img.src = path;
	  images1[path] = img;
	});
	return images1;
  }


// Preload the specific image


function render(
	gameState5: GameState,
	context: CanvasRenderingContext2D,
) {
	if (!context)
		return;

	const canvas = context.canvas;


	context.clearRect(0, 0, canvas.width, canvas.height);
	const additionalImages = preloadImages([imagePaths.rocket]); // Preload only the additional1 image

	const maxX = canvas.width - rocketWidth;
	const minY = rocketHeight;

	const expectedX = gameState5.timeElapsed;
	const expectedY = canvas.height - curveFunction(gameState5.timeElapsed/1000, canvas.width, canvas.height);

	const rocketX = Math.min(expectedX, maxX);
	const rocketY = Math.max(expectedY, minY);

	context.save();


	if (additionalImages && additionalImages.complete) {
		context.drawImage(additionalImages.rocket, 34, 0, 200, 200); // Adjust size as needed
	}
	
	if (backgroundImage) {
		const aspectRatio = backgroundImage.width / backgroundImage.height;
		const canvasAspectRatio = canvas.width / canvas.height;

		let drawWidth, drawHeight;

		if (aspectRatio > canvasAspectRatio) {
			drawWidth = canvas.width;
			drawHeight = canvas.width / aspectRatio;
		} else {
			drawHeight = canvas.height;
			drawWidth = canvas.height * aspectRatio;
		}

		const xOffset = (canvas.width - drawWidth) / 2;
		const yOffset = (canvas.height - drawHeight) / 2;
	

		context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
		
	}

	drawRocketPath(context, gameState5.timeElapsed);

	if (gameState5.status == 'Crashed')
		drawCrashedRocket(context, rocketX, rocketY);
	else
		drawRocket(context, gameState5.timeElapsed, rocketX, rocketY);

	context.restore();

	if (gameState5.status == 'Waiting')
		drawCountdown(context, gameState5.timeRemaining);
	else
		drawMultiplier(context, gameState5.multiplier);
		
	//	if (additionalImages.complete) {
		//	context.drawImage(additionalImages.rocket, 0, 0, 200, 200); // Adjust size as needed
		//	}
}

function drawMultiplier(
	context: CanvasRenderingContext2D,
	multiplier: number,
) {
	const canvas = context.canvas;

	const multiplierNumeric = Number.parseFloat(multiplier.toString());

	if (multiplierNumeric > 5)
		context.fillStyle = 'red';
	else if (multiplierNumeric > 2)
		context.fillStyle = 'yellow';
	else
		context.fillStyle = 'white';

	context.font = '220px Arial';
	const text = `${multiplier}x`;
	const textWidth = context.measureText(text).width;
	context.fillText(text, canvas.width / 2 - textWidth / 2, canvas.height / 2);
}

function drawCountdown(
	context: CanvasRenderingContext2D,
	timeRemaining: number,
) {
	if (typeof timeRemaining === 'number' && !isNaN(timeRemaining)){

		const canvas = context.canvas;
		context.fillStyle = 'rgba(255, 255, 255, 1.0)';
		context.font = '220px Arial';
		const text = `Launch in ${timeRemaining} secs`;
		const textWidth = context.measureText(text).width;
		context.fillText(text, canvas.width / 2 - textWidth / 2, canvas.height / 2);

	}
	
}

function drawRocketPath(
	context: CanvasRenderingContext2D,
	timeElapsed: number,
) {
	const canvas = context.canvas;
	const gradient: CanvasGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, 'red');
	gradient.addColorStop(1, 'yellow');

	context.strokeStyle = gradient;
	context.lineWidth = 20;
	context.beginPath();

	const originX = 0;
	const originY = context.canvas.height;

	context.moveTo(originX, originY);

	const step = 10;

	for (let t = 0; t <= timeElapsed/step; t += step) {
		const x = step * t;
		const y = canvas.height - curveFunction(x/1000, canvas.width, canvas.height);
//after 2.0x immulate curve
		context.lineTo(x, y);
	}

	context.stroke();
}

function drawRocket(
	context: CanvasRenderingContext2D,
	timeElapsed: number,
	x: number,
	y: number,
) {
	const canvas = context.canvas;
	// Obtain angle from the path derivative
	const d1 = curveFunction(timeElapsed/1000, canvas.width, canvas.height);
	const d2 = curveFunction((timeElapsed + 10)/1000, canvas.width, canvas.height);
	const slope = (d2 - d1)/10;
	const angle = -Math.atan(slope) + 2*Math.PI/4;

	context.translate(x - rocketWidth/2, y - rocketHeight/2);
	context.rotate(angle);

	context.drawImage(rocketImage, 0, 0, rocketWidth, rocketHeight);

	context.rotate(-angle);
}

function drawCrashedRocket(
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
) {
	context.translate(x - rocketWidth/2, y - rocketWidth/2);
	context.drawImage(explodeImage, 2000, -1200, 900, 900);
	const text = `Launch in  secs`;
	
}

export default function Game() {
	const [pointB, setPointB] = useState({ x: 0, y: 200 });
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [context, setContext] = useState<any>(null);
	const [additionalImage, setAdditionalImage] = useState<HTMLImageElement | null>(null);
	const [errorCount, setErrorCount] = useState(0);
	const errors: string[] = []; // Explicitly define the type of errors

	const gameState5 = useGameStore((gameState5: GameState) => gameState5);

	const [errorMessages, setErrorMessages] = useState<string[]>([]);

	const showErrorToast = useCallback(() => {
		if (errorMessages.length > 0) {
			toast("⚠️ " + errorMessages[errorMessages.length - 1]);
		}
	}, [errorMessages]); // ✅ Now errorMessages is a stable state

	//const showErrorToast = useCallback(() => {
	//	const currentErrors = errors; // Move errors inside the callback
	//	if (currentErrors.length > 0) {
	//		toast("⚠️ " + currentErrors[currentErrors.length - 1]);
	//	}
//	}, []); // Removed errors from dependencies

	useEffect(() => {
		const ctx = canvasRef.current?.getContext('2d');
		if (canvasRef.current) {
			const canvas = canvasRef.current;
			const aspectRatio = canvas.clientWidth / canvas.clientHeight;
			canvas.width = 4000;
			canvas.height = 1995;
		}
		setContext(ctx);
	}, []);

	useEffect(() => {
		const doRender = () => { // Move doRender inside useEffect
			render(
				gameState5,
				context
			);
		}; // Wrap doRender in useCallback if needed

		const frame = requestAnimationFrame(doRender);
		return () => cancelAnimationFrame(frame);
	}, [gameState5, context]); // Add dependencies

	useEffect(() => {
		showErrorToast();
	}, [errorCount, showErrorToast]);

	return (
		<canvas className={styles.Game} ref={canvasRef}>
			
		</canvas>
	);
}
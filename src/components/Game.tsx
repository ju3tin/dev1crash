"use client";

import { useRef, useEffect, useState } from 'react';

import { useGameStore, GameState } from '../store/gameStore';

import styles from '../styles/GameLayout.module.css';

const height = 300;
const coeffB = 0.5;
const coeffA = height*0.16;

let rocketImage: HTMLImageElement;
let explodeImage: HTMLImageElement;
let parachuteImage: HTMLImageElement;
let backgroundImage: HTMLImageElement;

if (typeof window !== 'undefined') {
	rocketImage = new Image();
	rocketImage.src = 'fish.svg';

	explodeImage = new Image();
	explodeImage.src = 'explode.svg';

	parachuteImage = new Image();
	parachuteImage.src = 'parachute.svg'

	backgroundImage = new Image();
	backgroundImage.src = 'path_to_your_svg.svg';
}

const rocketWidth = 50;
const rocketHeight = 50;

function curveFunction(t: number) {
	return coeffA * (Math.exp(coeffB * t) - 1);
}

function render(
	gameState: GameState,
	context: CanvasRenderingContext2D,
) {
	if (!context)
		return;

	const canvas = context.canvas;

	// Draw the background image
	if (backgroundImage) {
		context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
	}

	context.clearRect(0, 0, canvas.width, canvas.height);

	const maxX = canvas.width - rocketWidth;
	const minY = rocketHeight;

	const expectedX = gameState.timeElapsed;
	const expectedY = canvas.height - curveFunction(gameState.timeElapsed/1000);

	const rocketX = Math.min(expectedX, maxX);
	const rocketY = Math.max(expectedY, minY);

	context.save();

	drawRocketPath(context, gameState.timeElapsed);

	if (gameState.status == 'Crashed')
		drawCrashedRocket(context, rocketX, rocketY);
	else
		drawRocket(context, gameState.timeElapsed, rocketX, rocketY);

	context.restore();

	if (gameState.status == 'Waiting')
		drawCountdown(context, gameState.timeRemaining);
	else
		drawMultiplier(context, gameState.multiplier);
}

function drawMultiplier(
	context: CanvasRenderingContext2D,
	multiplier: string,
) {
	const canvas = context.canvas;

	const multiplierNumeric = Number.parseFloat(multiplier);

	if (multiplierNumeric > 5)
		context.fillStyle = 'red';
	else if (multiplierNumeric > 2)
		context.fillStyle = 'yellow';
	else
		context.fillStyle = 'white';

	context.font = '30px Arial';
	const text = `${multiplier}x`;
	const textWidth = context.measureText(text).width;
	context.fillText(text, canvas.width / 2 - textWidth / 2, canvas.height / 2);
}

function drawCountdown(
	context: CanvasRenderingContext2D,
	timeRemaining: number,
) {
	const canvas = context.canvas;

	context.fillStyle = 'rgba(255, 255, 255, 1.0)';
	context.font = '30px Arial';
	const text = `Launch in ${timeRemaining} secs`;
	const textWidth = context.measureText(text).width;
	context.fillText(text, canvas.width / 2 - textWidth / 2, canvas.height / 2);
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
	context.lineWidth = 10;
	context.beginPath();

	const originX = 0;
	const originY = context.canvas.height;

	context.moveTo(originX, originY);

	const step = 10;

	for (let t = 0; t <= timeElapsed/step; t += step) {
		const x = step * t;
		const y = canvas.height - curveFunction(x/300);

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
	// Obtain angle from the path derivative

	const d1 = curveFunction(timeElapsed/300);
	const d2 = curveFunction((timeElapsed + 10)/300);
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
	context.drawImage(explodeImage, 0, 0, rocketWidth, rocketHeight);
}

export default function Game() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [context, setContext] = useState<any>(null);

	const gameState = useGameStore((gameState: GameState) => gameState);

	useEffect(() => {
		const ctx = canvasRef.current?.getContext('2d');
		if (canvasRef.current) {
			const canvas = canvasRef.current;
			const aspectRatio = canvas.clientWidth / canvas.clientHeight;
			canvas.width = 300;
			canvas.height = 300;
			//canvas.height = Math.round(300 * aspectRatio);
		}
		setContext(ctx);
	}, []);

	useEffect(() => {
		const doRender = () => {
			render(
				gameState,
				context
			);
		};

		const frame = requestAnimationFrame(doRender);
		return () => cancelAnimationFrame(frame);
	}, [context, gameState]);

	return (
		<canvas id="gameCanvas" className={styles.Game} ref={canvasRef}></canvas>
	);
}

"use client";

import React from "react";
import { controlPoints as defaultControlPoints } from "./controlPoints";

type Point = { x: number; y: number };

function toPath(start: Point, cp1: Point, cp2: Point, end: Point): string {
    return `M ${start.x},${start.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
}

type ControlPoint = { cp1: { x: number; y: number }; cp2: { x: number; y: number }; pointB: { x: number; y: number }; num: number };

interface BezierVisualizerProps {
    data?: ControlPoint[];
    autoplay?: boolean;
    frameIndex?: number;
}

export default function BezierVisualizer({ data, autoplay = true, frameIndex: frameIndexProp }: BezierVisualizerProps): JSX.Element {
    const [frameIndex, setFrameIndex] = React.useState<number>(frameIndexProp ?? 0);
    const [isPlaying, setIsPlaying] = React.useState<boolean>(autoplay);
    const [speedMs, setSpeedMs] = React.useState<number>(250);
    const [zoom, setZoom] = React.useState<number>(1);
    const [panX, setPanX] = React.useState<number>(0);
    const [panY, setPanY] = React.useState<number>(0);

    const rafRef = React.useRef<number | null>(null);
    const lastTickRef = React.useRef<number>(0);

    React.useEffect(() => {
        if (typeof frameIndexProp === "number") setFrameIndex(frameIndexProp);
    }, [frameIndexProp]);

    React.useEffect(() => {
        function step(timestamp: number) {
            if (!isPlaying) {
                rafRef.current = requestAnimationFrame(step);
                return;
            }
            if (timestamp - lastTickRef.current >= speedMs) {
                lastTickRef.current = timestamp;
                setFrameIndex((idx) => (idx + 1) % (data?.length ?? defaultControlPoints.length));
            }
            rafRef.current = requestAnimationFrame(step);
        }
        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, speedMs, data]);

    const series = data ?? defaultControlPoints;
    const safeLength = Math.max(0, series.length);
    const clampedIndex = safeLength > 0 ? Math.min(Math.max(0, frameIndex), safeLength - 1) : 0;
    const current = safeLength > 0 ? series[clampedIndex] : undefined;
    const initialStart: Point = { x: 0, y: 200 };
    const start: Point = initialStart;

    const width = 420;
    const height = 220;
    const viewX = -60;
    const viewY = -20;
    const centerX = viewX + width / 2;
    const centerY = viewY + height / 2;
    const gridStroke = 1 / zoom;
    const curveStroke = 3 / zoom;
    const pointRadius = 4 / zoom;
    const labelFont = 10 / zoom;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                    onClick={() => setIsPlaying((p) => !p)}
                    style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                >
                    {isPlaying ? "Pause" : "Play"}
                </button>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Speed</span>
                    <input
                        type="range"
                        min={50}
                        max={1000}
                        step={10}
                        value={speedMs}
                        onChange={(e) => setSpeedMs(Number(e.target.value))}
                    />
                    <span>{speedMs}ms</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Zoom</span>
                    <input
                        type="range"
                        min={0.5}
                        max={4}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                    />
                    <span>{zoom.toFixed(1)}x</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Pan X</span>
                    <input
                        type="range"
                        min={-200}
                        max={200}
                        step={1}
                        value={panX}
                        onChange={(e) => setPanX(Number(e.target.value))}
                    />
                    <span>{panX}</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Pan Y</span>
                    <input
                        type="range"
                        min={-200}
                        max={200}
                        step={1}
                        value={panY}
                        onChange={(e) => setPanY(Number(e.target.value))}
                    />
                    <span>{panY}</span>
                </label>
                <span>Frame: {safeLength > 0 ? clampedIndex : 0} / {Math.max(0, safeLength - 1)}{safeLength > 0 ? ` (num: ${current!.num})` : ""}</span>
            </div>

            <svg
                viewBox={`${viewX} ${viewY} ${width} ${height}`}
                width={Math.min(800, width * 1.4)}
                height={Math.min(480, height * 1.4)}
                style={{ background: "#0b1020", borderRadius: 8, border: "1px solid #1f2a44" }}
            >
                <g transform={`translate(${panX} ${panY}) translate(${centerX} ${centerY}) scale(${zoom}) translate(${-centerX} ${-centerY})`}>
                    {/* Grid */}
                    <g opacity={0.25}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <line key={`v-${i}`} x1={i * 20} y1={-20} x2={i * 20} y2={height} stroke="#2a3354" strokeWidth={gridStroke} />
                        ))}
                        {Array.from({ length: 14 }).map((_, i) => (
                            <line key={`h-${i}`} x1={-60} y1={i * 20} x2={width} y2={i * 20} stroke="#2a3354" strokeWidth={gridStroke} />
                        ))}
                    </g>

                    {safeLength > 0 && current ? (
                        <>
                            {/* Control lines */}
                            <line x1={start.x} y1={start.y} x2={current.cp1.x} y2={current.cp1.y} stroke="#7aa2f7" strokeDasharray="4 4" strokeWidth={gridStroke} />
                            <line x1={current.pointB.x} y1={current.pointB.y} x2={current.cp2.x} y2={current.cp2.y} stroke="#7aa2f7" strokeDasharray="4 4" strokeWidth={gridStroke} />

                            {/* Curve */}
                            <path d={toPath(start, current.cp1, current.cp2, current.pointB)} stroke="#67e8f9" strokeWidth={curveStroke} fill="none" />

                            {/* Points */}
                            <circle cx={start.x} cy={start.y} r={pointRadius} fill="#22c55e" />
                            <circle cx={current.cp1.x} cy={current.cp1.y} r={pointRadius} fill="#f59e0b" />
                            <circle cx={current.cp2.x} cy={current.cp2.y} r={pointRadius} fill="#f59e0b" />
                            <circle cx={current.pointB.x} cy={current.pointB.y} r={pointRadius} fill="#ef4444" />

                            {/* Labels */}
                            <g fontSize={labelFont} fill="#cbd5e1">
                                <text x={start.x + 6 / zoom} y={start.y - 6 / zoom}>A ({start.x},{start.y})</text>
                                <text x={current.cp1.x + 6 / zoom} y={current.cp1.y - 6 / zoom}>cp1 ({current.cp1.x},{current.cp1.y})</text>
                                <text x={current.cp2.x + 6 / zoom} y={current.cp2.y - 6 / zoom}>cp2 ({current.cp2.x},{current.cp2.y})</text>
                                <text x={current.pointB.x + 6 / zoom} y={current.pointB.y - 6 / zoom}>B ({current.pointB.x},{current.pointB.y})</text>
                            </g>
                        </>
                    ) : (
                        <g fontSize={labelFont} fill="#cbd5e1">
                            <text x={viewX + 12} y={viewY + 24}>No frames to display</text>
                        </g>
                    )}
                </g>
            </svg>
        </div>
    );
}



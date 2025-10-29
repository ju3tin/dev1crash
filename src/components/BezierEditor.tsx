"use client";

import React from "react";
import { controlPoints as defaultControlPoints } from "./controlPoints";

type Point = { x: number; y: number };
type ControlPoint = { cp1: Point; cp2: Point; pointB: Point; num: number, time: number };

interface BezierEditorProps {
    value?: ControlPoint[];
    onChange?: (next: ControlPoint[]) => void;
}

export default function BezierEditor({ value, onChange }: BezierEditorProps): JSX.Element {
    const [data, setData] = React.useState<ControlPoint[]>(value ?? defaultControlPoints);
    const [selected, setSelected] = React.useState<number>(0);
    const [jsonText, setJsonText] = React.useState<string>(JSON.stringify(data, null, 2));
    const [jsonError, setJsonError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (value) setData(value);
    }, [value]);

    React.useEffect(() => {
        setJsonText(JSON.stringify(data, null, 2));
    }, [data]);

    function updateFrame(index: number, updater: (f: ControlPoint) => ControlPoint) {
        setData((prev) => {
            if (!prev || index < 0 || index >= prev.length) return prev;
            const copy = prev.map((f) => ({ ...f, cp1: { ...f.cp1 }, cp2: { ...f.cp2 }, pointB: { ...f.pointB } }));
            copy[index] = updater(copy[index]);
            onChange?.(copy);
            return copy;
        });
    }

    function renumber(frames: ControlPoint[]): ControlPoint[] {
        return frames.map((f, i) => ({ ...f, num: i }));
    }

    function isValidFrameArray(input: any): input is ControlPoint[] {
        if (!Array.isArray(input)) return false;
        return input.every((f) =>
            f && typeof f === 'object' &&
            f.cp1 && typeof f.cp1.x === 'number' && typeof f.cp1.y === 'number' &&
            f.cp2 && typeof f.cp2.x === 'number' && typeof f.cp2.y === 'number' &&
            f.pointB && typeof f.pointB.x === 'number' && typeof f.pointB.y === 'number'
        );
    }

    function addFrame(afterIndex: number) {
        setData((prev) => {
            const insertAt = Math.min(Math.max(afterIndex + 1, 0), prev.length);
            const base: ControlPoint = prev.length > 0
                ? prev[Math.max(0, afterIndex)]
                : {
                    cp1: { x: 0, y: 200 },
                    cp2: { x: 0, y: 200 },
                    pointB:{ x: 0, y: 200 },
                    num: 0,
                    time: 0
                };
            const newFrame: ControlPoint = {
                cp1: { ...base.cp1 },
                cp2: { ...base.cp2 },
                pointB: { ...base.pointB },
                num: insertAt,
                time: 0
            };
            const next = renumber([...prev.slice(0, insertAt), newFrame, ...prev.slice(insertAt)]);
            onChange?.(next);
            setSelected(insertAt);
            return next;
        });
    }

    function deleteFrame(index: number) {
        setData((prev) => {
            if (prev.length <= 1) return prev;
            const next = renumber([...prev.slice(0, index), ...prev.slice(index + 1)]);
            const newIndex = Math.min(index, next.length - 1);
            onChange?.(next);
            setSelected(newIndex);
            return next;
        });
    }

    const frame = data[selected];
    const total = data.length;
    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const groupRef = React.useRef<SVGGElement | null>(null);
    const draggingRef = React.useRef<null | "cp1" | "cp2" | "pointB">(null);

    function toPath(start: Point, cp1: Point, cp2: Point, end: Point): string {
        return `M ${start.x},${start.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`;
    }

    const start: Point = { x: 0, y: 200 };
    const width = 420;
    const height = 220;
    const viewX = -60;
    const viewY = -20;
    const centerX = viewX + width / 2;
    const centerY = viewY + height / 2;

    const [zoom, setZoom] = React.useState<number>(1);
    const [panX, setPanX] = React.useState<number>(0);
    const [panY, setPanY] = React.useState<number>(0);
    const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
    const [speedMs, setSpeedMs] = React.useState<number>(250);
    const rafRef = React.useRef<number | null>(null);
    const lastTickRef = React.useRef<number>(0);

    React.useEffect(() => {
        function step(timestamp: number) {
            if (!isPlaying || total <= 1) {
                rafRef.current = requestAnimationFrame(step);
                return;
            }
            if (timestamp - lastTickRef.current >= speedMs) {
                lastTickRef.current = timestamp;
                setSelected((idx) => (idx + 1) % total);
            }
            rafRef.current = requestAnimationFrame(step);
        }
        rafRef.current = requestAnimationFrame(step);
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, speedMs, total]);

    function clientToSvg(evt: React.MouseEvent): { x: number; y: number } | null {
        const svgEl = svgRef.current;
        const target = groupRef.current ?? svgEl;
        if (!svgEl || !target) return null;
        const pt = (svgEl as any).createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        const ctm = (target as any).getScreenCTM();
        if (!ctm) return null;
        const ip = pt.matrixTransform(ctm.inverse());
        return { x: ip.x, y: ip.y };
    }

    function onDragStart(which: "cp1" | "cp2" | "pointB") {
        draggingRef.current = which;
    }

    function onDragMove(evt: React.MouseEvent) {
        if (!draggingRef.current || !frame) return;
        const p = clientToSvg(evt);
        if (!p) return;
        const which = draggingRef.current;
        updateFrame(selected, (f) => {
            const next = { ...f, cp1: { ...f.cp1 }, cp2: { ...f.cp2 }, pointB: { ...f.pointB } };
            if (which === "cp1") { next.cp1.x = p.x; next.cp1.y = p.y; }
            if (which === "cp2") { next.cp2.x = p.x; next.cp2.y = p.y; }
            if (which === "pointB") { next.pointB.x = p.x; next.pointB.y = p.y; }
            return next;
        });
    }

    function onDragEnd() {
        draggingRef.current = null;
    }

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
                <span>Frame: {selected} / {Math.max(0, total - 1)}</span>
            </div>

            <div style={{ background: "#0b1020", borderRadius: 8, border: "1px solid #1f2a44", padding: 8 }}>
                <svg
                    ref={svgRef}
                    viewBox={`${viewX} ${viewY} ${width} ${height}`}
                    width={588}
                    height={308}
                    onMouseMove={onDragMove}
                    onMouseUp={onDragEnd}
                    onMouseLeave={onDragEnd}
                    style={{ display: "block" }}
                >
                    <g opacity={0.25}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <line key={`v-${i}`} x1={i * 20} y1={-20} x2={i * 20} y2={height} stroke="#2a3354" strokeWidth={1} />
                        ))}
                        {Array.from({ length: 14 }).map((_, i) => (
                            <line key={`h-${i}`} x1={-60} y1={i * 20} x2={width} y2={i * 20} stroke="#2a3354" strokeWidth={1} />
                        ))}
                    </g>
                    <g ref={groupRef} transform={`translate(${panX} ${panY}) translate(${centerX} ${centerY}) scale(${zoom}) translate(${-centerX} ${-centerY})`}>
                        {frame && (
                            <>
                                <line x1={start.x} y1={start.y} x2={frame.cp1.x} y2={frame.cp1.y} stroke="#7aa2f7" strokeDasharray="4 4" />
                                <line x1={frame.pointB.x} y1={frame.pointB.y} x2={frame.cp2.x} y2={frame.cp2.y} stroke="#7aa2f7" strokeDasharray="4 4" />
                                <path d={toPath(start, frame.cp1, frame.cp2, frame.pointB)} stroke="#67e8f9" strokeWidth={3} fill="none" />
                                <circle cx={start.x} cy={start.y} r={4} fill="#22c55e" />
                                <circle cx={frame.cp1.x} cy={frame.cp1.y} r={6} fill="#f59e0b" style={{ cursor: "grab" }} onMouseDown={() => onDragStart("cp1")} />
                                <circle cx={frame.cp2.x} cy={frame.cp2.y} r={6} fill="#f59e0b" style={{ cursor: "grab" }} onMouseDown={() => onDragStart("cp2")} />
                                <circle cx={frame.pointB.x} cy={frame.pointB.y} r={6} fill="#ef4444" style={{ cursor: "grab" }} onMouseDown={() => onDragStart("pointB")} />
                            </>
                        )}
                    </g>
                </svg>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Frame</span>
                    <input
                        type="range"
                        min={0}
                        max={Math.max(0, total - 1)}
                        step={1}
                        value={selected}
                        onChange={(e) => setSelected(Number(e.target.value))}
                    />
                    <span>{selected} / {Math.max(0, total - 1)}</span>
                </label>
                <button
                    onClick={() => setSelected((i) => Math.max(0, i - 1))}
                    style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                >
                    Prev
                </button>
                <button
                    onClick={() => setSelected((i) => Math.min(total - 1, i + 1))}
                    style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                >
                    Next
                </button>
                <button
                    onClick={() => addFrame(selected)}
                    style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                >
                    Add Frame After
                </button>
                <button
                    onClick={() => deleteFrame(selected)}
                    disabled={total <= 1}
                    style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6, opacity: total <= 1 ? 0.6 : 1 }}
                >
                    Delete Frame
                </button>
                <button
                    onClick={() => {
                        const json = JSON.stringify(data, null, 2);
                        navigator.clipboard?.writeText(json).catch(() => {});
                    }}
                    style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                >
                    Copy JSON
                </button>
            </div>

            {frame ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                    <fieldset style={{ border: "1px solid #1f2a44", borderRadius: 8, padding: 12 }}>
                        <legend style={{ padding: "0 6px" }}>cp1</legend>
                        <NumberField label="x" value={frame.cp1.x} onChange={(v) => updateFrame(selected, (f) => ({ ...f, cp1: { ...f.cp1, x: v } }))} />
                        <NumberField label="y" value={frame.cp1.y} onChange={(v) => updateFrame(selected, (f) => ({ ...f, cp1: { ...f.cp1, y: v } }))} />
                    </fieldset>
                    <fieldset style={{ border: "1px solid #1f2a44", borderRadius: 8, padding: 12 }}>
                        <legend style={{ padding: "0 6px" }}>cp2</legend>
                        <NumberField label="x" value={frame.cp2.x} onChange={(v) => updateFrame(selected, (f) => ({ ...f, cp2: { ...f.cp2, x: v } }))} />
                        <NumberField label="y" value={frame.cp2.y} onChange={(v) => updateFrame(selected, (f) => ({ ...f, cp2: { ...f.cp2, y: v } }))} />
                    </fieldset>
                    <fieldset style={{ border: "1px solid #1f2a44", borderRadius: 8, padding: 12 }}>
                        <legend style={{ padding: "0 6px" }}>pointB</legend>
                        <NumberField label="x" value={frame.pointB.x} onChange={(v) => updateFrame(selected, (f) => ({ ...f, pointB: { ...f.pointB, x: v } }))} />
                        <NumberField label="y" value={frame.pointB.y} onChange={(v) => updateFrame(selected, (f) => ({ ...f, pointB: { ...f.pointB, y: v } }))} />
                    </fieldset>
                    <fieldset style={{ border: "1px solid #1f2a44", borderRadius: 8, padding: 12 }}>
                        <legend style={{ padding: "0 6px" }}>time</legend>
                        <NumberField label="time" value={frame.time} onChange={(v) => updateFrame(selected, (f) => ({ ...f, time: v }))} />
                    </fieldset>
                </div>
            ) : null}

            <div>
                <label style={{ display: "block", marginBottom: 6, color: "#94a3b8" }}>JSON (editable)</label>
                <textarea
                    value={jsonText}
                    onChange={(e) => { setJsonText(e.target.value); setJsonError(null); }}
                    spellCheck={false}
                    style={{ width: "100%", height: 240, background: "#0b1020", color: "#e2e8f0", border: "1px solid #1f2a44", borderRadius: 8, padding: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace", fontSize: 12 }}
                />
                {jsonError ? (
                    <div style={{ color: "#ef4444", marginTop: 6 }}>{jsonError}</div>
                ) : null}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                        onClick={() => {
                            try {
                                const parsed = JSON.parse(jsonText);
                                if (!isValidFrameArray(parsed)) {
                                    setJsonError('Invalid format: expected an array of frames with cp1/cp2/pointB {x,y}.');
                                    return;
                                }
                                const next = renumber(parsed);
                                setData(next);
                                onChange?.(next);
                                setJsonError(null);
                            } catch (e: any) {
                                setJsonError(e?.message ?? 'Failed to parse JSON');
                            }
                        }}
                        style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                    >
                        Apply JSON
                    </button>
                    <button
                        onClick={() => setJsonText(JSON.stringify(data, null, 2))}
                        style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}
                    >
                        Reformat
                    </button>
                </div>
            </div>
        </div>
    );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 16 }}>{label}</span>
            <input
                type="number"
                value={Number.isFinite(value) ? value : 0}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ width: "100%", padding: "6px 8px", border: "1px solid #334155", borderRadius: 6, background: "#0f172a", color: "#e2e8f0" }}
            />
        </label>
    );
}



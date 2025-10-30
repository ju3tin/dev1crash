"use client";

import React from "react";
import BezierVisualizer from "@/components/BezierVisualizer";
import BezierEditor from "@/components/BezierEditor";

export default function Test4Page(): JSX.Element {
    const [data, setData] = React.useState(undefined as any);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [saving, setSaving] = React.useState<boolean>(false);
    const saveTimer = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        let active = true;
        async function load() {
            try {
                const res = await fetch(`/api/bezier?key=default`, { cache: 'no-store' });
                const json = await res.json();
                if (!active) return;
                setData(json.frames ?? undefined);
            } catch (_) {
                // ignore
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        return () => {
            active = false;
        };
    }, []);

    const onChange = React.useCallback((next: any[]) => {
        if (!Array.isArray(next) || next.length === 0) {
            setData([]);
            return;
        }
        setData(next);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                setSaving(true);
                await fetch(`/api/bezier?key=default`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ frames: next })
                });
            } catch (_) {
                // ignore
            } finally {
                setSaving(false);
            }
        }, 400);
    }, []);
    return (
        <div style={{ padding: 16, display: "grid", gap: 24 }}>
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Bezier Curve Visualizer</h1>
                <p style={{ color: "#64748b", marginBottom: 16 }}>Animating through controlPoints with cubic Bezier segments.</p>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    {loading ? 'Loading…' : saving ? 'Saving…' : null}
                </div>
                <BezierVisualizer data={data} />
            </div>
            <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Bezier Frame Editor</h2>
                <BezierEditor value={data} onChange={onChange} />
            </div>
        </div>
    );
}



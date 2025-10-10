/**
 * ZoomPanControls.tsx
 *
 * 줌/팬 및 시간 범위 컨트롤 컴포넌트
 */

import React from 'react';

type ZoomPanProps = {
    // zoom control
    zoom: number;
    zoomLabel?: string;
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;

    // pan control
    onPanLeft?: () => void;
    onPanRight?: () => void;

    // range inputs (optional)
    startAt?: string | null; // datetime-local string
    endAt?: string | null;
    setStartAt?: (v: string | null) => void;
    setEndAt?: (v: string | null) => void;
    setRelativeRange?: (minutes: number) => void;

    // refresh
    onRefresh?: () => void;

    // compact mode reduces labels and spacing
    compact?: boolean;
    className?: string;
};

const btnBase: React.CSSProperties = {
    background: '#2b2f36',
    color: '#f7f8fa',
    border: '1px solid #2e3238',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
};

export default function ZoomPanControls({
    zoom,
    zoomLabel,
    onZoomIn,
    onZoomOut,
    canZoomIn,
    canZoomOut,
    onPanLeft,
    onPanRight,
    startAt,
    endAt,
    setStartAt,
    setEndAt,
    setRelativeRange,
    onRefresh,
    compact = false,
    className,
}: ZoomPanProps) {
    return (
        <div
            className={className}
            style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
                fontSize: compact ? 11 : 13,
            }}
        >
            {/* Zoom Controls */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={onZoomIn} disabled={!canZoomIn} style={{ ...btnBase, opacity: canZoomIn ? 1 : 0.4 }}>
                    ➕
                </button>
                <button
                    onClick={onZoomOut}
                    disabled={!canZoomOut}
                    style={{ ...btnBase, opacity: canZoomOut ? 1 : 0.4 }}
                >
                    ➖
                </button>
                {zoomLabel && <span style={{ marginLeft: 4, color: '#94a3b8' }}>{zoomLabel}</span>}
            </div>

            {/* Pan Controls */}
            {(onPanLeft || onPanRight) && (
                <div style={{ display: 'flex', gap: 4 }}>
                    {onPanLeft && (
                        <button onClick={onPanLeft} style={btnBase}>
                            ◀
                        </button>
                    )}
                    {onPanRight && (
                        <button onClick={onPanRight} style={btnBase}>
                            ▶
                        </button>
                    )}
                </div>
            )}

            {/* Range Inputs */}
            {setStartAt && setEndAt && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="datetime-local"
                        value={startAt || ''}
                        onChange={(e) => setStartAt(e.target.value || null)}
                        style={{
                            ...btnBase,
                            fontSize: 11,
                            padding: '4px 6px',
                        }}
                    />
                    <span style={{ color: '#64748b' }}>~</span>
                    <input
                        type="datetime-local"
                        value={endAt || ''}
                        onChange={(e) => setEndAt(e.target.value || null)}
                        style={{
                            ...btnBase,
                            fontSize: 11,
                            padding: '4px 6px',
                        }}
                    />

                    {/* Quick Range Buttons */}
                    {setRelativeRange && (
                        <>
                            <button onClick={() => setRelativeRange(60)} style={{ ...btnBase, fontSize: 10 }}>
                                1시간
                            </button>
                            <button onClick={() => setRelativeRange(360)} style={{ ...btnBase, fontSize: 10 }}>
                                6시간
                            </button>
                            <button onClick={() => setRelativeRange(1440)} style={{ ...btnBase, fontSize: 10 }}>
                                1일
                            </button>
                        </>
                    )}

                    {/* Clear Button */}
                    <button
                        onClick={() => {
                            setStartAt(null);
                            setEndAt(null);
                        }}
                        style={{ ...btnBase, fontSize: 10, background: '#374151' }}
                    >
                        ✕ 범위 해제
                    </button>
                </div>
            )}

            {/* Refresh Button */}
            {onRefresh && (
                <button onClick={onRefresh} style={{ ...btnBase, background: '#0ea5e9' }}>
                    🔄
                </button>
            )}
        </div>
    );
}

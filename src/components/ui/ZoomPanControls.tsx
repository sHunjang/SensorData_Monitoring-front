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
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
            }}
        >
            {/* Zoom controls */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: compact ? 12 : 13, color: '#94a3b8' }}>{zoomLabel ?? `Zoom ${zoom}`}</div>
                <button
                    style={{ ...btnBase, background: canZoomIn ? '#0ecb81' : '#2e3238' }}
                    onClick={onZoomIn}
                    disabled={!canZoomIn}
                    aria-label="Zoom In"
                >
                    ➕
                </button>
                <button
                    style={{ ...btnBase, background: canZoomOut ? '#0ecb81' : '#2e3238' }}
                    onClick={onZoomOut}
                    disabled={!canZoomOut}
                    aria-label="Zoom Out"
                >
                    ➖
                </button>
            </div>

            {/* Pan controls */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button style={btnBase} onClick={onPanLeft} aria-label="Pan Left">
                    ◀ Prev
                </button>
                <button style={btnBase} onClick={onPanRight} aria-label="Pan Right">
                    Next ▶
                </button>
            </div>

            {/* Range inputs (optional) */}
            {setStartAt && setEndAt && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        type="datetime-local"
                        value={startAt ?? ''}
                        onChange={(e) => setStartAt(e.target.value || null)}
                        style={{
                            background: '#2b2f36',
                            color: '#f7f8fa',
                            border: '1px solid #2e3238',
                            padding: '6px 8px',
                            borderRadius: 6,
                        }}
                        aria-label="Start time"
                    />
                    <span style={{ color: '#94a3b8' }}>~</span>
                    <input
                        type="datetime-local"
                        value={endAt ?? ''}
                        onChange={(e) => setEndAt(e.target.value || null)}
                        style={{
                            background: '#2b2f36',
                            color: '#f7f8fa',
                            border: '1px solid #2e3238',
                            padding: '6px 8px',
                            borderRadius: 6,
                        }}
                        aria-label="End time"
                    />
                </div>
            )}

            {/* Quick ranges
            {setRelativeRange && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button style={btnBase} onClick={() => setRelativeRange(60)}>
                        1h
                    </button>
                    <button style={btnBase} onClick={() => setRelativeRange(24 * 60)}>
                        24h
                    </button>
                    <button style={btnBase} onClick={() => setRelativeRange(7 * 24 * 60)}>
                        7d
                    </button>
                </div>
            )} */}

            {/* Refresh */}
            {onRefresh && (
                <div style={{ marginLeft: 'auto' }}>
                    <button style={{ ...btnBase, background: '#0ecb81' }} onClick={onRefresh}>
                        🔄 Refresh
                    </button>
                </div>
            )}
        </div>
    );
}

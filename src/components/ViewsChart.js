import React, { useEffect, useRef, useState } from 'react';

const H = 240;
const PAD = { top: 16, right: 16, bottom: 30, left: 40 };

function niceMax(v) {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) {
    const m = s * pow;
    if (m >= v) return m;
  }
  return 10 * pow;
}

/**
 * Biểu đồ vùng lượt xem theo ngày (1 chuỗi, có crosshair + tooltip khi rê chuột).
 * data: [{ key, date: Date, value }]
 */
export default function ViewsChart({ data, language = 'vi' }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = data.length;
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const innerW = Math.max(10, width - PAD.left - PAD.right);
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / max) * innerH;

  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const area = n
    ? `${line} L${x(n - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z`
    : '';

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 70))));

  const fmtDate = (d, long) =>
    d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', long
      ? { weekday: 'short', day: '2-digit', month: '2-digit' }
      : { day: '2-digit', month: '2-digit' });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const ratio = (mx - PAD.left) / innerW;
    const i = Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))));
    setHover(i);
  };

  const h = hover !== null ? data[hover] : null;
  const tipLeft = h ? Math.min(Math.max(x(hover), 70), width - 70) : 0;

  return (
    <div className="views-chart" ref={wrapRef}>
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={language === 'vi' ? 'Biểu đồ lượt xem theo ngày' : 'Daily views chart'}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="viewsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f65c5c" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#f65c5c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={y(t)}
              y2={y(t)}
              className="vc-grid"
            />
            <text x={PAD.left - 10} y={y(t)} className="vc-axis" textAnchor="end" dominantBaseline="middle">
              {t}
            </text>
          </g>
        ))}

        {data.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={d.key} x={x(i)} y={H - 8} className="vc-axis" textAnchor="middle">
              {fmtDate(d.date)}
            </text>
          ) : null
        )}

        <path d={area} fill="url(#viewsArea)" />
        <path d={line} fill="none" stroke="#f65c5c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} className="vc-crosshair" />
            <circle cx={x(hover)} cy={y(h.value)} r="5" fill="#f65c5c" stroke="#141418" strokeWidth="2" />
          </g>
        )}
      </svg>

      {h && (
        <div className="vc-tooltip" style={{ left: tipLeft, top: Math.max(0, y(h.value) - 62) }}>
          <span className="vc-tooltip-date">{fmtDate(h.date, true)}</span>
          <strong>
            {h.value.toLocaleString()} {language === 'vi' ? 'lượt xem' : 'views'}
          </strong>
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './WakeSlider.css';

const SETTLE = 9.23;
const FULL_SPEED = 320;
const MIN_REACH = 1.5;
const FLAT = 0.002;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (s) => s * s * (3 - 2 * s);
const toPct = (v, min, max) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
const snap = (v, min, max, step) => {
  if (!(max > min)) return min;
  if (!(step > 0)) return clamp(v, min, max);
  const lastWhole = min + Math.floor(+((max - min) / step).toFixed(6)) * step;
  const grid = clamp(Math.round((v - min) / step) * step + min, min, lastWhole);
  return +(lastWhole < max && Math.abs(v - max) <= Math.abs(v - grid) ? max : grid).toFixed(6);
};

// Kiểm tra prefers-reduced-motion thuần mà không cần gói motion/react ngoài
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mql.matches);
    const handler = (e) => setReduce(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, []);
  return reduce;
}

export default function WakeSlider({
  value: valueProp,
  defaultValue = 50,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  bars = 32,
  height = 56,
  restHeight = 12,
  gap = 4,
  fillColor = '#f5f5f5',
  trackColor = '#27272a',
  crestColor = '',
  sensitivity = 1,
  reach = 6,
  skew = 0.6,
  glide = 0.3,
  smoothing = 100,
  showValue = false,
  formatValue,
  disabled = false,
  ariaLabel = 'Value',
  className = ''
}) {
  const [inner, setInner] = useState(defaultValue);
  const value = clamp(valueProp ?? inner, min, max);
  const pct = toPct(value, min, max);
  const reduce = usePrefersReducedMotion();
  const format = formatValue ?? String;
  const rest = Math.min(restHeight, height - 1) / height;

  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const handleRef = useRef(null);
  const barEls = useRef([]);
  const crestEls = useRef([]);
  const pointerId = useRef(null);
  const lastAmp = useRef(0);
  const latest = useRef(value);
  latest.current = value;

  // Hệ lò xo vật lý (head & speed) tương đương useMotionValue + useSpring + useVelocity của motion/react
  const springRef = useRef({
    target: pct,
    head: pct,
    headVel: 0,
    speed: 0,
    speedAcc: 0,
    rafId: null,
    lastTime: 0
  });

  const paint = useCallback(
    (force = false) => {
      const s = springRef.current;
      const h = ((reduce ? s.target : s.head) / 100) * (bars - 1);
      const v = reduce ? 0 : s.speed;
      const amp = smoothstep(clamp((Math.abs(v) * sensitivity) / FULL_SPEED, 0, 1));
      const dir = Math.sign(v) || 1;
      const r = MIN_REACH + (reach - MIN_REACH) * amp;
      const behind = r * (1 + skew);
      const ahead = r * (1 - 0.5 * skew);
      const lit = Math.round(h);
      const flat = !force && amp < FLAT && lastAmp.current < FLAT;

      for (let i = 0; i < bars; i++) {
        const el = barEls.current[i];
        if (!el) continue;
        const on = i <= lit ? 'true' : 'false';
        if (el.dataset.on !== on) el.dataset.on = on;
        if (flat) continue;
        const d = i - h;
        const R = d * dir < 0 ? behind : ahead;
        const lift = Math.abs(d) < R ? amp * Math.cos((Math.PI * d) / (2 * R)) ** 2 : 0;
        el.style.transform = `scaleY(${rest + lift * (1 - rest)})`;
        const crest = crestEls.current[i];
        if (crest) crest.style.opacity = String(lift);
      }
      lastAmp.current = amp;
    },
    [bars, reach, reduce, rest, sensitivity, skew]
  );

  const paintRef = useRef(paint);
  paintRef.current = paint;

  const startLoop = useCallback(() => {
    const s = springRef.current;
    if (s.rafId !== null) return;
    s.lastTime = performance.now();

    const stepFrame = (now) => {
      const dt = Math.min(0.032, Math.max(0.001, (now - s.lastTime) / 1000));
      s.lastTime = now;

      const w0 = SETTLE / Math.max(0.05, glide);
      const stiffness = w0 * w0;
      const damping = 2 * w0;

      // Tích phân lò xo cho head
      const disp = s.head - s.target;
      const acc = -stiffness * disp - damping * s.headVel;
      s.headVel += acc * dt;
      s.head += s.headVel * dt;

      // Tích phân lò xo cho speed (làm mượt vận tốc rawSpeed = s.headVel)
      const wv = 2000 / Math.max(10, smoothing);
      const subSteps = 4;
      const subDt = dt / subSteps;
      for (let k = 0; k < subSteps; k++) {
        const vDisp = s.speed - s.headVel;
        const vAcc = -wv * wv * vDisp - 2.5 * wv * s.speedAcc;
        s.speedAcc += vAcc * subDt;
        s.speed += s.speedAcc * subDt;
      }

      paintRef.current(false);

      const settled =
        Math.abs(s.target - s.head) < 0.02 &&
        Math.abs(s.headVel) < 0.15 &&
        Math.abs(s.speed) < 0.15;

      if (settled) {
        s.head = s.target;
        s.headVel = 0;
        s.speed = 0;
        s.speedAcc = 0;
        paintRef.current(true);
        s.rafId = null;
      } else {
        s.rafId = requestAnimationFrame(stepFrame);
      }
    };

    s.rafId = requestAnimationFrame(stepFrame);
  }, [glide, smoothing]);

  useEffect(() => {
    const s = springRef.current;
    s.target = pct;
    if (reduce) {
      s.head = pct;
      s.headVel = 0;
      s.speed = 0;
      paintRef.current(true);
    } else {
      startLoop();
    }
  }, [pct, reduce, startLoop]);

  useEffect(() => {
    const s = springRef.current;
    return () => {
      if (s.rafId !== null) {
        cancelAnimationFrame(s.rafId);
        s.rafId = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    paintRef.current(true);
  });

  const commit = (next) => {
    const clean = snap(next, min, max, step);
    if (clean === latest.current) return;
    latest.current = clean;
    if (valueProp === undefined) setInner(clean);
    onChange?.(clean);
  };

  const commitFromX = (x) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    let ratio = clamp((x - rect.left) / rect.width, 0, 1);
    if (getComputedStyle(track).direction === 'rtl') ratio = 1 - ratio;
    commit(min + ratio * (max - min));
  };

  const onPointerDown = (e) => {
    if (disabled || pointerId.current !== null) return;
    pointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    rootRef.current?.removeAttribute('data-instant');
    handleRef.current?.focus({ preventScroll: true });
    commitFromX(e.clientX);
  };

  const onPointerMove = (e) => {
    if (e.pointerId === pointerId.current) commitFromX(e.clientX);
  };

  const endDrag = (e) => {
    if (e.pointerId !== pointerId.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    pointerId.current = null;
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    const jumps = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max
    };
    if (!(e.key in jumps)) return;
    e.preventDefault();
    const clean = snap(jumps[e.key], min, max, step);
    const p = toPct(clean, min, max);
    rootRef.current?.setAttribute('data-instant', 'true');
    const s = springRef.current;
    s.target = p;
    s.head = p;
    s.headVel = 0;
    s.speed = 0;
    s.speedAcc = 0;
    paintRef.current(true);
    commit(clean);
  };

  const barNodes = useMemo(() => {
    barEls.current.length = bars;
    crestEls.current.length = bars;
    return Array.from({ length: bars }, (_, i) => (
      <span
        key={i}
        ref={(el) => {
          barEls.current[i] = el;
        }}
        className="wake-slider__bar"
      >
        {crestColor ? (
          <span
            ref={(el) => {
              crestEls.current[i] = el;
            }}
            className="wake-slider__crest"
          />
        ) : null}
      </span>
    ));
  }, [bars, crestColor]);

  return (
    <div
      ref={rootRef}
      className={`wake-slider${className ? ` ${className}` : ''}`}
      aria-disabled={disabled || undefined}
      style={{
        '--ws-fill': fillColor,
        '--ws-track': trackColor,
        '--ws-crest': crestColor || fillColor,
        '--ws-height': `${height}px`,
        '--ws-gap': `${gap}px`,
        '--ws-rest': rest
      }}
    >
      <div
        ref={trackRef}
        className="wake-slider__track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        {barNodes}
        <button
          ref={handleRef}
          type="button"
          role="slider"
          className="wake-slider__handle"
          tabIndex={disabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={format(value)}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
        />
      </div>
      {showValue ? (
        <span className="wake-slider__value" aria-hidden="true">
          {format(value)}
        </span>
      ) : null}
    </div>
  );
}

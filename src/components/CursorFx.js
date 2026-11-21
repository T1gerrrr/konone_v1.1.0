import { useEffect, useRef } from 'react';

/**
 * Các hiệu ứng chuột dạng canvas: bubble | rainbow | trail3d
 * - contained=false: phủ toàn màn hình (profile public)
 * - contained=true : chỉ phủ khung cha (khung xem trước trong editor)
 * Canvas nằm trong DOM của React, nghe chuột trên window -> dọn dẹp sạch khi đổi hiệu ứng.
 */

const DEFAULT_TRAIL_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">' +
      '<path d="M2 2 L2 24 L8 18.5 L12.5 29 L16.5 27.2 L12 17 L20 17 Z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>'
  );

/* ---------- Bubble ---------- */
function createBubble() {
  const particles = [];
  return {
    onMove(x, y) {
      const life = Math.floor(Math.random() * 60 + 60);
      particles.push({
        x, y, life, max: life,
        vx: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 10),
        vy: -0.4 + Math.random() * -1,
      });
    },
    frame(ctx, w, h) {
      if (!particles.length) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx += ((Math.random() < 0.5 ? -1 : 1) * 2) / 75;
        p.vy -= Math.random() / 600;
        p.life--;
        if (p.life < 0) { particles.splice(i, 1); continue; }
        const scale = 0.2 + (p.max - p.life) / p.max;
        ctx.fillStyle = '#e6f1f7';
        ctx.strokeStyle = '#3a92c5';
        ctx.beginPath();
        ctx.arc(p.x - 2 * scale, p.y - 2, 4 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      }
      if (!particles.length) ctx.clearRect(0, 0, w, h);
    },
  };
}

/* ---------- Rainbow ---------- */
const RAINBOW = ['#FE0000', '#FD8C00', '#FFE500', '#119F0B', '#0644B3', '#C22EDC'];

function mixColor(c1, c2, f) {
  const p = (c, i) => parseInt(c.substr(i, 2), 16);
  const m = (i) => Math.round(p(c1, i) + (p(c2, i) - p(c1, i)) * f);
  return `rgb(${m(1)}, ${m(3)}, ${m(5)})`;
}

function createRainbow({ length = 20, size = 3, trailSpeed = 0.4 }) {
  const cursor = { x: 0, y: 0 };
  let pts = null;
  let time = 0;
  return {
    onMove(x, y) {
      cursor.x = x;
      cursor.y = y;
      if (!pts) pts = Array.from({ length }, () => ({ x, y }));
    },
    frame(ctx, w, h) {
      if (!pts) return;
      ctx.clearRect(0, 0, w, h);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const set = [];
      let x = cursor.x;
      let y = cursor.y;
      pts.forEach((p, i) => {
        const next = pts[i + 1] || pts[0];
        p.x = x;
        p.y = y;
        set.push({ x, y });
        x += (next.x - p.x) * trailSpeed;
        y += (next.y - p.y) * trailSpeed;
      });
      time += 0.002;
      const offset = time % 1;
      const s = size * (0.8 + (Math.sin(time * 40) + 1) * 0.2);
      RAINBOW.forEach((color, i) => {
        ctx.beginPath();
        ctx.strokeStyle = mixColor(color, RAINBOW[(i + 1) % RAINBOW.length], (i + offset) / RAINBOW.length);
        ctx.moveTo(set[0].x, set[0].y + i * (s - 1));
        for (let k = 1; k < set.length; k++) ctx.lineTo(set[k].x, set[k].y + i * s);
        ctx.lineWidth = s;
        ctx.stroke();
      });
    },
  };
}

/* ---------- Trail 3D (chuỗi con trỏ nối đuôi) ---------- */
function createTrail({ particles = 15, rate = 0.4, imageSrc }) {
  const img = new Image();
  img.src = imageSrc || DEFAULT_TRAIL_IMG;
  const cursor = { x: 0, y: 0 };
  let pts = null;
  return {
    onMove(x, y) {
      cursor.x = x;
      cursor.y = y;
      if (!pts) pts = Array.from({ length: particles }, () => ({ x, y }));
    },
    frame(ctx, w, h) {
      if (!pts) return;
      ctx.clearRect(0, 0, w, h);
      let x = cursor.x;
      let y = cursor.y;
      pts.forEach((p, i) => {
        const next = pts[i + 1] || pts[0];
        p.x = x;
        p.y = y;
        if (img.complete && img.naturalWidth) ctx.drawImage(img, p.x, p.y);
        x += (next.x - p.x) * rate;
        y += (next.y - p.y) * rate;
      });
    },
  };
}

/* ---------- Canvas (dây lò xo nhiều màu, trộn sáng) ---------- */
function createCanvasLines() {
  const TRAILS = 20;
  const SIZE = 50;
  const FRICTION = 0.5;
  const DAMPENING = 0.25;
  const TENSION = 0.98;
  const pos = { x: 0, y: 0 };
  let started = false;
  let hue = { phase: Math.random() * Math.PI * 2 };
  let lines = null;

  const makeLines = () =>
    Array.from({ length: TRAILS }, (_, i) => ({
      spring: 0.45 + (i / TRAILS) * 0.025 + 0.1 * Math.random() - 0.05,
      friction: FRICTION + 0.01 * Math.random() - 0.005,
      nodes: Array.from({ length: SIZE }, () => ({ x: pos.x, y: pos.y, vx: 0, vy: 0 })),
    }));

  return {
    onMove(x, y) {
      pos.x = x;
      pos.y = y;
      if (!started) { started = true; lines = makeLines(); }
    },
    frame(ctx, w, h) {
      if (!started) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      hue.phase += 0.0015;
      ctx.strokeStyle = `hsla(${Math.round(285 + Math.sin(hue.phase) * 85)},100%,50%,0.025)`;
      ctx.lineWidth = 10;
      lines.forEach((line) => {
        let spring = line.spring;
        const nodes = line.nodes;
        nodes[0].vx += (pos.x - nodes[0].x) * spring;
        nodes[0].vy += (pos.y - nodes[0].y) * spring;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (i > 0) {
            const prev = nodes[i - 1];
            n.vx += (prev.x - n.x) * spring;
            n.vy += (prev.y - n.y) * spring;
            n.vx += prev.vx * DAMPENING;
            n.vy += prev.vy * DAMPENING;
          }
          n.vx *= line.friction;
          n.vy *= line.friction;
          n.x += n.vx;
          n.y += n.vy;
          spring *= TENSION;
        }
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        let k = 1;
        for (; k < nodes.length - 2; k++) {
          const a = nodes[k];
          const b = nodes[k + 1];
          ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) * 0.5, (a.y + b.y) * 0.5);
        }
        const a = nodes[k];
        const b = nodes[k + 1];
        ctx.quadraticCurveTo(a.x, a.y, b.x, b.y);
        ctx.stroke();
        ctx.closePath();
      });
    },
  };
}

const FACTORIES = { bubble: createBubble, rainbow: createRainbow, trail3d: createTrail, canvas: createCanvasLines };

export default function CursorFx({
  id,
  contained = false,
  length = 20,
  size = 3,
  trailSpeed = 0.4,
  particles = 15,
  rate = 0.4,
  imageSrc,
  zIndex = 48,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const make = FACTORIES[id];
    if (!canvas || !make) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const fx = make({ length, size, trailSpeed, particles, rate, imageSrc });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width));
      canvas.height = Math.max(1, Math.round(r.height));
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    window.addEventListener('resize', resize);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (contained && (x < 0 || y < 0 || x > r.width || y > r.height)) return;
      fx.onMove(x, y);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let raf = 0;
    const loop = () => {
      fx.frame(ctx, canvas.width, canvas.height);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
      if (ro) ro.disconnect();
    };
  }, [id, contained, length, size, trailSpeed, particles, rate, imageSrc]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: contained ? 'absolute' : 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex,
      }}
    />
  );
}

import React, { useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tên hiện ra từng ký tự: mờ -> rõ, trượt lên, có độ trễ so le.
 * `play` = false thì giữ ẩn (chờ người xem bấm qua màn Enter).
 */
export function RevealText({ text, play = true, delay = 0, step = 45 }) {
  const chars = Array.from(String(text || ''));
  return (
    <span className={`fx-reveal ${play ? 'is-playing' : ''}`} aria-label={text}>
      {chars.map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="fx-reveal-char"
          style={{ animationDelay: `${delay + i * step}ms` }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

/**
 * Mô tả gõ ra từng chữ như máy đánh chữ, kèm ký tự ngẫu nhiên "giải mã" ở đầu bút.
 */
const GLYPHS = '!<>-_\\/[]{}=+*^?#';

export function TypeText({ text, play = true, delay = 0, speed = 38 }) {
  const full = String(text || '');
  const [count, setCount] = useState(0);
  const [glyph, setGlyph] = useState('');

  useEffect(() => {
    if (!play) {
      setCount(0);
      return undefined;
    }
    if (prefersReducedMotion()) {
      setCount(full.length);
      return undefined;
    }
    let i = 0;
    let timer;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1;
        setCount(i);
        setGlyph(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
        if (i >= full.length) {
          clearInterval(timer);
          setGlyph('');
        }
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [full, play, delay, speed]);

  const done = count >= full.length;
  return (
    <span className="fx-type" aria-label={full}>
      <span aria-hidden="true">{full.slice(0, count)}</span>
      {!done && glyph && (
        <span aria-hidden="true" className="fx-type-glyph">
          {glyph}
        </span>
      )}
    </span>
  );
}

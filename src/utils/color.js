// Nền ô nhạc: màu người dùng chọn, hơi trong suốt để vẫn thấy nền phía sau
export function musicBoxBg(hex, alpha = 0.82) {
  const clean = String(hex || '').replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) return hex;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// Ô nhạc đồng bộ với thẻ Basic: cùng màu, cùng độ trong suốt, cùng độ mờ nền.
// `musicBoxColor` (nếu người dùng chọn) chỉ thay màu, vẫn theo độ trong suốt/blur của thẻ.
export function musicBoxSyncStyle({ cardColor, musicBoxColor, opacity, blur, gradient, gradientFrom, gradientTo }) {
  const o = Math.max(0, Math.min(100, Number(opacity) || 0)) / 100;
  const b = Math.round((Math.max(0, Number(blur) || 0) / 100) * 40);
  const base = musicBoxColor || cardColor || '#141417';
  let background;
  if (o <= 0.02) background = 'transparent';
  else if (gradient && !musicBoxColor) {
    background = `linear-gradient(145deg, ${musicBoxBg(gradientFrom || base, o)}, ${musicBoxBg(gradientTo || base, o * 0.65)})`;
  } else background = musicBoxBg(base, o);
  const filter = b > 0 ? `blur(${b}px)` : 'none';
  return {
    background,
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    border: 'none',
    boxShadow: o <= 0.05 ? 'none' : undefined
  };
}

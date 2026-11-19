// Nền ô nhạc: màu người dùng chọn, hơi trong suốt để vẫn thấy nền phía sau
export function musicBoxBg(hex, alpha = 0.82) {
  const clean = String(hex || '').replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) return hex;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

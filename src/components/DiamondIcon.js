import React from 'react';

// Icon kim cương 2D nét mảnh hiện đại — đánh dấu tính năng Premium
export default function DiamondIcon({ className = '', size = 14, style, title = 'Premium' }) {
  return (
    <svg
      className={`diamond-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20" />
      <path d="M12 21 8 9l2-6" />
      <path d="M12 21 16 9l-2-6" />
    </svg>
  );
}

import React from 'react';

// Icon kim cương 2D trắng phát sáng — đánh dấu tính năng Premium
export default function DiamondIcon({ className = '', size = 14, style, title = 'Premium' }) {
  return (
    <svg
      className={`diamond-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M6.5 3.5h11l4 5.5L12 20.5 2.5 9z" fill="#ffffff" />
      <path
        d="M2.5 9h19M9.5 3.5 8 9l4 11.5L16 9l-1.5-5.5"
        fill="none"
        stroke="rgba(0, 0, 0, 0.28)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

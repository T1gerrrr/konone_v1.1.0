import React from 'react';

const svg = (children) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

/**
 * Danh sách hiệu ứng chuột hiển thị ở bảng chọn bên phải (Dashboard > Chỉnh sửa).
 * Thêm hiệu ứng mới: thêm 1 object { id, name, icon } vào mảng này,
 * rồi thêm panel cấu hình tương ứng (cursorTab === id) trong ProfileEditor.js.
 */
export const CURSOR_EFFECTS = [
  { id: 'splash', name: 'Splash', icon: svg(<path d="M12 2.7s6 6.4 6 11.3a6 6 0 0 1-12 0c0-4.9 6-11.3 6-11.3z" />) },
  { id: 'blob', name: 'Blob', icon: svg(<><circle cx="9" cy="10" r="5.5" /><circle cx="17" cy="16" r="3.5" /></>) },
  { id: 'bubble', name: 'Bubble', icon: svg(<><circle cx="8" cy="15" r="4" /><circle cx="16" cy="9" r="3" /><circle cx="15" cy="18" r="1.5" /></>) },
  { id: 'rainbow', name: 'Rainbow', icon: svg(<><path d="M3 18a9 9 0 0 1 18 0" /><path d="M7 18a5 5 0 0 1 10 0" /></>) },
  { id: 'trail3d', name: '3D Trail', icon: svg(<path d="M5 3l14 7-6 2-2 6z" />) },
  { id: 'canvas', name: 'Canvas', icon: svg(<><path d="M3 8c4-5 6 5 10 0s6 3 8-1" /><path d="M3 16c4-5 6 5 10 0s6 3 8-1" /></>) },
];

/** Các hiệu ứng vẽ bằng canvas (CursorFx.js), lưu trong profile.cursorFx.id */
export const CURSOR_FX_IDS = ['bubble', 'rainbow', 'trail3d', 'canvas'];

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ghi 1 lượt truy cập mỗi khi đổi trang (api/hit.js). Không cookie, không IP, chỉ mã ngẫu nhiên lưu trong trình duyệt.
function getVisitorId() {
  try {
    let id = localStorage.getItem('konone_vid');
    if (!id) {
      id = (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      localStorage.setItem('konone_vid', id);
    }
    return id;
  } catch (e) {
    return null; // chặn lưu trữ -> bỏ qua, không đếm
  }
}

export default function RouteTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return; // không đếm trang quản trị
    const vid = getVisitorId();
    if (!vid) return;

    // Chống đếm đúp (React StrictMode / bấm lại cùng trang trong 1,5 giây)
    try {
      const last = JSON.parse(sessionStorage.getItem('konone_last_hit') || 'null');
      if (last && last.path === pathname && Date.now() - last.t < 1500) return;
      sessionStorage.setItem('konone_last_hit', JSON.stringify({ path: pathname, t: Date.now() }));
    } catch (e) {
      /* bỏ qua */
    }

    const payload = JSON.stringify({ vid, path: pathname });
    try {
      fetch('/api/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    } catch (e) {
      /* không ảnh hưởng người dùng */
    }
  }, [pathname]);

  return null;
}

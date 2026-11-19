// Khoá ngày dạng YYYY-MM-DD theo giờ địa phương (dùng cho thống kê lượt xem theo ngày)
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Danh sách N ngày gần nhất (cũ -> mới), kèm số lượt xem từ map viewsByDay
export function lastNDays(viewsByDay, n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dateKey(d);
    out.push({ key, date: d, value: Number(viewsByDay?.[key]) || 0 });
  }
  return out;
}

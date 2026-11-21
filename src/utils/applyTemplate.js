import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Danh sách yêu thích / dùng gần đây lưu trên trình duyệt, theo từng tài khoản
export function readList(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

export function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* bỏ qua nếu trình duyệt chặn lưu trữ */
  }
}

export const tplKeys = (uid) => ({
  fav: `konone.tpl.fav.${uid}`,
  recent: `konone.tpl.recent.${uid}`,
  mine: `konone.tpl.mine.${uid}`,
  identity: `konone.tpl.identity.${uid}`
});

export function toggleFavoriteId(uid, id) {
  const key = tplKeys(uid).fav;
  const cur = readList(key);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
  writeList(key, next);
  return next;
}

export function pushRecentId(uid, id) {
  const key = tplKeys(uid).recent;
  writeList(key, [id, ...readList(key).filter((x) => x !== id)].slice(0, 12));
}

// Ghi thiết kế của mẫu vào hồ sơ. Không ghi đè nhạc của người dùng nếu mẫu không có nhạc.
export async function applyTemplateToProfile(profileDocId, tpl) {
  const preset = { ...(tpl.preset || {}) };
  if (!preset.musicUrl) delete preset.musicUrl;
  await updateDoc(doc(db, 'profiles', profileDocId), { ...preset, updatedAt: new Date() });
}

// Chuẩn hóa để tìm kiếm không phân biệt hoa thường / dấu / khoảng trắng
export const normalizeSearch = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '');

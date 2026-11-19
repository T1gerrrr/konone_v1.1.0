// POST /api/hit { vid, path } — ghi 1 lượt truy cập trang (không cần đăng nhập).
//
// Quyền riêng tư: KHÔNG lưu IP, user-agent hay thông tin cá nhân. Chỉ lưu:
//   siteStats/{YYYY-MM-DD}      { views, visitors, paths: { home: n, login: n, ... } }
//   siteVisitors/{YYYY-MM-DD}_{vid}  (chỉ để đếm "khách duy nhất" trong ngày; vid là mã ngẫu nhiên do trình duyệt tự sinh)
// Bỏ qua bot/crawler. Đặt tên /api/hit (thay vì "track") để ít bị trình chặn quảng cáo chặn nhầm.
const { FieldValue } = require('firebase-admin/firestore');
const { adminDb } = require('./_lib/common');

const VN_OFFSET_MS = 7 * 3600 * 1000;
const BOT_RE = /bot|crawl|spider|slurp|headless|preview|facebookexternalhit|lighthouse|pingdom|monitor|python-requests|curl|wget/i;
const KNOWN = new Set([
  '/', '/login', '/register', '/verify-email', '/community', '/leaderboard', '/terms', '/privacy', '/copyright',
  '/dashboard', '/edit-profile', '/links', '/premium', '/profile-template', '/edit-layout', '/invite'
]);

function bucket(path) {
  const p = String(path || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (p === '/') return 'home';
  if (KNOWN.has(p)) return p.slice(1).replace(/-/g, '_');
  return 'profile'; // /:username
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (BOT_RE.test(req.headers['user-agent'] || '')) return res.status(204).end();

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (e) {
    return res.status(400).json({ error: 'bad request' });
  }
  const vid = String(body.vid || '');
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(vid)) return res.status(400).json({ error: 'bad vid' });

  const day = new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
  const db = adminDb();

  try {
    // Khách duy nhất trong ngày: tạo được bản ghi mới = lần đầu hôm nay
    let first = false;
    try {
      await db.collection('siteVisitors').doc(`${day}_${vid}`).create({ day, at: new Date() });
      first = true;
    } catch (err) {
      const exists = err.code === 6 || /already exists/i.test(err.message || '');
      if (!exists) throw err;
    }

    await db.collection('siteStats').doc(day).set(
      {
        day,
        views: FieldValue.increment(1),
        ...(first ? { visitors: FieldValue.increment(1) } : {}),
        paths: { [bucket(body.path)]: FieldValue.increment(1) }
      },
      { merge: true }
    );
    return res.status(204).end();
  } catch (err) {
    console.error('hit error:', err);
    return res.status(500).json({ error: 'failed' });
  }
};

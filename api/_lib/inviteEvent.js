// Cấu hình sự kiện mời bạn + tiện ích mã mời, dùng chung cho api/invite.js và api/admin.js.
// Cấu hình thật lưu ở Firestore config/inviteEvent (admin chỉnh trong trang /admin);
// chưa có thì dùng DEFAULT_CONFIG bên dưới.
const crypto = require('crypto');

const TONES = ['coral', 'youtube', 'spotify', 'gold', 'violet'];
const ICONS = ['diamond', 'play', 'wave', 'crown', 'headphones'];

// type 'auto'   : server tự cộng Premium (days ngày) cho hồ sơ
// type 'manual' : ghi nhận slot, admin trao thưởng thủ công (liên hệ qua email)
const DEFAULT_CONFIG = {
  start: '2026-11-20T00:00:00+07:00',
  end: '2026-12-29T23:59:59+07:00',
  milestones: [
    { id: 'm10', need: 10, slots: 5, type: 'auto', days: 30, tone: 'coral', icon: 'diamond', choices: [],
      title: { vi: 'KonOne Premium 30 ngày', en: 'KonOne Premium 30 days' } },
    { id: 'm30', need: 30, slots: 5, type: 'manual', days: 0, tone: 'youtube', icon: 'play', choices: [],
      title: { vi: 'YouTube Premium 30 ngày', en: 'YouTube Premium 30 days' } },
    { id: 'm40', need: 40, slots: 2, type: 'manual', days: 0, tone: 'spotify', icon: 'wave', choices: [],
      title: { vi: 'Spotify Premium 30 ngày', en: 'Spotify Premium 30 days' } },
    { id: 'm100', need: 100, slots: 1, type: 'manual', days: 0, tone: 'gold', icon: 'crown',
      choices: [{ key: 'youtube', label: 'YouTube' }, { key: 'spotify', label: 'Spotify' }],
      title: { vi: 'YouTube hoặc Spotify Premium 360 ngày', en: 'YouTube or Spotify Premium 360 days' } },
    { id: 'm100k', need: 100000, slots: 1, type: 'manual', days: 0, tone: 'violet', icon: 'headphones', choices: [],
      title: { vi: 'AirPods Pro 2', en: 'AirPods Pro 2' } }
  ]
};

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const int = (v, min, max, name) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${name} phải là số nguyên từ ${min} đến ${max}.`);
  return n;
};

// Kiểm tra + làm sạch cấu hình do admin gửi lên (ném Error nếu sai)
function normalizeConfig(input) {
  const start = new Date(input && input.start);
  const end = new Date(input && input.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error('Thời gian sự kiện không hợp lệ.');
  if (end <= start) throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
  const list = Array.isArray(input.milestones) ? input.milestones : [];
  if (list.length < 1 || list.length > 20) throw new Error('Cần từ 1 đến 20 cột mốc.');
  const seen = new Set();
  const milestones = list.map((m, i) => {
    const id = str(m.id, 20);
    if (!/^[a-z0-9_]{1,20}$/.test(id)) throw new Error(`Cột mốc #${i + 1}: mã (id) chỉ gồm a-z, 0-9, _.`);
    if (seen.has(id)) throw new Error(`Trùng mã cột mốc "${id}".`);
    seen.add(id);
    const type = m.type === 'auto' ? 'auto' : 'manual';
    const title = { vi: str(m.title && m.title.vi, 120), en: str(m.title && m.title.en, 120) };
    if (!title.vi) throw new Error(`Cột mốc "${id}": thiếu tên quà (tiếng Việt).`);
    if (!title.en) title.en = title.vi;
    const choices = (Array.isArray(m.choices) ? m.choices : []).slice(0, 4).map((c) => {
      const key = str(c && c.key, 20);
      if (!/^[a-z0-9_]{1,20}$/.test(key)) throw new Error(`Cột mốc "${id}": khóa lựa chọn chỉ gồm a-z, 0-9, _.`);
      return { key, label: str(c.label, 30) || key };
    });
    return {
      id,
      need: int(m.need, 1, 1000000, `Cột mốc "${id}": số người mời`),
      slots: int(m.slots, 1, 100000, `Cột mốc "${id}": số slot`),
      type,
      days: type === 'auto' ? int(m.days, 1, 3650, `Cột mốc "${id}": số ngày Premium`) : 0,
      tone: TONES.includes(m.tone) ? m.tone : 'coral',
      icon: ICONS.includes(m.icon) ? m.icon : 'diamond',
      choices: type === 'auto' ? [] : choices,
      title
    };
  });
  milestones.sort((a, b) => a.need - b.need);
  return { start: start.toISOString(), end: end.toISOString(), milestones };
}

async function loadConfig(db) {
  try {
    const snap = await db.collection('config').doc('inviteEvent').get();
    if (snap.exists && Array.isArray(snap.data().milestones)) return snap.data();
  } catch (e) {
    console.error('loadConfig error:', e);
  }
  return DEFAULT_CONFIG;
}

function eventState(config, now = new Date()) {
  if (now < new Date(config.start)) return 'upcoming';
  if (now > new Date(config.end)) return 'ended';
  return 'active';
}

// ===== Mã mời =====
// Bỏ các ký tự dễ nhầm: 0/O, 1/I
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function normalizeCode(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

function isValidCode(code) {
  return code.length === CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));
}

module.exports = {
  DEFAULT_CONFIG, TONES, ICONS, normalizeConfig, loadConfig, eventState,
  ALPHABET, CODE_LENGTH, randomCode, normalizeCode, isValidCode
};

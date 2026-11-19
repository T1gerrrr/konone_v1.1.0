// Code kích hoạt Premium lưu ở Firestore: premiumCodes/{CODE}
//   { days, maxUses (0 = không giới hạn), usedCount, label, trial, disabled, createdAt }
// Chỉ server (Admin SDK) đọc/ghi — firestore.rules chặn client.

// Các code trước đây viết cứng trong Premium.js, tự chuyển vào database ĐÚNG MỘT LẦN
const LEGACY_CODES = [
  { code: 'PREMIUM2024', days: 30, label: 'Premium 1 Month', maxUses: 0 },
  { code: 'PREMIUM2025', days: 30, label: 'Premium 1 Month', maxUses: 0 },
  { code: 'PREMIUM2026', days: 30, label: 'Premium 1 Month', maxUses: 0 },
  { code: 'PREMIUM2024YEAR', days: 365, label: 'Premium 1 Year', maxUses: 0 },
  { code: 'PREMIUMFOREVER', days: 9999, label: 'Premium Lifetime', maxUses: 0 },
  { code: 'TESTCODE', days: 7, label: 'Test Premium 7 Days', maxUses: 0 },
  { code: 'TIGERKON2025', days: 30, label: 'Premium 1 Month', maxUses: 20 },
  { code: 'KONONE7DAYS', days: 7, label: 'Premium Trial 7 Days', maxUses: 0, trial: true }
];

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

function normalizePremiumCode(raw) {
  return String(raw || '').trim().toUpperCase();
}

function isValidPremiumCode(code) {
  return CODE_RE.test(code);
}

async function ensureSeeded(db) {
  const marker = db.collection('config').doc('premiumCodesSeed');
  if ((await marker.get()).exists) return;
  const batch = db.batch();
  for (const c of LEGACY_CODES) {
    const ref = db.collection('premiumCodes').doc(c.code);
    const snap = await ref.get();
    const old = snap.exists ? snap.data() : {};
    // Giữ số lượt đã dùng cũ (nếu có) để không "hồi" lượt
    batch.set(ref, {
      days: c.days,
      label: c.label,
      maxUses: c.maxUses,
      trial: Boolean(c.trial),
      disabled: false,
      usedCount: old.usedCount || 0,
      createdAt: old.createdAt || new Date(),
      migrated: true
    }, { merge: true });
  }
  batch.set(marker, { done: true, at: new Date() });
  await batch.commit();
}

module.exports = { LEGACY_CODES, normalizePremiumCode, isValidPremiumCode, ensureSeeded };

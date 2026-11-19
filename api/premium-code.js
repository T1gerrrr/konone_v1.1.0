// POST /api/premium-code { code } — Kích hoạt Premium bằng code (lưu trong database).
// Header: Authorization: Bearer <ID token>
//
// Kiểm tra: code tồn tại & còn bật, còn lượt, tài khoản chưa dùng code này, có hồ sơ thật;
// code dùng thử (trial) mỗi tài khoản chỉ 1 lần. Mọi thứ nằm trong một giao dịch.
const { FieldValue } = require('firebase-admin/firestore');
const { adminDb, requireUser } = require('./_lib/common');
const { normalizePremiumCode, isValidPremiumCode, ensureSeeded } = require('./_lib/premiumCodes');

const fail = (res, status, error, code) => res.status(status).json({ error, code });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'Method not allowed');
  }

  let decoded;
  try {
    decoded = await requireUser(req);
  } catch (err) {
    return fail(res, 401, 'Phiên đăng nhập không hợp lệ.', 'auth/invalid-token');
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (e) {
    return fail(res, 400, 'Dữ liệu không hợp lệ.', 'premium/bad-request');
  }

  const code = normalizePremiumCode(body.code);
  if (!isValidPremiumCode(code)) return fail(res, 400, 'Code không hợp lệ.', 'premium/invalid');

  const uid = decoded.uid;
  const db = adminDb();

  try {
    await ensureSeeded(db);

    const codeRef = db.collection('premiumCodes').doc(code);
    const redemptionRef = db.collection('premiumRedemptions').doc(`${code}_${uid}`);
    const profileQuery = db.collection('profiles').where('userId', '==', uid);

    const result = await db.runTransaction(async (tx) => {
      const [codeSnap, redemptionSnap, profileSnap] = await Promise.all([
        tx.get(codeRef), tx.get(redemptionRef), tx.get(profileQuery)
      ]);
      if (!codeSnap.exists || !codeSnap.data().days) return { status: 404, error: 'Code không hợp lệ.', code: 'premium/invalid' };
      const c = codeSnap.data();
      if (c.disabled) return { status: 403, error: 'Code này đã bị vô hiệu hóa.', code: 'premium/disabled' };

      const profileDoc = profileSnap.docs.find((d) => !d.data().isStub);
      if (!profileDoc) return { status: 400, error: 'Bạn cần tạo hồ sơ trước khi kích hoạt Premium.', code: 'premium/profile-required' };
      const profile = profileDoc.data();

      if (redemptionSnap.exists) return { status: 409, error: 'Tài khoản này đã dùng code này rồi.', code: 'premium/already-used' };
      if (c.trial && profile.premiumTrialUsedAt) return { status: 409, error: 'Tài khoản này đã dùng thử Premium rồi.', code: 'premium/trial-used' };
      const used = c.usedCount || 0;
      if (c.maxUses && used >= c.maxUses) return { status: 409, error: `Code đã hết lượt sử dụng (${used}/${c.maxUses}).`, code: 'premium/exhausted' };

      // Cộng dồn nếu đang còn hạn
      const cur = profile.premiumExpiresAt;
      const curDate = cur && typeof cur.toDate === 'function' ? cur.toDate() : cur ? new Date(cur) : null;
      const base = profile.isPremium && curDate && curDate > new Date() ? curDate : new Date();
      const expiresAt = new Date(base.getTime() + c.days * 86400000);

      tx.update(profileDoc.ref, {
        isPremium: true,
        premiumExpiresAt: expiresAt,
        premiumActivatedAt: new Date(),
        premiumCode: code,
        ...(c.trial ? { premiumTrialUsedAt: new Date() } : {}),
        updatedAt: new Date()
      });
      tx.update(codeRef, { usedCount: FieldValue.increment(1), lastUsedAt: new Date() });
      tx.set(redemptionRef, { code, uid, days: c.days, redeemedAt: new Date() });
      return { ok: true, days: c.days, expiresAt: expiresAt.toISOString() };
    });

    if (result.error) return fail(res, result.status, result.error, result.code);
    return res.status(200).json({ ok: true, days: result.days, expiresAt: result.expiresAt });
  } catch (err) {
    console.error('premium-code error:', err);
    return fail(res, 500, 'Có lỗi xảy ra. Vui lòng thử lại.', 'premium/failed');
  }
};

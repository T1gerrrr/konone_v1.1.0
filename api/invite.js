// POST /api/invite — Mã mời của người dùng.
//
// Header: Authorization: Bearer <ID token>
// Body:
//   { action: "get" }                  -> trả mã mời của tôi (tạo nếu chưa có), số lượt dùng, mã tôi đã nhập
//   { action: "redeem", code: "ABC.." } -> nhập mã mời của người khác (mỗi tài khoản chỉ nhập 1 lần, không nhập mã của mình)
//
// Collection (chỉ server ghi, client bị chặn mặc định bởi firestore.rules):
//   inviteCodes/{CODE}        { uid, uses, createdAt }
//   inviteRedemptions/{uid}   { code, inviterUid, redeemedAt }
// Đồng bộ sang hồ sơ (profiles) để xem trực tiếp trong database:
//   inviteCode (mã của tôi), inviteCount (số lần có người nhập mã của tôi), invitedByCode (mã tôi đã nhập)
const { FieldValue } = require('firebase-admin/firestore');
const { adminAuth, adminDb, requireUser } = require('./_lib/common');
const { loadConfig, eventState, CODE_LENGTH, randomCode, normalizeCode: normalize, isValidCode } = require('./_lib/inviteEvent');

async function getOrCreateOwnCode(db, uid) {
  const existing = await db.collection('inviteCodes').where('uid', '==', uid).limit(1).get();
  if (!existing.empty) {
    const d = existing.docs[0];
    return { code: d.id, uses: d.data().uses || 0 };
  }
  // Thử vài lần phòng trùng mã
  for (let i = 0; i < 6; i++) {
    const code = randomCode();
    const ref = db.collection('inviteCodes').doc(code);
    try {
      await ref.create({ uid, uses: 0, createdAt: new Date() });
      return { code, uses: 0 };
    } catch (err) {
      if (err.code !== 6 && !/already exists/i.test(err.message || '')) throw err; // 6 = ALREADY_EXISTS
    }
  }
  throw new Error('Không tạo được mã mời');
}

// Ghi các cột mã mời lên hồ sơ của người dùng (nếu đã có hồ sơ)
async function syncProfile(db, uid, fields) {
  const snap = await db.collection('profiles').where('userId', '==', uid).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, fields));
  await batch.commit();
}

// Hồ sơ public = có username và không bị ẩn
async function hasPublicProfile(db, uid) {
  const snap = await db.collection('profiles').where('userId', '==', uid).get();
  return snap.docs.some((d) => {
    const data = d.data();
    return Boolean(data.username) && !data.isHidden;
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let decoded;
  try {
    decoded = await requireUser(req);
  } catch (err) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.', code: 'auth/invalid-token' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (e) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ.', code: 'invite/bad-request' });
  }

  const uid = decoded.uid;
  const db = adminDb();

  try {
    // Phải có hồ sơ public mới được dùng mã mời (cả lấy mã lẫn nhập mã)
    if (!(await hasPublicProfile(db, uid))) {
      return res.status(403).json({ error: 'Bạn cần tạo hồ sơ public trước khi dùng mã mời.', code: 'invite/profile-required' });
    }

    const config = await loadConfig(db);
    const MILESTONES = config.milestones;

    if (body.action === 'redeem') {
      if (eventState(config) !== 'active') {
        return res.status(403).json({ error: 'Sự kiện mời bạn hiện không diễn ra.', code: 'invite/event-closed' });
      }
      const code = normalize(body.code);
      if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Mã mời không hợp lệ.', code: 'invite/invalid' });
      }

      // Chỉ tài khoản đã xác minh email mới được nhập mã (chống tạo tài khoản ảo để tăng lượt)
      if (!decoded.email_verified) {
        return res.status(403).json({ error: 'Vui lòng xác minh email trước khi nhập mã mời.', code: 'invite/email-not-verified' });
      }

      const codeRef = db.collection('inviteCodes').doc(code);
      const redemptionRef = db.collection('inviteRedemptions').doc(uid);

      const result = await db.runTransaction(async (tx) => {
        const [codeSnap, redeemedSnap] = await Promise.all([tx.get(codeRef), tx.get(redemptionRef)]);
        if (redeemedSnap.exists) return { error: 'Bạn đã nhập mã mời rồi.', code: 'invite/already-redeemed', status: 409 };
        if (!codeSnap.exists) return { error: 'Mã mời không tồn tại.', code: 'invite/not-found', status: 404 };
        const inviterUid = codeSnap.data().uid || null; // null = mã do admin tạo (không có người mời)
        const maxUses = codeSnap.data().maxUses || 0;
        if (maxUses && (codeSnap.data().uses || 0) >= maxUses) return { error: 'Mã này đã hết lượt dùng.', code: 'invite/code-exhausted', status: 409 };
        if (inviterUid && inviterUid === uid) return { error: 'Bạn không thể nhập mã của chính mình.', code: 'invite/own-code', status: 400 };

        // Người mời (nếu có) phải còn tồn tại
        if (inviterUid) {
          try {
            await adminAuth().getUser(inviterUid);
          } catch (e) {
            return { error: 'Mã mời không còn hiệu lực.', code: 'invite/not-found', status: 404 };
          }
        }

        // Mọi điều kiện hợp lệ -> mới ghi và cộng lượt (increment nguyên tử, không tăng 2 lần nhờ bản ghi theo uid)
        tx.set(redemptionRef, { code, inviterUid, redeemedAt: new Date() });
        tx.update(codeRef, { uses: FieldValue.increment(1) });
        return { ok: true, inviterUid, uses: (codeSnap.data().uses || 0) + 1 };
      });

      if (result.error) return res.status(result.status).json({ error: result.error, code: result.code });

      // Đồng bộ cột trên hồ sơ (không làm hỏng kết quả nếu lỗi)
      await Promise.all([
        result.inviterUid ? syncProfile(db, result.inviterUid, { inviteCount: result.uses }) : Promise.resolve(),
        syncProfile(db, uid, { invitedByCode: code })
      ]).catch((e) => console.error('invite sync error:', e));

      return res.status(200).json({ ok: true, redeemedCode: code });
    }

    if (body.action === 'claim') {
      if (eventState(config) !== 'active') {
        return res.status(403).json({ error: 'Sự kiện mời bạn hiện không diễn ra.', code: 'invite/event-closed' });
      }
      const milestone = MILESTONES.find((m) => m.id === body.milestoneId);
      if (!milestone) return res.status(400).json({ error: 'Cột mốc không hợp lệ.', code: 'invite/bad-milestone' });
      const keys = milestone.choices.map((c) => c.key);
      const choice = keys.length > 1 ? String(body.choice || '') : keys[0] || null;
      if (keys.length && !keys.includes(choice)) {
        return res.status(400).json({ error: 'Vui lòng chọn phần quà.', code: 'invite/choice-required' });
      }
      if (!decoded.email_verified) {
        return res.status(403).json({ error: 'Vui lòng xác minh email trước khi nhận quà.', code: 'invite/email-not-verified' });
      }

      const claimRef = db.collection('inviteClaims').doc(`${uid}_${milestone.id}`);
      const statRef = db.collection('inviteRewardStats').doc(milestone.id);
      const codeQuery = db.collection('inviteCodes').where('uid', '==', uid).limit(1);
      const profileQuery = db.collection('profiles').where('userId', '==', uid);

      const result = await db.runTransaction(async (tx) => {
        const [claimSnap, statSnap, codeSnap, profileSnap] = await Promise.all([
          tx.get(claimRef), tx.get(statRef), tx.get(codeQuery), tx.get(profileQuery)
        ]);
        if (claimSnap.exists) return { error: 'Bạn đã nhận phần quà này rồi.', code: 'invite/already-claimed', status: 409 };
        const uses = codeSnap.empty ? 0 : codeSnap.docs[0].data().uses || 0;
        if (uses < milestone.need) {
          return { error: 'Bạn chưa đạt cột mốc này.', code: 'invite/not-reached', status: 400 };
        }
        const claimed = statSnap.exists ? statSnap.data().claimed || 0 : 0;
        if (claimed >= milestone.slots) return { error: 'Phần quà này đã hết slot.', code: 'invite/sold-out', status: 409 };

        // Mọi điều kiện hợp lệ -> giữ slot
        tx.set(statRef, { claimed: claimed + 1 }, { merge: true });
        tx.set(claimRef, {
          uid, milestoneId: milestone.id, choice, reward: milestone.title.vi,
          email: decoded.email || null, status: milestone.type === 'auto' ? 'granted' : 'pending',
          usesAtClaim: uses, claimedAt: new Date()
        });
        if (milestone.type === 'auto' && !profileSnap.empty) {
          const ref = profileSnap.docs[0].ref;
          const cur = profileSnap.docs[0].data().premiumExpiresAt;
          const curDate = cur && typeof cur.toDate === 'function' ? cur.toDate() : cur ? new Date(cur) : null;
          const base = curDate && curDate > new Date() ? curDate : new Date();
          tx.update(ref, { isPremium: true, premiumExpiresAt: new Date(base.getTime() + milestone.days * 86400000) });
        }
        return { ok: true, status: milestone.type === 'auto' ? 'granted' : 'pending' };
      });

      if (result.error) return res.status(result.status).json({ error: result.error, code: result.code });
      return res.status(200).json({ ok: true, milestoneId: milestone.id, status: result.status });
    }

    // Mặc định: lấy thông tin mã mời của tôi
    const own = await getOrCreateOwnCode(db, uid);
    const redeemed = await db.collection('inviteRedemptions').doc(uid).get();
    await syncProfile(db, uid, {
      inviteCode: own.code,
      inviteCount: own.uses,
      ...(redeemed.exists ? { invitedByCode: redeemed.data().code } : {})
    }).catch((e) => console.error('invite sync error:', e));
    const [stats, mine] = await Promise.all([
      db.getAll(...MILESTONES.map((m) => db.collection('inviteRewardStats').doc(m.id))),
      db.getAll(...MILESTONES.map((m) => db.collection('inviteClaims').doc(`${uid}_${m.id}`)))
    ]);
    const claimed = {};
    const myClaims = {};
    MILESTONES.forEach((m, i) => {
      claimed[m.id] = stats[i].exists ? stats[i].data().claimed || 0 : 0;
      if (mine[i].exists) myClaims[m.id] = { status: mine[i].data().status, choice: mine[i].data().choice };
    });
    return res.status(200).json({
      code: own.code,
      uses: own.uses,
      redeemedCode: redeemed.exists ? redeemed.data().code : null,
      event: { state: eventState(config), start: config.start, end: config.end },
      milestones: MILESTONES,
      claimed,
      myClaims
    });
  } catch (err) {
    console.error('invite error:', err);
    return res.status(500).json({ error: 'Có lỗi xảy ra. Vui lòng thử lại.', code: 'invite/failed' });
  }
};

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
const crypto = require('crypto');
const { FieldValue } = require('firebase-admin/firestore');
const { adminAuth, adminDb, requireUser } = require('./_lib/common');

// Bỏ các ký tự dễ nhầm: 0/O, 1/I
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function normalize(raw) {
  return String(raw || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

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

    if (body.action === 'redeem') {
      const code = normalize(body.code);
      if (code.length !== CODE_LENGTH || ![...code].every((c) => ALPHABET.includes(c))) {
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
        const inviterUid = codeSnap.data().uid;
        if (inviterUid === uid) return { error: 'Bạn không thể nhập mã của chính mình.', code: 'invite/own-code', status: 400 };

        // Người mời phải còn tồn tại
        try {
          await adminAuth().getUser(inviterUid);
        } catch (e) {
          return { error: 'Mã mời không còn hiệu lực.', code: 'invite/not-found', status: 404 };
        }

        // Mọi điều kiện hợp lệ -> mới ghi và cộng lượt (increment nguyên tử, không tăng 2 lần nhờ bản ghi theo uid)
        tx.set(redemptionRef, { code, inviterUid, redeemedAt: new Date() });
        tx.update(codeRef, { uses: FieldValue.increment(1) });
        return { ok: true, inviterUid, uses: (codeSnap.data().uses || 0) + 1 };
      });

      if (result.error) return res.status(result.status).json({ error: result.error, code: result.code });

      // Đồng bộ cột trên hồ sơ (không làm hỏng kết quả nếu lỗi)
      await Promise.all([
        syncProfile(db, result.inviterUid, { inviteCount: result.uses }),
        syncProfile(db, uid, { invitedByCode: code })
      ]).catch((e) => console.error('invite sync error:', e));

      return res.status(200).json({ ok: true, redeemedCode: code });
    }

    // Mặc định: lấy thông tin mã mời của tôi
    const own = await getOrCreateOwnCode(db, uid);
    const redeemed = await db.collection('inviteRedemptions').doc(uid).get();
    await syncProfile(db, uid, {
      inviteCode: own.code,
      inviteCount: own.uses,
      ...(redeemed.exists ? { invitedByCode: redeemed.data().code } : {})
    }).catch((e) => console.error('invite sync error:', e));
    return res.status(200).json({
      code: own.code,
      uses: own.uses,
      redeemedCode: redeemed.exists ? redeemed.data().code : null
    });
  } catch (err) {
    console.error('invite error:', err);
    return res.status(500).json({ error: 'Có lỗi xảy ra. Vui lòng thử lại.', code: 'invite/failed' });
  }
};

// Kiểm tra mã OTP; nếu đúng thì đánh dấu emailVerified = true cho user.
const crypto = require('crypto');
const { adminAuth, adminDb, requireUser } = require('./_lib/common');

const MAX_ATTEMPTS = 5;

function hashOtp(uid, code) {
  return crypto.createHash('sha256').update(`${uid}:${code}`).digest('hex');
}

function fail(status, code, error) {
  const e = new Error(error);
  e.status = status;
  e.otpCode = code;
  return e;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { uid } = await requireUser(req);
    const code = String((req.body && req.body.code) || '').trim();
    if (!/^\d{6}$/.test(code)) throw fail(400, 'otp/invalid-format', 'Mã phải gồm 6 chữ số');

    const db = adminDb();
    const ref = db.collection('emailOtps').doc(uid);

    // Transaction để chống gửi nhiều request song song nhằm dò mã
    // Lưu ý: throw trong transaction sẽ hủy mọi thao tác ghi, nên trả về kết quả rồi throw bên ngoài
    const failure = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return fail(400, 'otp/not-found', 'Chưa có mã nào. Hãy gửi mã mới');
      const data = snap.data();

      if (Date.now() > data.expiresAt) {
        tx.delete(ref);
        return fail(400, 'otp/expired', 'Mã đã hết hạn. Hãy gửi mã mới');
      }
      if (data.attempts >= MAX_ATTEMPTS) {
        tx.delete(ref);
        return fail(429, 'otp/too-many-attempts', 'Nhập sai quá nhiều lần. Hãy gửi mã mới');
      }

      const a = Buffer.from(hashOtp(uid, code));
      const b = Buffer.from(data.hash);
      const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      if (!ok) {
        tx.update(ref, { attempts: data.attempts + 1 });
        const left = MAX_ATTEMPTS - data.attempts - 1;
        return fail(400, 'otp/wrong-code', `Mã không đúng. Còn ${left} lần thử`);
      }
      tx.delete(ref);
      return null;
    });
    if (failure) throw failure;

    await adminAuth().updateUser(uid, { emailVerified: true });
    return res.status(200).json({ ok: true });
  } catch (err) {
    if (!err.otpCode) console.error('verify-otp error:', err);
    return res.status(err.status || 500).json({ error: err.message, code: err.otpCode || err.code });
  }
};

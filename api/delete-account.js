// POST /api/delete-account — Xóa vĩnh viễn tài khoản và dữ liệu cá nhân của chính người gọi.
// Thực hiện quyền xóa dữ liệu của chủ thể dữ liệu (Nghị định 13/2023/NĐ-CP, Điều 9 và Điều 16).
//
// Yêu cầu:
//  - Header Authorization: Bearer <ID token> của người dùng.
//  - Người dùng vừa xác thực lại (đăng nhập lại) trong 10 phút gần nhất.
//  - Body: { confirm: "XOA TAI KHOAN" }.
//
// Dữ liệu bị xóa: mọi hồ sơ (profiles) của người dùng, mã OTP (emailOtps/{uid}),
// users/{uid} (nếu có) và tài khoản đăng nhập Firebase Auth.
// Chỉ giữ một bản ghi nhật ký tối thiểu (mã băm UID + thời điểm, không có dữ liệu cá nhân)
// để chứng minh yêu cầu xóa đã được thực hiện.
const crypto = require('crypto');
const { adminAuth, adminDb, requireUser } = require('./_lib/common');

const RECENT_LOGIN_SECONDS = 10 * 60;
const CONFIRM_TEXT = 'XOA TAI KHOAN';

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

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (String(body.confirm || '').trim().toUpperCase() !== CONFIRM_TEXT) {
    return res.status(400).json({ error: 'Thiếu xác nhận xóa tài khoản.', code: 'delete/confirm-required' });
  }

  // Bắt buộc đăng nhập lại gần đây để tránh người khác dùng phiên đang mở để xóa
  const nowSec = Math.floor(Date.now() / 1000);
  if (!decoded.auth_time || nowSec - decoded.auth_time > RECENT_LOGIN_SECONDS) {
    return res.status(401).json({
      error: 'Vui lòng xác thực lại trước khi xóa tài khoản.',
      code: 'auth/requires-recent-login'
    });
  }

  const uid = decoded.uid;
  const db = adminDb();

  try {
    // 1) Xóa hồ sơ
    const snap = await db.collection('profiles').where('userId', '==', uid).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.collection('emailOtps').doc(uid));
    batch.delete(db.collection('users').doc(uid));
    // Mã mời của người dùng + bản ghi nhập mã
    const inviteSnap = await db.collection('inviteCodes').where('uid', '==', uid).get();
    inviteSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.collection('inviteRedemptions').doc(uid));
    await batch.commit();

    // 2) Nhật ký tối thiểu, không chứa dữ liệu cá nhân
    const uidHash = crypto.createHash('sha256').update(uid).digest('hex');
    await db.collection('deletionLogs').add({
      uidHash,
      profilesDeleted: snap.size,
      requestedAt: new Date(),
      completedAt: new Date(),
      legalBasis: 'ND 13/2023/ND-CP - quyen xoa du lieu'
    });

    // 3) Xóa tài khoản đăng nhập
    await adminAuth().deleteUser(uid);

    return res.status(200).json({ ok: true, profilesDeleted: snap.size });
  } catch (err) {
    console.error('delete-account error:', err);
    return res.status(500).json({ error: 'Không xóa được tài khoản. Vui lòng thử lại.', code: 'delete/failed' });
  }
};

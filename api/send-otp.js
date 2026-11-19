// Gửi mã OTP 6 số xác thực email qua Gmail SMTP.
// Env: GMAIL_USER, GMAIL_APP_PASSWORD, FIREBASE_SERVICE_ACCOUNT
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { adminAuth, adminDb, requireUser } = require('./_lib/common');

const OTP_TTL_MS = 10 * 60 * 1000; // mã có hạn 10 phút
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 giây mới được gửi lại

function hashOtp(uid, code) {
  return crypto.createHash('sha256').update(`${uid}:${code}`).digest('hex');
}

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

function buildHtml(code) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
    <h2 style="margin:0 0 16px">Mã xác thực KonOne</h2>
    <p>Nhập mã dưới đây để xác thực email của bạn:</p>
    <p style="font-size:34px;font-weight:bold;letter-spacing:10px;margin:24px 0;text-align:center">${code}</p>
    <p style="font-size:13px;color:#666">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.<br>
    Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
  </div>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const decoded = await requireUser(req);
    const { uid, email } = decoded;
    if (!email) return res.status(400).json({ error: 'User has no email' });
    if (decoded.email_verified) return res.status(200).json({ ok: true, alreadyVerified: true });

    const ref = adminDb().collection('emailOtps').doc(uid);
    const snap = await ref.get();
    const now = Date.now();
    if (snap.exists) {
      const wait = snap.data().lastSentAt + RESEND_COOLDOWN_MS - now;
      if (wait > 0) {
        return res.status(429).json({
          error: `Vui lòng đợi ${Math.ceil(wait / 1000)} giây trước khi gửi lại mã`,
          code: 'otp/cooldown',
          retryAfter: Math.ceil(wait / 1000),
        });
      }
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    await ref.set({
      hash: hashOtp(uid, code),
      email,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      lastSentAt: now,
    });

    await getTransporter().sendMail({
      from: `"KonOne" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `${code} là mã xác thực KonOne của bạn`,
      text: `Mã xác thực KonOne của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`,
      html: buildHtml(code),
    });

    return res.status(200).json({ ok: true, cooldown: RESEND_COOLDOWN_MS / 1000 });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
};

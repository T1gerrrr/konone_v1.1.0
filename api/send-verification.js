// Vercel Serverless Function: gửi email xác thực qua Gmail SMTP.
// Env cần thiết (Vercel > Settings > Environment Variables):
//   GMAIL_USER                 - địa chỉ Gmail dùng để gửi
//   GMAIL_APP_PASSWORD         - App Password 16 ký tự của Gmail (không phải mật khẩu thường)
//   FIREBASE_SERVICE_ACCOUNT   - nội dung JSON service account (Firebase Console > Project settings > Service accounts)
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  }
  return admin;
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

function buildHtml(link) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">
    <h2 style="margin:0 0 16px">Xác thực email - KonOne</h2>
    <p>Cảm ơn bạn đã đăng ký. Nhấn nút bên dưới để xác thực địa chỉ email của bạn:</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Xác thực email</a>
    </p>
    <p style="font-size:13px;color:#666">Nếu nút không hoạt động, hãy dán liên kết này vào trình duyệt:<br>
      <a href="${link}" style="word-break:break-all">${link}</a></p>
    <p style="font-size:13px;color:#666">Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email.</p>
  </div>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const header = req.headers.authorization || '';
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: 'Missing token' });

    // Chỉ gửi cho chính user đang đăng nhập (email lấy từ token, không tin client)
    const decoded = await getAdmin().auth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) return res.status(400).json({ error: 'User has no email' });
    if (decoded.email_verified) return res.status(200).json({ ok: true, alreadyVerified: true });

    const continueUrl = (req.body && req.body.url) || undefined;
    const link = await getAdmin()
      .auth()
      .generateEmailVerificationLink(email, continueUrl ? { url: continueUrl } : undefined);

    await getTransporter().sendMail({
      from: `"KonOne" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Xác thực email tài khoản KonOne',
      text: `Xác thực email của bạn tại liên kết sau: ${link}`,
      html: buildHtml(link),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-verification error:', err);
    const code = err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error' ? 401 : 500;
    return res.status(code).json({ error: err.message, code: err.code });
  }
};

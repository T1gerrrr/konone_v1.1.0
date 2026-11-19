// Helper dùng chung cho các hàm /api (thư mục _lib không được Vercel coi là endpoint)
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

function parseServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('Thiếu biến môi trường FIREBASE_SERVICE_ACCOUNT');
  raw = raw.trim();
  // Phòng trường hợp bị dán kèm dấu nháy bao quanh
  if (raw.startsWith("'") || raw.startsWith('"')) {
    try { raw = JSON.parse(raw); } catch (e) { raw = raw.slice(1, -1); }
  }
  const sa = typeof raw === 'string' ? JSON.parse(raw) : raw;
  // Phòng trường hợp xuống dòng trong private_key bị biến thành "\\n" hoặc mất
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

function getApp() {
  if (!getApps().length) {
    initializeApp({ credential: cert(parseServiceAccount()) });
  }
  return getApps()[0];
}

function adminAuth() {
  return getAuth(getApp());
}

function adminDb() {
  return getFirestore(getApp());
}

// Xác thực ID token trong header Authorization: Bearer <token>
async function requireUser(req) {
  const header = req.headers.authorization || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!idToken) {
    const e = new Error('Missing token');
    e.status = 401;
    throw e;
  }
  try {
    return await adminAuth().verifyIdToken(idToken);
  } catch (err) {
    err.status = 401;
    throw err;
  }
}

module.exports = { adminAuth, adminDb, requireUser };

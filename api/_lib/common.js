// Helper dùng chung cho các hàm /api (thư mục _lib không được Vercel coi là endpoint)
const admin = require('firebase-admin');

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  }
  return admin;
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
    return await getAdmin().auth().verifyIdToken(idToken);
  } catch (err) {
    err.status = 401;
    throw err;
  }
}

module.exports = { getAdmin, requireUser };

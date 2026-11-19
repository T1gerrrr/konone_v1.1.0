// POST /api/admin — API quản trị. CHỈ tài khoản trong biến môi trường ADMIN_EMAILS (email đã xác minh) mới dùng được.
//
// Header: Authorization: Bearer <ID token>
// Body: { action, ... }
//   whoami                      -> { admin: boolean } (không lỗi với người thường)
//   stats                       -> số liệu tổng + chuỗi theo ngày (đăng ký, tạo hồ sơ, lượt xem)
//   users                       -> danh sách tài khoản + tóm tắt hồ sơ
//   userDetail { uid }          -> đầy đủ thông tin 1 tài khoản (Auth + hồ sơ + mã mời + quà)
//   deleteProfile { profileId } -> xóa 1 hồ sơ
//   deleteUser { uid }          -> xóa toàn bộ dữ liệu + tài khoản
//   resetLink { email }         -> tạo link đặt lại mật khẩu (thay cho việc xem mật khẩu)
//   codes / createCode { code?, label?, maxUses? } / deleteCode { code }
//   getConfig / saveConfig { config }
//   claims / setClaimStatus { id, status }
//
// Lưu ý: Firebase KHÔNG lưu mật khẩu gốc (chỉ lưu bản băm một chiều) nên không thể "giải mã" hay hiển thị mật khẩu.
const { adminAuth, adminDb, requireUser } = require('./_lib/common');
const { normalizePremiumCode, isValidPremiumCode, ensureSeeded } = require('./_lib/premiumCodes');
const {
  DEFAULT_CONFIG, normalizeConfig, loadConfig, randomCode, normalizeCode, isValidCode
} = require('./_lib/inviteEvent');

const VN_OFFSET_MS = 7 * 3600 * 1000;

function adminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdmin(decoded) {
  return Boolean(decoded.email && decoded.email_verified && adminEmails().includes(decoded.email.toLowerCase()));
}

// Chuyển Timestamp / Date / object lồng nhau thành dữ liệu JSON thường
function plain(v) {
  if (v == null) return v;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(plain);
  if (typeof v === 'object') {
    const out = {};
    Object.keys(v).forEach((k) => { out[k] = plain(v[k]); });
    return out;
  }
  return v;
}

function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Khóa ngày YYYY-MM-DD theo giờ Việt Nam
function dayKey(d) {
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

async function listAllUsers() {
  const auth = adminAuth();
  const out = [];
  let token;
  for (let i = 0; i < 10; i++) {
    const page = await auth.listUsers(1000, token);
    out.push(...page.users);
    token = page.pageToken;
    if (!token) break;
  }
  return out;
}

function summarizeUser(u, profiles, inviteByUid) {
  const mine = profiles.filter((p) => p.userId === u.uid);
  const main = mine[0] || null;
  return {
    uid: u.uid,
    email: u.email || '',
    emailVerified: u.emailVerified,
    disabled: u.disabled,
    providers: (u.providerData || []).map((p) => p.providerId),
    createdAt: u.metadata.creationTime || null,
    lastSignIn: u.metadata.lastSignInTime || null,
    profile: main && {
      id: main.id,
      username: main.username || '',
      displayName: main.displayName || '',
      avatar: main.avatar || '',
      viewCount: main.viewCount || 0,
      isPremium: Boolean(main.isPremium),
      premiumExpiresAt: plain(main.premiumExpiresAt) || null,
      isHidden: Boolean(main.isHidden)
    },
    profileCount: mine.length,
    inviteCode: (inviteByUid[u.uid] && inviteByUid[u.uid].code) || '',
    inviteUses: (inviteByUid[u.uid] && inviteByUid[u.uid].uses) || 0,
    isAdmin: Boolean(u.email && adminEmails().includes(u.email.toLowerCase()))
  };
}

async function loadProfiles(db) {
  const snap = await db.collection('profiles').limit(5000).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadInviteCodes(db) {
  const snap = await db.collection('inviteCodes').limit(5000).get();
  return snap.docs.map((d) => ({ code: d.id, ...d.data() }));
}

async function wipeUserData(db, uid) {
  const [profiles, codes] = await Promise.all([
    db.collection('profiles').where('userId', '==', uid).get(),
    db.collection('inviteCodes').where('uid', '==', uid).get()
  ]);
  const batch = db.batch();
  profiles.docs.forEach((d) => batch.delete(d.ref));
  codes.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection('emailOtps').doc(uid));
  batch.delete(db.collection('users').doc(uid));
  batch.delete(db.collection('inviteRedemptions').doc(uid));
  await batch.commit();
  return profiles.size;
}

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
    return fail(res, 400, 'Dữ liệu không hợp lệ.', 'admin/bad-request');
  }

  if (body.action === 'whoami') {
    const ok = isAdmin(decoded);
    let reason = null;
    if (!ok) {
      if (!adminEmails().length) reason = 'no-env'; // chưa cấu hình ADMIN_EMAILS (hoặc chưa deploy lại sau khi thêm)
      else if (!decoded.email_verified) reason = 'email-not-verified';
      else reason = 'not-listed';
    }
    return res.status(200).json({ admin: ok, reason, email: decoded.email || null });
  }
  if (!isAdmin(decoded)) return fail(res, 403, 'Không có quyền quản trị.', 'admin/forbidden');

  const db = adminDb();

  try {
    switch (body.action) {
      case 'stats': {
        const [users, profiles, redemptions] = await Promise.all([
          listAllUsers(),
          loadProfiles(db),
          db.collection('inviteRedemptions').count().get()
        ]);
        const signups = {};
        users.forEach((u) => {
          const d = toDate(u.metadata.creationTime);
          if (d) signups[dayKey(d)] = (signups[dayKey(d)] || 0) + 1;
        });
        const created = {};
        const views = {};
        let totalViews = 0;
        let premium = 0;
        let publicProfiles = 0;
        const now = new Date();
        profiles.forEach((p) => {
          const d = toDate(p.createdAt);
          if (d) created[dayKey(d)] = (created[dayKey(d)] || 0) + 1;
          Object.entries(p.viewsByDay || {}).forEach(([k, v]) => { views[k] = (views[k] || 0) + (Number(v) || 0); });
          totalViews += Number(p.viewCount) || 0;
          const until = toDate(p.premiumExpiresAt);
          if (p.isPremium && until && until > now) premium += 1;
          if (p.username && !p.isHidden) publicProfiles += 1;
        });
        return res.status(200).json({
          totals: {
            users: users.length,
            verified: users.filter((u) => u.emailVerified).length,
            profiles: profiles.length,
            publicProfiles,
            premium,
            totalViews,
            invitesRedeemed: redemptions.data().count
          },
          series: { signups, profiles: created, views }
        });
      }

      case 'users': {
        const [users, profiles, codes] = await Promise.all([listAllUsers(), loadProfiles(db), loadInviteCodes(db)]);
        const inviteByUid = {};
        codes.forEach((c) => { if (c.uid) inviteByUid[c.uid] = { code: c.code, uses: c.uses || 0 }; });
        const rows = users.map((u) => summarizeUser(u, profiles, inviteByUid));
        rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return res.status(200).json({ users: rows });
      }

      case 'userDetail': {
        const uid = String(body.uid || '');
        if (!uid) return fail(res, 400, 'Thiếu uid.', 'admin/bad-request');
        const user = await adminAuth().getUser(uid);
        const [profiles, codes, redemption, claims] = await Promise.all([
          db.collection('profiles').where('userId', '==', uid).get(),
          db.collection('inviteCodes').where('uid', '==', uid).get(),
          db.collection('inviteRedemptions').doc(uid).get(),
          db.collection('inviteClaims').where('uid', '==', uid).get()
        ]);
        return res.status(200).json({
          auth: {
            uid: user.uid,
            email: user.email || null,
            emailVerified: user.emailVerified,
            displayName: user.displayName || null,
            phoneNumber: user.phoneNumber || null,
            photoURL: user.photoURL || null,
            disabled: user.disabled,
            providers: (user.providerData || []).map((p) => ({ providerId: p.providerId, email: p.email || null })),
            hasPassword: (user.providerData || []).some((p) => p.providerId === 'password'),
            createdAt: user.metadata.creationTime || null,
            lastSignIn: user.metadata.lastSignInTime || null
          },
          profiles: profiles.docs.map((d) => ({ id: d.id, ...plain(d.data()) })),
          inviteCodes: codes.docs.map((d) => ({ code: d.id, ...plain(d.data()) })),
          redeemed: redemption.exists ? plain(redemption.data()) : null,
          claims: claims.docs.map((d) => ({ id: d.id, ...plain(d.data()) }))
        });
      }

      case 'deleteProfile': {
        const profileId = String(body.profileId || '');
        if (!profileId) return fail(res, 400, 'Thiếu profileId.', 'admin/bad-request');
        const ref = db.collection('profiles').doc(profileId);
        const snap = await ref.get();
        if (!snap.exists) return fail(res, 404, 'Không tìm thấy hồ sơ.', 'admin/not-found');
        await ref.delete();
        return res.status(200).json({ ok: true });
      }

      case 'deleteUser': {
        const uid = String(body.uid || '');
        if (!uid) return fail(res, 400, 'Thiếu uid.', 'admin/bad-request');
        if (uid === decoded.uid) return fail(res, 400, 'Không thể tự xóa tài khoản quản trị đang dùng.', 'admin/self-delete');
        const target = await adminAuth().getUser(uid).catch(() => null);
        if (target && target.email && adminEmails().includes(target.email.toLowerCase())) {
          return fail(res, 400, 'Không thể xóa tài khoản quản trị.', 'admin/protected');
        }
        const deleted = await wipeUserData(db, uid);
        if (target) await adminAuth().deleteUser(uid);
        return res.status(200).json({ ok: true, profilesDeleted: deleted });
      }

      case 'resetLink': {
        const email = String(body.email || '').trim();
        if (!email) return fail(res, 400, 'Thiếu email.', 'admin/bad-request');
        const link = await adminAuth().generatePasswordResetLink(email);
        return res.status(200).json({ link });
      }

      case 'codes': {
        const [codes, users] = await Promise.all([loadInviteCodes(db), listAllUsers()]);
        const emailByUid = {};
        users.forEach((u) => { emailByUid[u.uid] = u.email || ''; });
        const rows = codes.map((c) => ({
          code: c.code,
          kind: c.uid ? 'user' : 'campaign',
          ownerEmail: c.uid ? emailByUid[c.uid] || '(đã xóa)' : '',
          label: c.label || '',
          uses: c.uses || 0,
          maxUses: c.maxUses || 0,
          createdAt: plain(c.createdAt) || null
        }));
        rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return res.status(200).json({ codes: rows });
      }

      case 'createCode': {
        const label = String(body.label || '').trim().slice(0, 60);
        const maxUses = body.maxUses ? Number(body.maxUses) : 0;
        if (!Number.isInteger(maxUses) || maxUses < 0 || maxUses > 1000000) {
          return fail(res, 400, 'Số lượt tối đa không hợp lệ.', 'admin/bad-request');
        }
        const custom = body.code ? normalizeCode(body.code) : '';
        if (custom && !isValidCode(custom)) {
          return fail(res, 400, 'Mã phải đúng 8 ký tự (A-Z trừ I, O và 2-9).', 'admin/bad-code');
        }
        for (let i = 0; i < 6; i++) {
          const code = custom || randomCode();
          try {
            await db.collection('inviteCodes').doc(code).create({
              uid: null, label, maxUses, uses: 0, createdAt: new Date(), createdBy: decoded.uid
            });
            return res.status(200).json({ ok: true, code });
          } catch (err) {
            const exists = err.code === 6 || /already exists/i.test(err.message || '');
            if (!exists) throw err;
            if (custom) return fail(res, 409, 'Mã này đã tồn tại.', 'admin/code-exists');
          }
        }
        return fail(res, 500, 'Không tạo được mã.', 'admin/failed');
      }

      case 'deleteCode': {
        const code = normalizeCode(body.code);
        if (!isValidCode(code)) return fail(res, 400, 'Mã không hợp lệ.', 'admin/bad-request');
        await db.collection('inviteCodes').doc(code).delete();
        return res.status(200).json({ ok: true });
      }

      case 'premiumCodes': {
        await ensureSeeded(db);
        const snap = await db.collection('premiumCodes').limit(2000).get();
        const rows = snap.docs
          .filter((d) => d.data().days)
          .map((d) => {
            const c = d.data();
            return {
              code: d.id,
              days: c.days,
              label: c.label || '',
              maxUses: c.maxUses || 0,
              usedCount: c.usedCount || 0,
              trial: Boolean(c.trial),
              disabled: Boolean(c.disabled),
              createdAt: plain(c.createdAt) || null
            };
          });
        rows.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return res.status(200).json({ codes: rows });
      }

      case 'createPremiumCode': {
        const days = Number(body.days);
        const maxUses = body.maxUses ? Number(body.maxUses) : 0;
        if (!Number.isInteger(days) || days < 1 || days > 36500) return fail(res, 400, 'Số ngày phải từ 1 đến 36500.', 'admin/bad-request');
        if (!Number.isInteger(maxUses) || maxUses < 0 || maxUses > 10000000) return fail(res, 400, 'Số lượt dùng không hợp lệ.', 'admin/bad-request');
        const custom = body.code ? normalizePremiumCode(body.code) : '';
        if (custom && !isValidPremiumCode(custom)) return fail(res, 400, 'Code chỉ gồm A-Z, 0-9, _ và - (3-32 ký tự).', 'admin/bad-code');
        const doc = {
          days, maxUses, usedCount: 0, trial: false, disabled: false,
          label: String(body.label || '').trim().slice(0, 60), createdAt: new Date(), createdBy: decoded.uid
        };
        for (let i = 0; i < 6; i++) {
          const code = custom || `KON-${randomCode()}`;
          try {
            await db.collection('premiumCodes').doc(code).create(doc);
            return res.status(200).json({ ok: true, code });
          } catch (err) {
            const exists = err.code === 6 || /already exists/i.test(err.message || '');
            if (!exists) throw err;
            if (custom) return fail(res, 409, 'Code này đã tồn tại.', 'admin/code-exists');
          }
        }
        return fail(res, 500, 'Không tạo được code.', 'admin/failed');
      }

      case 'setPremiumCodeDisabled': {
        const code = normalizePremiumCode(body.code);
        if (!isValidPremiumCode(code)) return fail(res, 400, 'Code không hợp lệ.', 'admin/bad-request');
        await db.collection('premiumCodes').doc(code).update({ disabled: Boolean(body.disabled) });
        return res.status(200).json({ ok: true });
      }

      case 'deletePremiumCode': {
        const code = normalizePremiumCode(body.code);
        if (!isValidPremiumCode(code)) return fail(res, 400, 'Code không hợp lệ.', 'admin/bad-request');
        await db.collection('premiumCodes').doc(code).delete();
        return res.status(200).json({ ok: true });
      }

      case 'getConfig': {
        const config = await loadConfig(db);
        return res.status(200).json({ config, defaults: DEFAULT_CONFIG });
      }

      case 'saveConfig': {
        let config;
        try {
          config = normalizeConfig(body.config || {});
        } catch (e) {
          return fail(res, 400, e.message, 'admin/bad-config');
        }
        await db.collection('config').doc('inviteEvent').set({ ...config, updatedAt: new Date(), updatedBy: decoded.uid });
        return res.status(200).json({ ok: true, config });
      }

      case 'claims': {
        const snap = await db.collection('inviteClaims').orderBy('claimedAt', 'desc').limit(500).get();
        return res.status(200).json({ claims: snap.docs.map((d) => ({ id: d.id, ...plain(d.data()) })) });
      }

      case 'setClaimStatus': {
        const id = String(body.id || '');
        const status = body.status === 'delivered' ? 'delivered' : 'pending';
        if (!id) return fail(res, 400, 'Thiếu id.', 'admin/bad-request');
        const ref = db.collection('inviteClaims').doc(id);
        const snap = await ref.get();
        if (!snap.exists) return fail(res, 404, 'Không tìm thấy.', 'admin/not-found');
        if (snap.data().status === 'granted') return fail(res, 400, 'Quà này đã được cộng tự động.', 'admin/bad-request');
        await ref.update({ status, deliveredAt: status === 'delivered' ? new Date() : null });
        return res.status(200).json({ ok: true });
      }

      default:
        return fail(res, 400, 'Hành động không hợp lệ.', 'admin/bad-request');
    }
  } catch (err) {
    console.error('admin error:', err);
    return fail(res, 500, err.message || 'Có lỗi xảy ra.', 'admin/failed');
  }
};

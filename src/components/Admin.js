import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lastNDays } from '../utils/dateKey';
import ViewsChart from './ViewsChart';
import UserMenu from './UserMenu';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from '../config/cloudinary';
import { TEMPLATE_FIELDS, TEMPLATE_LAYOUTS, TEMPLATE_EFFECTS, TEMPLATE_FONTS, TEMPLATE_CURSOR_PRESETS, TEMPLATE_CURSOR_EFFECTS, SPLASH_DEFAULTS, BLOB_DEFAULTS, templatePremiumReasons } from '../constants/templates';
import DiamondIcon from './DiamondIcon';
import './Admin.css';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'users', label: 'Tài khoản' },
  { id: 'codes', label: 'Mã mời' },
  { id: 'premium', label: 'Code Premium' },
  { id: 'templates', label: 'Template' },
  { id: 'event', label: 'Sự kiện & quà' }
];

const PAGE_NAMES = {
  home: 'Trang chủ', profile: 'Trang hồ sơ công khai', login: 'Đăng nhập', register: 'Đăng ký', verify_email: 'Xác minh email',
  dashboard: 'Dashboard', edit_profile: 'Chỉnh sửa hồ sơ', links: 'Links', premium: 'Premium', invite: 'Mã mời',
  leaderboard: 'Xếp hạng', community: 'Cộng đồng', terms: 'Điều khoản', privacy: 'Riêng tư', copyright: 'Bản quyền',
  profile_template: 'Mẫu', edit_layout: 'Bố cục'
};

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', { hour12: false }) : '—');
const toLocalInput = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function Admin() {
  const { adminCall } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(null); // null = đang kiểm tra
  const [denied, setDenied] = useState(null); // { reason, email, apiError }
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    let cancelled = false;
    adminCall({ action: 'whoami' })
      .then((r) => {
        if (cancelled) return;
        setAllowed(Boolean(r.admin));
        if (!r.admin) setDenied({ reason: r.reason, email: r.email });
      })
      .catch((e) => {
        if (cancelled) return;
        setAllowed(false);
        setDenied({ apiError: e.code || e.message || 'unknown' });
      });
    return () => {
      cancelled = true;
    };
  }, [adminCall]);

  if (allowed === null) return <div className="adm-loading">Đang kiểm tra quyền…</div>;
  if (!allowed) {
    const hint = denied?.apiError
      ? `Không gọi được máy chủ API (${denied.apiError}). Hãy deploy lên Vercel hoặc chạy "vercel dev" — "npm start" không có /api.`
      : denied?.reason === 'no-env'
        ? 'Máy chủ chưa có biến môi trường ADMIN_EMAILS (hoặc chưa deploy lại sau khi thêm biến này).'
        : denied?.reason === 'email-not-verified'
          ? 'Email của tài khoản này chưa được xác minh.'
          : `Email ${denied?.email || ''} không nằm trong ADMIN_EMAILS (kiểm tra chính tả, dấu phẩy, đúng tài khoản đang đăng nhập).`;
    return (
      <div className="adm-loading" style={{ flexDirection: 'column', gap: 14, textAlign: 'center', padding: 24 }}>
        <strong style={{ color: '#fff', fontSize: 18 }}>Không có quyền vào trang quản trị</strong>
        <span style={{ maxWidth: 520 }}>{hint}</span>
        <Link to="/dashboard" className="adm-btn ghost" style={{ textDecoration: 'none' }}>Về Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-brand">
          <Link to="/" className="adm-logo">
            <img src="/logo-konone-v1.png" alt="KonOne" />
            <span>KonOne</span>
          </Link>
          <span className="adm-badge">ADMIN</span>
        </div>
        <nav className="adm-tabs" aria-label="Quản trị">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="adm-right">
          <button type="button" className="adm-btn ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <UserMenu afterLogout="/login" />
        </div>
      </header>
      <main className="adm-main">
        {tab === 'overview' && <Overview call={adminCall} />}
        {tab === 'users' && <Users call={adminCall} />}
        {tab === 'codes' && <Codes call={adminCall} />}
        {tab === 'premium' && <PremiumCodes call={adminCall} />}
        {tab === 'templates' && <Templates call={adminCall} />}
        {tab === 'event' && <EventConfig call={adminCall} />}
      </main>
    </div>
  );
}

// Hook tải dữ liệu 1 lần + nạp lại
function useLoad(call, body) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const key = JSON.stringify(body);
  const load = useCallback(async () => {
    setError('');
    try {
      setData(await call(JSON.parse(key)));
    } catch (e) {
      setError(e.message || 'Lỗi');
    }
  }, [call, key]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, reload: load };
}

function Status({ error, loading }) {
  if (error) return <div className="adm-error">{error}</div>;
  if (loading) return <div className="adm-muted">Đang tải…</div>;
  return null;
}

/* ================= Tổng quan ================= */
function Overview({ call }) {
  const { data, error } = useLoad(call, { action: 'stats' });
  const [series, setSeries] = useState('visits');
  const [range, setRange] = useState(30);

  const chartData = useMemo(() => (data ? lastNDays(data.series[series], 60).slice(-range) : []), [data, series, range]);
  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (!data) return <Status error={error} loading />;
  const t = data.totals;
  const kpis = [
    ['Tài khoản', t.users],
    ['Đã xác minh email', t.verified],
    ['Hồ sơ', t.profiles],
    ['Hồ sơ public', t.publicProfiles],
    ['Premium đang hoạt động', t.premium],
    ['Truy cập hôm nay', t.visitsToday],
    ['Khách hôm nay', t.visitorsToday],
    ['Tổng lượt truy cập', t.visitsTotal],
    ['Tổng lượt xem hồ sơ', t.totalViews],
    ['Lượt nhập mã mời', t.invitesRedeemed]
  ];
  const SERIES = [
    { id: 'visits', label: 'Lượt truy cập web' },
    { id: 'visitors', label: 'Khách truy cập' },
    { id: 'views', label: 'Lượt xem hồ sơ' },
    { id: 'signups', label: 'Đăng ký mới' },
    { id: 'profiles', label: 'Hồ sơ được tạo' }
  ];

  return (
    <section className="adm-stack">
      <div className="adm-kpis">
        {kpis.map(([label, v]) => (
          <div key={label} className="adm-kpi">
            <span>{label}</span>
            <strong>{Number(v).toLocaleString()}</strong>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <div className="adm-card-head">
          <h2>Sơ đồ truy cập</h2>
          <div className="adm-seg">
            {SERIES.map((s) => (
              <button key={s.id} type="button" className={series === s.id ? 'on' : ''} onClick={() => setSeries(s.id)}>{s.label}</button>
            ))}
          </div>
          <div className="adm-seg">
            {[7, 30, 60].map((n) => (
              <button key={n} type="button" className={range === n ? 'on' : ''} onClick={() => setRange(n)}>{n} ngày</button>
            ))}
          </div>
        </div>
        <div className="adm-muted">Tổng {range} ngày: <b>{total.toLocaleString()}</b></div>
        <ViewsChart data={chartData} language="vi" />
        <p className="adm-note">Lượt truy cập web được ghi từ khi bật theo dõi (mỗi lần mở/đổi trang, bỏ qua bot và trang quản trị). "Khách truy cập" là số trình duyệt khác nhau trong ngày. Không lưu IP.</p>
      </div>

      <div className="adm-card">
        <h2>Trang được xem nhiều (30 ngày)</h2>
        <div className="adm-table-wrap">
          <table className="adm-table static">
            <thead><tr><th>Trang</th><th>Lượt xem</th></tr></thead>
            <tbody>
              {Object.entries(data.pages || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                <tr key={k}><td>{PAGE_NAMES[k] || k}</td><td>{Number(n).toLocaleString()}</td></tr>
              ))}
              {!Object.keys(data.pages || {}).length && <tr><td colSpan={2} className="adm-muted">Chưa có dữ liệu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ================= Tài khoản ================= */
function Users({ call }) {
  const { data, error, reload } = useLoad(call, { action: 'users' });
  const [q, setQ] = useState('');
  const [openUid, setOpenUid] = useState(null);

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    const list = data?.users || [];
    if (!k) return list;
    return list.filter((u) =>
      [u.email, u.uid, u.profile?.username, u.profile?.displayName, u.inviteCode].some((v) => String(v || '').toLowerCase().includes(k))
    );
  }, [data, q]);

  if (!data) return <Status error={error} loading />;

  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>Tài khoản đã đăng ký <span className="adm-count">{rows.length}/{data.users.length}</span></h2>
        <input className="adm-input" placeholder="Tìm email, username, uid, mã mời…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="adm-btn ghost" onClick={reload}>Làm mới</button>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Tài khoản</th><th>Username</th><th>Đăng nhập</th><th>Email</th><th>Ngày đăng ký</th>
              <th>Lần cuối</th><th>Lượt xem</th><th>Premium</th><th>Mã mời</th><th>Lượt mời</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.uid} onClick={() => setOpenUid(u.uid)}>
                <td>
                  <div className="adm-user">
                    {u.profile?.avatar ? <img src={u.profile.avatar} alt="" /> : <i>{(u.email || '?').charAt(0).toUpperCase()}</i>}
                    <span>{u.email || u.uid}{u.isAdmin && <b className="adm-badge small">ADMIN</b>}</span>
                  </div>
                </td>
                <td>{u.profile?.username ? `@${u.profile.username}` : <span className="adm-muted">chưa có hồ sơ</span>}{u.profile?.isHidden && <span className="adm-tag">ẩn</span>}</td>
                <td>{u.providers.map((p) => p.replace('.com', '')).join(', ') || '—'}</td>
                <td><span className={`adm-tag ${u.emailVerified ? 'ok' : 'warn'}`}>{u.emailVerified ? 'đã xác minh' : 'chưa'}</span></td>
                <td>{fmt(u.createdAt)}</td>
                <td>{fmt(u.lastSignIn)}</td>
                <td>{(u.profile?.viewCount || 0).toLocaleString()}</td>
                <td>{u.profile?.isPremium ? <span className="adm-tag ok">{fmt(u.profile.premiumExpiresAt)}</span> : '—'}</td>
                <td className="adm-mono">{u.inviteCode || '—'}</td>
                <td>{u.inviteUses}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={10} className="adm-muted">Không có tài khoản nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {openUid && <UserModal uid={openUid} call={call} onClose={() => setOpenUid(null)} onChanged={reload} />}
    </section>
  );
}

function UserModal({ uid, call, onClose, onChanged }) {
  const { data, error, reload } = useLoad(call, { action: 'userDetail', uid });
  const [busy, setBusy] = useState('');
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState('');

  async function run(label, body, after) {
    setBusy(label);
    setMsg('');
    try {
      const r = await call(body);
      if (after) after(r);
      await onChanged();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy('');
    }
  }

  async function deleteProfile(p) {
    if (!window.confirm(`Xóa hồ sơ @${p.username || p.id}? Hành động này không thể hoàn tác.`)) return;
    await run('profile', { action: 'deleteProfile', profileId: p.id }, () => reload());
  }

  async function deleteUser() {
    const email = data?.auth?.email || uid;
    if (window.prompt(`Xóa VĨNH VIỄN tài khoản ${email} cùng toàn bộ dữ liệu.\nGõ "XOA" để xác nhận:`) !== 'XOA') return;
    await run('user', { action: 'deleteUser', uid }, onClose);
  }

  return (
    <div className="adm-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal-card">
        <div className="adm-card-head">
          <h2>Chi tiết tài khoản</h2>
          <button type="button" className="adm-btn ghost" onClick={onClose}>Đóng</button>
        </div>
        {!data ? <Status error={error} loading /> : (
          <>
            <dl className="adm-dl">
              <dt>UID</dt><dd className="adm-mono">{data.auth.uid}</dd>
              <dt>Email</dt><dd>{data.auth.email || '—'} <span className={`adm-tag ${data.auth.emailVerified ? 'ok' : 'warn'}`}>{data.auth.emailVerified ? 'đã xác minh' : 'chưa xác minh'}</span></dd>
              <dt>Tên (Auth)</dt><dd>{data.auth.displayName || '—'}</dd>
              <dt>Đăng nhập bằng</dt><dd>{data.auth.providers.map((p) => p.providerId).join(', ') || '—'}</dd>
              <dt>Mật khẩu</dt>
              <dd>
                {data.auth.hasPassword ? 'Có đặt mật khẩu' : 'Không dùng mật khẩu'} —{' '}
                <span className="adm-muted">Firebase chỉ lưu bản băm một chiều, không thể giải mã hay xem mật khẩu.</span>
              </dd>
              <dt>Ngày đăng ký</dt><dd>{fmt(data.auth.createdAt)}</dd>
              <dt>Đăng nhập gần nhất</dt><dd>{fmt(data.auth.lastSignIn)}</dd>
              <dt>Đã nhập mã mời</dt><dd className="adm-mono">{data.redeemed ? `${data.redeemed.code} (${fmt(data.redeemed.redeemedAt)})` : '—'}</dd>
              <dt>Mã mời của họ</dt><dd className="adm-mono">{data.inviteCodes.map((c) => `${c.code} · ${c.uses || 0} lượt`).join(', ') || '—'}</dd>
            </dl>

            <div className="adm-actions">
              {data.auth.email && data.auth.hasPassword && (
                <button type="button" className="adm-btn ghost" disabled={busy === 'reset'} onClick={() => run('reset', { action: 'resetLink', email: data.auth.email }, (r) => setLink(r.link))}>
                  Tạo link đặt lại mật khẩu
                </button>
              )}
              <button type="button" className="adm-btn danger" disabled={busy === 'user'} onClick={deleteUser}>Xóa tài khoản</button>
            </div>
            {link && (
              <div className="adm-linkbox">
                <input className="adm-input" readOnly value={link} onFocus={(e) => e.target.select()} />
                <button type="button" className="adm-btn" onClick={() => navigator.clipboard?.writeText(link)}>Sao chép</button>
              </div>
            )}
            {msg && <div className="adm-error">{msg}</div>}

            <h3>Hồ sơ & Premium ({data.profiles.length})</h3>
            {data.profiles.map((p) => (
              <details key={p.id} className="adm-profile">
                <summary>
                  <span>@{p.username || '(chưa đặt)'} · {p.displayName || '—'} · {(p.viewCount || 0).toLocaleString()} lượt xem</span>
                  <button type="button" className="adm-btn danger small" disabled={busy === 'profile'} onClick={(e) => { e.preventDefault(); deleteProfile(p); }}>Xóa hồ sơ</button>
                </summary>
                <PremiumBox profile={p} call={call} onDone={() => { reload(); onChanged(); }} />
                <pre>{JSON.stringify(p, null, 2)}</pre>
              </details>
            ))}
            {!data.profiles.length && <div className="adm-muted">Chưa có hồ sơ.</div>}

            <h3>Quà đã nhận ({data.claims.length})</h3>
            {data.claims.map((c) => (
              <div key={c.id} className="adm-muted">{c.reward} · {c.status} · {fmt(c.claimedAt)}</div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function PremiumBox({ profile, call, onDone }) {
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const until = profile.premiumExpiresAt ? new Date(profile.premiumExpiresAt) : null;
  const active = Boolean(profile.isPremium && until && until > new Date());
  const left = active ? Math.ceil((until - new Date()) / 86400000) : 0;

  async function run(kind) {
    setBusy(kind);
    setMsg(null);
    try {
      if (kind === 'grant') {
        const d = Number(days);
        if (!Number.isInteger(d) || d < 1) throw new Error('Số ngày không hợp lệ.');
        const r = await call({ action: 'grantPremium', profileId: profile.id, days: d });
        setMsg({ ok: true, text: `Đã nâng cấp +${d} ngày, hết hạn ${fmt(r.premiumExpiresAt)}` });
      } else {
        if (!window.confirm('Thu hồi Premium của hồ sơ này?')) { setBusy(''); return; }
        await call({ action: 'revokePremium', profileId: profile.id });
        setMsg({ ok: true, text: 'Đã thu hồi Premium.' });
      }
      onDone();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="adm-premium">
      <div>
        <span className={`adm-tag ${active ? 'ok' : ''}`}>{active ? 'Premium đang bật' : 'Chưa có Premium'}</span>
        {active && <span className="adm-muted"> · còn {left.toLocaleString()} ngày (hết hạn {fmt(profile.premiumExpiresAt)})</span>}
      </div>
      <div className="adm-premium-row">
        <input className="adm-input" type="number" min="1" max="36500" value={days} onChange={(e) => setDays(e.target.value)} aria-label="Số ngày" />
        <span className="adm-muted">ngày</span>
        <button type="button" className="adm-btn" disabled={busy === 'grant'} onClick={() => run('grant')}>
          Nâng cấp Premium +{Number(days) || 0} ngày
        </button>
        {active && <button type="button" className="adm-btn danger" disabled={busy === 'revoke'} onClick={() => run('revoke')}>Thu hồi</button>}
      </div>
      {msg && <div className={msg.ok ? 'adm-ok' : 'adm-error'}>{msg.text}</div>}
    </div>
  );
}

/* ================= Mã mời ================= */
function Codes({ call }) {
  const { data, error, reload } = useLoad(call, { action: 'codes' });
  const [form, setForm] = useState({ code: '', label: '', maxUses: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const r = await call({ action: 'createCode', code: form.code, label: form.label, maxUses: form.maxUses ? Number(form.maxUses) : 0 });
      setMsg(`Đã tạo mã ${r.code}`);
      setForm({ code: '', label: '', maxUses: '' });
      reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Xóa mã ${c.code}?${c.kind === 'user' ? ' Đây là mã cá nhân, người dùng sẽ được cấp mã mới.' : ''}`)) return;
    try {
      await call({ action: 'deleteCode', code: c.code });
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  }

  if (!data) return <Status error={error} loading />;

  return (
    <section className="adm-stack">
      <form className="adm-card adm-form" onSubmit={create}>
        <h2>Tạo mã mời</h2>
        <div className="adm-row">
          <label>Mã (để trống = ngẫu nhiên 8 ký tự)
            <input className="adm-input adm-mono" maxLength={8} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: KONONE26 → 8 ký tự" />
          </label>
          <label>Ghi chú
            <input className="adm-input" maxLength={60} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="VD: Mã tặng KOL" />
          </label>
          <label>Số lượt tối đa (0 = không giới hạn)
            <input className="adm-input" type="number" min="0" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          </label>
          <button type="submit" className="adm-btn" disabled={busy}>Tạo mã</button>
        </div>
        {msg && <div className="adm-muted">{msg}</div>}
      </form>

      <div className="adm-card">
        <div className="adm-card-head">
          <h2>Mã đang có <span className="adm-count">{data.codes.length}</span></h2>
          <button type="button" className="adm-btn ghost" onClick={reload}>Làm mới</button>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table static">
            <thead><tr><th>Mã</th><th>Loại</th><th>Chủ mã / ghi chú</th><th>Đã dùng</th><th>Tối đa</th><th>Ngày tạo</th><th /></tr></thead>
            <tbody>
              {data.codes.map((c) => (
                <tr key={c.code}>
                  <td className="adm-mono"><b>{c.code}</b></td>
                  <td><span className={`adm-tag ${c.kind === 'user' ? '' : 'ok'}`}>{c.kind === 'user' ? 'cá nhân' : 'chiến dịch'}</span></td>
                  <td>{c.kind === 'user' ? c.ownerEmail : c.label || '—'}</td>
                  <td>{c.uses}</td>
                  <td>{c.maxUses || '∞'}</td>
                  <td>{fmt(c.createdAt)}</td>
                  <td><button type="button" className="adm-btn danger small" onClick={() => remove(c)}>Xóa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adm-note">Mã chiến dịch không có người mời nên chỉ ghi nhận lượt nhập, không cộng vào cột mốc của ai.</p>
      </div>
    </section>
  );
}

/* ================= Code Premium ================= */
function PremiumCodes({ call }) {
  const { data, error, reload } = useLoad(call, { action: 'premiumCodes' });
  const [form, setForm] = useState({ code: '', days: 30, maxUses: '', label: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await call({ action: 'createPremiumCode', code: form.code, days: Number(form.days), maxUses: form.maxUses ? Number(form.maxUses) : 0, label: form.label });
      setMsg({ ok: true, text: `Đã tạo code ${r.code}` });
      setForm({ code: '', days: 30, maxUses: '', label: '' });
      reload();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c) {
    try {
      await call({ action: 'setPremiumCodeDisabled', code: c.code, disabled: !c.disabled });
      reload();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  async function remove(c) {
    if (!window.confirm(`Xóa code ${c.code}? Người đã kích hoạt vẫn giữ Premium.`)) return;
    try {
      await call({ action: 'deletePremiumCode', code: c.code });
      reload();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  if (!data) return <Status error={error} loading />;

  return (
    <section className="adm-stack">
      <form className="adm-card adm-form" onSubmit={create}>
        <h2>Tạo code Premium</h2>
        <div className="adm-row">
          <label>Code (để trống = tự tạo KON-XXXXXXXX)
            <input className="adm-input adm-mono" maxLength={32} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: TETVUI2027" />
          </label>
          <label>Số ngày Premium
            <input className="adm-input" type="number" min="1" max="36500" required value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} />
          </label>
          <label>Số lượt dùng (trống/0 = không giới hạn)
            <input className="adm-input" type="number" min="0" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          </label>
          <label>Ghi chú
            <input className="adm-input" maxLength={60} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="VD: Quà KOL tháng 12" />
          </label>
          <button type="submit" className="adm-btn" disabled={busy}>Tạo code</button>
        </div>
        {msg && <div className={msg.ok ? 'adm-ok' : 'adm-error'}>{msg.text}</div>}
      </form>

      <div className="adm-card">
        <div className="adm-card-head">
          <h2>Code Premium đang có <span className="adm-count">{data.codes.length}</span></h2>
          <button type="button" className="adm-btn ghost" onClick={reload}>Làm mới</button>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table static">
            <thead><tr><th>Code</th><th>Số ngày</th><th>Đã dùng</th><th>Tối đa</th><th>Ghi chú</th><th>Trạng thái</th><th>Ngày tạo</th><th /></tr></thead>
            <tbody>
              {data.codes.map((c) => (
                <tr key={c.code}>
                  <td className="adm-mono"><b>{c.code}</b>{c.trial && <span className="adm-tag">dùng thử</span>}</td>
                  <td>{c.days.toLocaleString()}</td>
                  <td>{c.usedCount}</td>
                  <td>{c.maxUses || '∞'}</td>
                  <td>{c.label || '—'}</td>
                  <td><span className={`adm-tag ${c.disabled ? 'warn' : 'ok'}`}>{c.disabled ? 'đã tắt' : (c.maxUses && c.usedCount >= c.maxUses ? 'hết lượt' : 'đang bật')}</span></td>
                  <td>{fmt(c.createdAt)}</td>
                  <td>
                    <button type="button" className="adm-btn ghost small" onClick={() => toggle(c)}>{c.disabled ? 'Bật' : 'Tắt'}</button>{' '}
                    <button type="button" className="adm-btn danger small" onClick={() => remove(c)}>Xóa</button>
                  </td>
                </tr>
              ))}
              {!data.codes.length && <tr><td colSpan={8} className="adm-muted">Chưa có code nào.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="adm-note">Mỗi tài khoản chỉ dùng được một code một lần. Ngày Premium được cộng dồn nếu tài khoản đang còn hạn.</p>
      </div>
    </section>
  );
}

/* ================= Sự kiện & quà ================= */
const TONES = ['coral', 'youtube', 'spotify', 'gold', 'violet'];
const ICONS = ['diamond', 'play', 'wave', 'crown', 'headphones'];

function EventConfig({ call }) {
  const { data, error } = useLoad(call, { action: 'getConfig' });
  const claims = useLoad(call, { action: 'claims' });
  const [cfg, setCfg] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setCfg(JSON.parse(JSON.stringify(data.config)));
  }, [data]);

  if (!cfg) return <Status error={error} loading />;

  const setMs = (i, patch) => setCfg((c) => ({ ...c, milestones: c.milestones.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) }));

  function addMilestone() {
    setCfg((c) => ({
      ...c,
      milestones: [...c.milestones, {
        id: `m${Date.now().toString(36)}`.slice(0, 20), need: 1, slots: 1, type: 'manual', days: 0, tone: 'coral', icon: 'diamond',
        choices: [], title: { vi: '', en: '' }
      }]
    }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await call({ action: 'saveConfig', config: cfg });
      setCfg(r.config);
      setMsg({ ok: true, text: 'Đã lưu cấu hình sự kiện.' });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(c, status) {
    try {
      await call({ action: 'setClaimStatus', id: c.id, status });
      claims.reload();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
  }

  return (
    <section className="adm-stack">
      <div className="adm-card adm-form">
        <div className="adm-card-head">
          <h2>Cấu hình sự kiện mời bạn</h2>
          <button type="button" className="adm-btn" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu cấu hình'}</button>
        </div>
        <div className="adm-row">
          <label>Bắt đầu
            <input className="adm-input" type="datetime-local" value={toLocalInput(cfg.start)} onChange={(e) => e.target.value && setCfg({ ...cfg, start: new Date(e.target.value).toISOString() })} />
          </label>
          <label>Kết thúc
            <input className="adm-input" type="datetime-local" value={toLocalInput(cfg.end)} onChange={(e) => e.target.value && setCfg({ ...cfg, end: new Date(e.target.value).toISOString() })} />
          </label>
        </div>
        {msg && <div className={msg.ok ? 'adm-ok' : 'adm-error'}>{msg.text}</div>}

        {cfg.milestones.map((m, i) => (
          <div key={m.id + i} className="adm-ms">
            <div className="adm-ms-head">
              <b>Cột mốc {i + 1}</b>
              <button type="button" className="adm-btn danger small" onClick={() => setCfg({ ...cfg, milestones: cfg.milestones.filter((_, idx) => idx !== i) })}>Xóa mốc</button>
            </div>
            <div className="adm-row">
              <label>Mã mốc (a-z, 0-9, _)
                <input className="adm-input adm-mono" value={m.id} onChange={(e) => setMs(i, { id: e.target.value.toLowerCase() })} />
              </label>
              <label>Số người mời
                <input className="adm-input" type="number" min="1" value={m.need} onChange={(e) => setMs(i, { need: Number(e.target.value) })} />
              </label>
              <label>Số slot
                <input className="adm-input" type="number" min="1" value={m.slots} onChange={(e) => setMs(i, { slots: Number(e.target.value) })} />
              </label>
              <label>Kiểu trao quà
                <select className="adm-input" value={m.type} onChange={(e) => setMs(i, { type: e.target.value, days: e.target.value === 'auto' ? m.days || 30 : 0 })}>
                  <option value="manual">Thủ công (admin trao)</option>
                  <option value="auto">Tự cộng Premium KonOne</option>
                </select>
              </label>
              {m.type === 'auto' && (
                <label>Số ngày Premium
                  <input className="adm-input" type="number" min="1" value={m.days} onChange={(e) => setMs(i, { days: Number(e.target.value) })} />
                </label>
              )}
            </div>
            <div className="adm-row">
              <label>Tên quà (VI)
                <input className="adm-input" value={m.title.vi} onChange={(e) => setMs(i, { title: { ...m.title, vi: e.target.value } })} />
              </label>
              <label>Tên quà (EN)
                <input className="adm-input" value={m.title.en} onChange={(e) => setMs(i, { title: { ...m.title, en: e.target.value } })} />
              </label>
              <label>Màu
                <select className="adm-input" value={m.tone} onChange={(e) => setMs(i, { tone: e.target.value })}>{TONES.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <label>Icon
                <select className="adm-input" value={m.icon} onChange={(e) => setMs(i, { icon: e.target.value })}>{ICONS.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
            </div>
            {m.type === 'manual' && (
              <label className="adm-block">Lựa chọn quà (để trống nếu chỉ có 1 quà; mỗi dòng: khóa=Tên, ví dụ youtube=YouTube)
                <textarea
                  className="adm-input"
                  rows={2}
                  value={m.choices.map((c) => `${c.key}=${c.label}`).join('\n')}
                  onChange={(e) => setMs(i, {
                    choices: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
                      const [key, ...rest] = l.split('=');
                      return { key: key.trim().toLowerCase(), label: (rest.join('=') || key).trim() };
                    })
                  })}
                />
              </label>
            )}
          </div>
        ))}
        <button type="button" className="adm-btn ghost" onClick={addMilestone}>+ Thêm cột mốc</button>
      </div>

      <div className="adm-card">
        <div className="adm-card-head">
          <h2>Người đã nhận quà <span className="adm-count">{claims.data?.claims.length || 0}</span></h2>
          <button type="button" className="adm-btn ghost" onClick={claims.reload}>Làm mới</button>
        </div>
        <Status error={claims.error} loading={!claims.data} />
        {claims.data && (
          <div className="adm-table-wrap">
            <table className="adm-table static">
              <thead><tr><th>Thời gian</th><th>Email</th><th>Quà</th><th>Lựa chọn</th><th>Lượt mời</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>
                {claims.data.claims.map((c) => (
                  <tr key={c.id}>
                    <td>{fmt(c.claimedAt)}</td>
                    <td>{c.email || c.uid}</td>
                    <td>{c.reward}</td>
                    <td>{c.choice || '—'}</td>
                    <td>{c.usesAtClaim}</td>
                    <td><span className={`adm-tag ${c.status === 'pending' ? 'warn' : 'ok'}`}>{{ pending: 'chờ trao', delivered: 'đã trao', granted: 'đã cộng tự động' }[c.status] || c.status}</span></td>
                    <td>
                      {c.status === 'pending' && <button type="button" className="adm-btn small" onClick={() => setStatus(c, 'delivered')}>Đánh dấu đã trao</button>}
                      {c.status === 'delivered' && <button type="button" className="adm-btn ghost small" onClick={() => setStatus(c, 'pending')}>Hoàn tác</button>}
                    </td>
                  </tr>
                ))}
                {!claims.data.claims.length && <tr><td colSpan={7} className="adm-muted">Chưa có ai nhận quà.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// ===== Template: quản lý mẫu hiển thị ở trang Mẫu =====
const EMPTY_TEMPLATE = {
  id: '',
  nameVi: '',
  nameEn: '',
  tags: '', // hashtag, VD: #onepiece #anime
  keywords: '', // từ khóa tìm kiếm, VD: One Piece, luffy, hải tặc
  published: true,
  premium: false,
  layout: 'card',
  cardColor: '#18161c',
  strapColor: '#f65c5c',
  textColor: '#ffffff',
  bgColor: '#0a0a0c',
  iconColor: '#ffffff',
  effect: 'none',
  profileOpacity: 60,
  profileBlur: 40,
  profileGradient: false,
  gradientFrom: '#18161c',
  gradientTo: '#f65c5c',
  font: 'Arial',
  text3D: false,
  nameScale: 100,
  bioScale: 100,
  glowUsername: true,
  glowSocials: true,
  glowBadges: true,
  extra: {} // video, nhạc, con trỏ, hiệu ứng chuột, ảnh nền... (lấy y chang từ hồ sơ hoặc nhập tay)
};

// Các trường đã có ô riêng trong form; phần còn lại nằm trong `extra`
const MANAGED_PRESET_KEYS = [
  'layout', 'cardColor', 'lanyardCardColor', 'lanyardStrapColor', 'textColor', 'bgColor', 'iconColor', 'effect',
  'profileOpacity', 'profileBlur', 'profileGradient', 'gradientFrom', 'gradientTo', 'textFontFamily', 'text3DEffect',
  'glowSettings', 'nameScale', 'bioScale'
];

const hex6 = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : fallback);
const splitList = (v, sep) => String(v || '').split(sep).map((x) => x.trim().replace(/^#/, '')).filter(Boolean);

function buildPreset(f) {
  return {
    ...f.extra,
    layout: f.layout,
    cardColor: f.cardColor,
    lanyardCardColor: f.cardColor,
    lanyardStrapColor: f.strapColor,
    textColor: f.textColor,
    bgColor: f.bgColor,
    iconColor: f.iconColor,
    effect: f.effect,
    profileOpacity: Number(f.profileOpacity),
    profileBlur: Number(f.profileBlur),
    profileGradient: f.profileGradient,
    gradientFrom: f.profileGradient ? f.gradientFrom : '',
    gradientTo: f.profileGradient ? f.gradientTo : '',
    textFontFamily: f.font,
    text3DEffect: f.text3D,
    nameScale: Number(f.nameScale),
    bioScale: Number(f.bioScale),
    glowSettings: { username: f.glowUsername, socials: f.glowSocials, badges: f.glowBadges }
  };
}

function formToTemplate(f) {
  const preset = buildPreset(f);
  return {
    name: { vi: f.nameVi, en: f.nameEn },
    author: 'KonOne',
    tags: splitList(f.tags, /[\s,]+/),
    keywords: splitList(f.keywords, ','),
    published: f.published,
    premium: f.premium || templatePremiumReasons(preset).length > 0,
    preview: { bg: f.bgColor, card: f.cardColor, accent: f.strapColor, text: f.textColor },
    preset
  };
}

function templateToForm(t) {
  const pr = t.preset || {};
  const g = pr.glowSettings || {};
  const extra = {};
  Object.keys(pr).forEach((k) => {
    if (!MANAGED_PRESET_KEYS.includes(k)) extra[k] = pr[k];
  });
  return {
    ...EMPTY_TEMPLATE,
    extra,
    id: t.id,
    nameVi: (t.name && t.name.vi) || '',
    nameEn: (t.name && t.name.en) || '',
    tags: (t.tags || []).map((x) => `#${x}`).join(' '),
    keywords: (t.keywords || []).join(', '),
    published: t.published !== false,
    premium: false, // tự suy ra từ các tính năng đang dùng
    layout: pr.layout || 'card',
    cardColor: hex6(pr.cardColor, EMPTY_TEMPLATE.cardColor),
    strapColor: hex6(pr.lanyardStrapColor, EMPTY_TEMPLATE.strapColor),
    textColor: hex6(pr.textColor, EMPTY_TEMPLATE.textColor),
    bgColor: hex6(pr.bgColor, EMPTY_TEMPLATE.bgColor),
    iconColor: hex6(pr.iconColor, EMPTY_TEMPLATE.iconColor),
    effect: pr.effect || 'none',
    profileOpacity: pr.profileOpacity ?? 60,
    profileBlur: pr.profileBlur ?? 40,
    profileGradient: Boolean(pr.profileGradient),
    gradientFrom: hex6(pr.gradientFrom, EMPTY_TEMPLATE.gradientFrom),
    gradientTo: hex6(pr.gradientTo, EMPTY_TEMPLATE.gradientTo),
    font: pr.textFontFamily || 'Arial',
    text3D: Boolean(pr.text3DEffect),
    nameScale: pr.nameScale ?? 100,
    bioScale: pr.bioScale ?? 100,
    glowUsername: g.username !== false,
    glowSocials: g.socials !== false,
    glowBadges: g.badges !== false
  };
}

// Icon kim cương: báo hiệu phần này cần Premium
function Pm({ show = true }) {
  if (!show) return null;
  return <span title="Cần Premium" style={{ marginLeft: 6, display: 'inline-flex', verticalAlign: 'middle' }}><DiamondIcon className="pro-diamond" size={14} /></span>;
}

function ColorField({ label, value, onChange }) {
  return (
    <label>{label}
      <span className="adm-colorfield">
        <input type="color" value={hex6(value, '#000000')} onChange={(e) => onChange(e.target.value)} />
        <input className="adm-input adm-mono" value={value} onChange={(e) => onChange(e.target.value)} maxLength={9} />
      </span>
    </label>
  );
}

// Ô tải ảnh/video lên Cloudinary (hoặc dán URL) cho mẫu
function MediaField({ label, kind, value, onChange, hint }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const isVideo = kind === 'video';

  async function pick(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const max = isVideo ? 50 : 10;
    if (file.size > max * 1024 * 1024) {
      setErr(`Tệp quá lớn (tối đa ${max}MB).`);
      return;
    }
    setBusy(true);
    setErr('');
    try {
      onChange(await uploadToCloudinary(file, 'templates', isVideo ? 'video' : 'image'));
    } catch (ex) {
      setErr('Tải lên thất bại: ' + ex.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-mediafield" style={{ minWidth: 260 }}>
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {value && (isVideo
          ? <video src={value} muted style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
          : <img src={value} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />)}
        <input className="adm-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://... hoặc bấm Tải lên" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button type="button" className="adm-btn ghost small" disabled={busy} onClick={() => fileRef.current && fileRef.current.click()}>
          {busy ? 'Đang tải...' : 'Tải lên'}
        </button>
        <input ref={fileRef} type="file" accept={isVideo ? 'video/*' : 'image/*'} hidden disabled={busy} onChange={pick} />
        {value && <button type="button" className="adm-btn ghost small" onClick={() => onChange('')}>Xóa</button>}
      </div>
      {hint && <small className="adm-muted">{hint}</small>}
      {err && <small className="adm-error">{err}</small>}
    </div>
  );
}

function Templates({ call }) {
  const { currentUser } = useAuth();
  const { data, error, reload } = useLoad(call, { action: 'templates' });
  const [f, setF] = useState(EMPTY_TEMPLATE);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
  const setExtra = (patch) => setF((prev) => ({ ...prev, extra: { ...prev.extra, ...patch } }));
  // Khung avatar chỉ hiện khi otherSettings.discordAvatarDecoration bật
  const setFrame = (url) =>
    setF((prev) => ({
      ...prev,
      extra: {
        ...prev.extra,
        avatarFrame: url,
        otherSettings: { ...(prev.extra.otherSettings || {}), discordAvatarDecoration: Boolean(url) }
      }
    }));
  const editing = Boolean(f.id);
  const premiumReasons = templatePremiumReasons(buildPreset(f));
  const cursorEffect = f.extra.cursorFx?.id || (f.extra.splashCursor?.enabled ? 'splash' : f.extra.blobCursor?.enabled ? 'blob' : '');
  // Chỉ 1 hiệu ứng chuột được bật
  const setCursorEffect = (id) =>
    setExtra({
      splashCursor: id === 'splash' ? { ...SPLASH_DEFAULTS, ...(f.extra.splashCursor || {}), enabled: true } : { ...(f.extra.splashCursor || {}), enabled: false },
      blobCursor: id === 'blob' ? { ...BLOB_DEFAULTS, ...(f.extra.blobCursor || {}), enabled: true } : { ...(f.extra.blobCursor || {}), enabled: false },
      cursorFx: { length: 20, size: 3, trailSpeed: 0.4, particles: 15, rate: 0.4, ...(f.extra.cursorFx || {}), id: ['bubble', 'rainbow', 'trail3d', 'canvas'].includes(id) ? id : '' }
    });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await call({ action: 'saveTemplate', id: f.id || undefined, template: formToTemplate(f) });
      setMsg({ ok: true, text: editing ? 'Đã cập nhật mẫu.' : 'Đã thêm mẫu.' });
      setF(EMPTY_TEMPLATE);
      reload();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(t) {
    if (!window.confirm(`Xóa mẫu "${(t.name && (t.name.vi || t.name.en)) || t.id}"? Hồ sơ đã dùng mẫu này không bị ảnh hưởng.`)) return;
    try {
      await call({ action: 'deleteTemplate', id: t.id });
      if (f.id === t.id) setF(EMPTY_TEMPLATE);
      reload();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  // Lấy thiết kế từ hồ sơ của chính quản trị viên làm điểm bắt đầu
  async function fillFromMyProfile() {
    setMsg(null);
    try {
      const snap = await getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid), limit(1)));
      if (snap.empty) {
        setMsg({ ok: false, text: 'Tài khoản của bạn chưa có hồ sơ.' });
        return;
      }
      const p = snap.docs[0].data();
      const preset = TEMPLATE_FIELDS.reduce((acc, k) => {
        if (p[k] !== undefined) acc[k] = p[k];
        return acc;
      }, {});
      preset.cardColor = p.lanyardCardColor || p.cardColor;
      const next = {
        ...templateToForm({ id: f.id, name: { vi: f.nameVi, en: f.nameEn }, preset }),
        nameVi: f.nameVi,
        nameEn: f.nameEn,
        tags: f.tags,
        keywords: f.keywords,
        published: f.published
      };
      setF(next);
      setMsg({ ok: true, text: 'Đã sao chép y chang thiết kế từ hồ sơ của bạn (kể cả ảnh nền, khung avatar, hiệu ứng chuột...). Hãy đặt tên rồi lưu.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  if (!data) return <Status error={error} loading />;

  return (
    <section className="adm-stack">
      <form className="adm-card adm-form" onSubmit={save}>
        <div className="adm-card-head">
          <h2>{editing ? 'Sửa mẫu' : 'Thêm mẫu mới'}</h2>
          <div>
            <button type="button" className="adm-btn ghost" onClick={fillFromMyProfile}>Lấy từ hồ sơ của tôi</button>{' '}
            {editing && <button type="button" className="adm-btn ghost" onClick={() => { setF(EMPTY_TEMPLATE); setMsg(null); }}>Hủy sửa</button>}
          </div>
        </div>

        <div className="adm-row">
          <label>Tên Template (Tiếng Việt)
            <input className="adm-input" maxLength={60} value={f.nameVi} onChange={(e) => set({ nameVi: e.target.value })} placeholder="VD: Hải tặc One Piece" />
          </label>
          <label>Tên Template (English)
            <input className="adm-input" maxLength={60} value={f.nameEn} onChange={(e) => set({ nameEn: e.target.value })} placeholder="e.g. One Piece Pirates" />
          </label>
        </div>
        <div className="adm-row">
          <label>Hashtag (cách nhau bằng dấu cách)
            <input className="adm-input" value={f.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="#onepiece #anime #dark" />
          </label>
          <label>Từ khóa tìm kiếm (cách nhau bằng dấu phẩy)
            <input className="adm-input" value={f.keywords} onChange={(e) => set({ keywords: e.target.value })} placeholder="onepiece, one piece, luffy, hải tặc" />
          </label>
        </div>

        <h3 className="adm-subhead">Bố cục</h3>
        <div className="adm-row">
          <label>Bố cục <Pm show={f.layout !== 'card'} />
            <select className="adm-input" value={f.layout} onChange={(e) => set({ layout: e.target.value })}>
              {TEMPLATE_LAYOUTS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>

        <h3 className="adm-subhead">Avatar</h3>
        <div className="adm-row">
          <MediaField label="Upload avatar (ảnh mặc định)" kind="image" value={f.extra.avatar} onChange={(u) => setExtra({ avatar: u })} hint="Chỉ hiện khi người dùng chưa có avatar riêng. Tối đa 10MB" />
          <MediaField label="Upload khung avatar" kind="image" value={f.extra.avatarFrame} onChange={setFrame} hint="PNG/GIF trong suốt phủ quanh avatar, tối đa 10MB" />
        </div>

        <h3 className="adm-subhead">Video nền <Pm /></h3>
        <div className="adm-row">
          <MediaField label="Link video (mp4 hoặc YouTube)" kind="video" value={f.extra.backgroundVideo} onChange={(u) => setExtra({ backgroundVideo: u })} hint="Dán link .mp4 / YouTube, hoặc tải lên (tối đa 50MB)" />
        </div>

        <h3 className="adm-subhead">Nhạc</h3>
        <div className="adm-row">
          <label>Link nhạc (YouTube hoặc .mp3/.mp4)
            <input className="adm-input" value={f.extra.musicUrl || ''} onChange={(e) => setExtra({ musicUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
          </label>
        </div>

        <h3 className="adm-subhead">Con trỏ chuột <Pm show={Boolean(f.extra.cursorIcon)} /></h3>
        <div className="adm-row">
          <label>Chọn mẫu có sẵn
            <select className="adm-input" value={TEMPLATE_CURSOR_PRESETS.some(([u]) => u === (f.extra.cursorIcon || '')) ? (f.extra.cursorIcon || '') : '__custom'} onChange={(e) => { if (e.target.value !== '__custom') setExtra({ cursorIcon: e.target.value }); }}>
              {TEMPLATE_CURSOR_PRESETS.map(([u, n]) => <option key={u || 'none'} value={u}>{n}</option>)}
              <option value="__custom">Ảnh riêng (bên dưới)</option>
            </select>
          </label>
          <MediaField label="Hoặc tải ảnh con trỏ riêng" kind="image" value={f.extra.cursorIcon} onChange={(u) => setExtra({ cursorIcon: u })} hint="PNG/SVG trong suốt, tối đa 10MB" />
        </div>

        <h3 className="adm-subhead">Hiệu ứng chuột <Pm show={cursorEffect !== ''} /></h3>
        <div className="adm-row">
          <label>Hiệu ứng
            <select className="adm-input" value={cursorEffect} onChange={(e) => setCursorEffect(e.target.value)}>
              {TEMPLATE_CURSOR_EFFECTS.map(([k, v]) => <option key={k || 'none'} value={k}>{k ? '◆ ' : ''}{v}</option>)}
            </select>
          </label>
        </div>
        <small className="adm-muted">Dùng thông số mặc định; muốn tinh chỉnh chi tiết, chỉnh ở Dashboard rồi bấm "Lấy từ hồ sơ của tôi".</small>

        <h3 className="adm-subhead">Hiệu ứng Background <Pm show={f.effect !== 'none'} /></h3>
        <div className="adm-row">
          <label>Hiệu ứng nền
            <select className="adm-input" value={f.effect} onChange={(e) => set({ effect: e.target.value })}>
              {TEMPLATE_EFFECTS.map(([k, v]) => <option key={k} value={k}>{k !== 'none' ? '◆ ' : ''}{v}</option>)}
            </select>
          </label>
        </div>

        <h3 className="adm-subhead">Tùy chỉnh chữ</h3>
        <div className="adm-row">
          <label>Phông chữ
            <select className="adm-input" value={f.font} onChange={(e) => set({ font: e.target.value })}>
              {TEMPLATE_FONTS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
          <label>Cỡ tên ({f.nameScale}%)
            <input type="range" min="60" max="160" value={f.nameScale} onChange={(e) => set({ nameScale: e.target.value })} />
          </label>
          <label>Cỡ mô tả ({f.bioScale}%)
            <input type="range" min="60" max="160" value={f.bioScale} onChange={(e) => set({ bioScale: e.target.value })} />
          </label>
        </div>
        <div className="adm-row">
          <label className="adm-check"><input type="checkbox" checked={f.text3D} onChange={(e) => set({ text3D: e.target.checked })} /> Chữ nổi 3D</label>
          <label className="adm-check"><input type="checkbox" checked={f.glowUsername} onChange={(e) => set({ glowUsername: e.target.checked })} /> Phát sáng tên</label>
          <label className="adm-check"><input type="checkbox" checked={f.glowSocials} onChange={(e) => set({ glowSocials: e.target.checked })} /> Phát sáng icon</label>
          <label className="adm-check"><input type="checkbox" checked={f.glowBadges} onChange={(e) => set({ glowBadges: e.target.checked })} /> Phát sáng huy hiệu</label>
        </div>

        <details className="adm-details">
          <summary>Màu sắc &amp; tùy chọn nâng cao</summary>
          <div className="adm-row">
            <ColorField label="Màu thẻ" value={f.cardColor} onChange={(v) => set({ cardColor: v })} />
            <ColorField label="Màu nhấn / dây đeo" value={f.strapColor} onChange={(v) => set({ strapColor: v })} />
            <ColorField label="Màu chữ" value={f.textColor} onChange={(v) => set({ textColor: v })} />
            <ColorField label="Màu nền" value={f.bgColor} onChange={(v) => set({ bgColor: v })} />
            <ColorField label="Màu icon" value={f.iconColor} onChange={(v) => set({ iconColor: v })} />
          </div>
          <div className="adm-row">
            <label>Độ trong suốt thẻ ({f.profileOpacity})
              <input type="range" min="0" max="100" value={f.profileOpacity} onChange={(e) => set({ profileOpacity: e.target.value })} />
            </label>
            <label>Độ mờ thẻ ({f.profileBlur})
              <input type="range" min="0" max="100" value={f.profileBlur} onChange={(e) => set({ profileBlur: e.target.value })} />
            </label>
            <label className="adm-check"><input type="checkbox" checked={f.profileGradient} onChange={(e) => set({ profileGradient: e.target.checked })} /> Nền chuyển sắc</label>
            {f.profileGradient && (
              <>
                <ColorField label="Màu chuyển 1" value={f.gradientFrom} onChange={(v) => set({ gradientFrom: v })} />
                <ColorField label="Màu chuyển 2" value={f.gradientTo} onChange={(v) => set({ gradientTo: v })} />
              </>
            )}
          </div>
          <div className="adm-row">
            <MediaField label="Ảnh nền" kind="image" value={f.extra.backgroundImage} onChange={(u) => setExtra({ backgroundImage: u })} hint="Tối đa 10MB" />
            <MediaField label="Ảnh bìa" kind="image" value={f.extra.coverImage} onChange={(u) => setExtra({ coverImage: u })} hint="Tối đa 10MB" />
          </div>
        </details>

        <div className="adm-row">
          <label className="adm-check"><input type="checkbox" checked={f.published} onChange={(e) => set({ published: e.target.checked })} /> Xuất bản (hiện ở trang Template của người dùng)</label>
          <label className="adm-check"><input type="checkbox" checked={f.premium} onChange={(e) => set({ premium: e.target.checked })} /> Ép là Premium</label>
        </div>
        {premiumReasons.length > 0 && (
          <div className="adm-note"><Pm /> Template sẽ là <b>Premium</b> vì dùng: {premiumReasons.join(', ')}.</div>
        )}

        <div className="adm-row">
          <button type="submit" className="adm-btn" disabled={busy || (!f.nameVi.trim() && !f.nameEn.trim())}>
            {editing ? 'Lưu thay đổi' : 'Thêm mẫu'}
          </button>
        </div>
        {msg && <div className={msg.ok ? 'adm-ok' : 'adm-error'}>{msg.text}</div>}
      </form>

      <div className="adm-card">
        <div className="adm-card-head">
          <h2>Mẫu đang có <span className="adm-count">{data.templates.length}</span></h2>
          <button type="button" className="adm-btn ghost" onClick={reload}>Làm mới</button>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table static">
            <thead><tr><th>Xem trước</th><th>Tên</th><th>Hashtag</th><th>Từ khóa</th><th>Trạng thái</th><th>Loại</th><th>Ngày tạo</th><th /></tr></thead>
            <tbody>
              {data.templates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="adm-swatch" style={{ background: (t.preview && t.preview.bg) || '#111' }}>
                      <i style={{ background: (t.preview && t.preview.card) || '#222' }} />
                    </span>
                  </td>
                  <td><b>{(t.name && (t.name.vi || t.name.en)) || t.id}</b></td>
                  <td>{(t.tags || []).map((x) => `#${x}`).join(' ') || '—'}</td>
                  <td>{(t.keywords || []).join(', ') || '—'}</td>
                  <td><span className={`adm-tag ${t.published === false ? 'warn' : 'ok'}`}>{t.published === false ? 'Nháp' : 'Đã xuất bản'}</span></td>
                  <td><span className={`adm-tag ${t.premium ? 'warn' : 'ok'}`}>{t.premium ? 'Premium' : 'Miễn phí'}</span></td>
                  <td>{fmt(t.createdAt)}</td>
                  <td>
                    <button type="button" className="adm-btn ghost small" onClick={() => { setF(templateToForm(t)); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Sửa</button>{' '}
                    <button type="button" className="adm-btn danger small" onClick={() => remove(t)}>Xóa</button>
                  </td>
                </tr>
              ))}
              {!data.templates.length && <tr><td colSpan={8} className="adm-muted">Chưa có mẫu nào — hãy thêm mẫu đầu tiên ở form phía trên.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="adm-note">Mẫu hiển thị ngay ở trang Mẫu của người dùng. Người dùng bấm "Dùng mẫu" thì các thiết lập trên được áp dụng vào hồ sơ của họ.</p>
      </div>
    </section>
  );
}

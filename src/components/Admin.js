import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lastNDays } from '../utils/dateKey';
import ViewsChart from './ViewsChart';
import UserMenu from './UserMenu';
import './Admin.css';

const TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'users', label: 'Tài khoản' },
  { id: 'codes', label: 'Mã mời' },
  { id: 'event', label: 'Sự kiện & quà' }
];

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
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    let cancelled = false;
    adminCall({ action: 'whoami' })
      .then((r) => !cancelled && setAllowed(Boolean(r.admin)))
      .catch(() => !cancelled && setAllowed(false));
    return () => {
      cancelled = true;
    };
  }, [adminCall]);

  if (allowed === null) return <div className="adm-loading">Đang kiểm tra quyền…</div>;
  if (!allowed) return <Navigate to="/dashboard" replace />;

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
  const [series, setSeries] = useState('views');
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
    ['Tổng lượt xem hồ sơ', t.totalViews],
    ['Lượt nhập mã mời', t.invitesRedeemed]
  ];
  const SERIES = [
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
        <p className="adm-note">Chỉ có dữ liệu lượt xem hồ sơ, đăng ký và tạo hồ sơ. Lượt truy cập trang chủ chưa được ghi nhận.</p>
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

            <h3>Hồ sơ ({data.profiles.length})</h3>
            {data.profiles.map((p) => (
              <details key={p.id} className="adm-profile">
                <summary>
                  <span>@{p.username || '(chưa đặt)'} · {p.displayName || '—'} · {(p.viewCount || 0).toLocaleString()} lượt xem</span>
                  <button type="button" className="adm-btn danger small" disabled={busy === 'profile'} onClick={(e) => { e.preventDefault(); deleteProfile(p); }}>Xóa hồ sơ</button>
                </summary>
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

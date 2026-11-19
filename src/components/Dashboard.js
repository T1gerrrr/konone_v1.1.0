import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { t } from '../translations';
import { PLATFORM_BY_KEY } from '../constants/socialPlatforms';
import { TOPICS } from '../chat/answers';
import { lastNDays } from '../utils/dateKey';
import ViewsChart from './ViewsChart';
import { FEATURES } from '../constants/features';
import AccountSettings from './AccountSettings';
import UserMenu from './UserMenu';
import './Dashboard.css';

const Icon = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  ),
  links: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  premium: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  templates: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  guide: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  avg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </svg>
  )
};

const LAYOUT_NAMES = {
  card: { vi: 'Basic (Thẻ)', en: 'Basic (Card)' },
  lanyard: { vi: 'Dây thẻ', en: 'Lanyard' },
  web: { vi: 'Web', en: 'Web' },
  modern: { vi: 'Modern', en: 'Modern' }
};

function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function Dashboard() {
  const { currentUser, sendVerificationEmail } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [emailStatus, setEmailStatus] = useState(null);
  const [range, setRange] = useState(7);
  const [chartView, setChartView] = useState('chart');
  const [openTopic, setOpenTopic] = useState(TOPICS[0]?.id || null);
  const [copied, setCopied] = useState('');

  const L = (vi, en) => (language === 'vi' ? vi : en);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          setProfile({ id: querySnapshot.docs[0].id, ...profileData });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  async function handleResendVerificationEmail() {
    if (!currentUser) return;
    try {
      setEmailStatus({ type: 'loading', message: t(language, 'dashboard.sendingEmail') });
      await sendVerificationEmail(currentUser, {
        url: window.location.origin + '/dashboard',
        handleCodeInApp: false
      });
      setEmailStatus({
        type: 'success',
        message: t(language, 'dashboard.emailSent', { email: currentUser.email })
      });
      setTimeout(() => setEmailStatus(null), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
      setEmailStatus({
        type: 'error',
        message: t(language, 'dashboard.emailError', { message: error.message, code: error.code })
      });
    }
  }

  function copyText(text, key) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1600);
  }

  const profileLink = profile?.username ? `${window.location.origin}/${profile.username}` : null;

  // ===== Số liệu =====
  const stats = useMemo(() => {
    const byDay = profile?.viewsByDay || {};
    const last60 = lastNDays(byDay, 60);
    const sum = (arr) => arr.reduce((s, d) => s + d.value, 0);
    const last7 = sum(last60.slice(-7));
    const prev7 = sum(last60.slice(-14, -7));
    const last30 = sum(last60.slice(-30));
    const today = last60[last60.length - 1].value;
    const yesterday = last60[last60.length - 2].value;
    const delta = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;
    const trackedDays = Object.keys(byDay).length;
    return { last60, last7, prev7, last30, today, yesterday, delta, trackedDays };
  }, [profile]);

  const chartData = stats.last60.slice(-range);
  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);
  const peak = chartData.reduce((best, d) => (d.value > (best?.value || 0) ? d : best), null);

  const socialEntries = Object.entries(profile?.socialLinks || {}).filter(([, v]) => Boolean(v && String(v).trim()));
  const customLinks = Array.isArray(profile?.customLinks) ? profile.customLinks.filter((c) => c?.url) : [];
  const linkCount = socialEntries.length + customLinks.length;

  const premiumUntil = toDate(profile?.premiumExpiresAt);
  const isPremium = Boolean(profile?.isPremium && premiumUntil && premiumUntil > new Date());
  const createdAt = toDate(profile?.createdAt);

  const checklist = profile
    ? [
        { ok: Boolean(profile.displayName), label: L('Tên hiển thị', 'Display name') },
        { ok: Boolean(profile.avatar), label: L('Ảnh đại diện', 'Avatar') },
        { ok: Boolean(profile.bio), label: L('Mô tả (bio)', 'Bio') },
        { ok: Boolean(profile.backgroundImage || profile.coverImage), label: L('Ảnh nền / ảnh bìa', 'Background / cover') },
        { ok: linkCount > 0, label: L('Liên kết mạng xã hội', 'Social links') },
        { ok: Boolean(profile.musicUrl), label: L('Nhạc nền', 'Background music') }
      ]
    : [];
  const doneCount = checklist.filter((c) => c.ok).length;
  const completion = checklist.length ? Math.round((doneCount / checklist.length) * 100) : 0;

  const fmtDate = (d) =>
    d ? d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  if (loading) {
    return <div className="dashboard-loading">{t(language, 'dashboard.loading')}</div>;
  }

  const NAV = [
    { id: 'overview', label: L('Tổng quan', 'Overview'), icon: Icon.overview },
    { id: 'edit', label: L('Chỉnh sửa', 'Customize'), icon: Icon.edit, to: '/edit-profile' },
    { id: 'links', label: 'Links', icon: Icon.links, to: '/links' },
    { id: 'premium', label: 'Premium', icon: Icon.premium, to: '/premium' },
    { id: 'leaderboard', label: L('Xếp hạng', 'Leaderboard'), icon: Icon.trend, to: '/leaderboard' },
    ...(FEATURES.profileTemplate
      ? [{ id: 'templates', label: L('Mẫu', 'Templates'), icon: Icon.templates, to: '/profile-template' }]
      : []),
    { id: 'guide', label: L('Hướng dẫn', 'Guide'), icon: Icon.guide },
    { id: 'account', label: L('Tài khoản', 'Account'), icon: Icon.edit }
  ];

  const pageTitle =
    activeSection === 'guide'
      ? L('Hướng dẫn', 'Guide')
      : activeSection === 'account'
        ? L('Tài khoản & quyền riêng tư', 'Account & privacy')
        : L('Tổng quan', 'Overview');

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <img src="/logo-konone-v1.png" alt="KonOne Logo" className="sidebar-logo-img" />
            <span className="logo-text">KONONE</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => (item.to ? navigate(item.to) : setActiveSection(item.id))}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              {item.id === 'premium' && isPremium && <span className="nav-pill">PRO</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-btn page-btn"
            onClick={() => profileLink && window.open(profileLink, '_blank')}
            disabled={!profileLink}
          >
            <span className="btn-icon">{Icon.external}</span>
            {t(language, 'dashboard.myPage')}
          </button>
          <button className="sidebar-btn share-btn" onClick={() => copyText(profileLink, 'share')} disabled={!profileLink}>
            <span className="btn-icon">{copied === 'share' ? Icon.check : Icon.share}</span>
            {copied === 'share' ? L('Đã sao chép link!', 'Link copied!') : t(language, 'dashboard.shareProfile')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>{pageTitle}</h1>
          <div className="header-actions">
            <div className="language-selector">
              <select value={language} onChange={(e) => changeLanguage(e.target.value)} className="language-select">
                <option value="vi">{t(language, 'dashboard.vietnamese')}</option>
                <option value="en">{t(language, 'dashboard.english')}</option>
              </select>
            </div>
            <UserMenu profile={profile} afterLogout="/login" />
          </div>
        </div>

        <div className="dashboard-content">
          {activeSection === 'overview' && (
            <section className="db-overview">
              {/* Lời chào + link hồ sơ */}
              <div className="db-hero">
                <div className="db-hero-id">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="" className="db-hero-avatar" />
                  ) : (
                    <div className="db-hero-avatar db-hero-avatar-fallback">
                      {(profile?.displayName || profile?.username || currentUser.email || 'K').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2>
                      {L('Xin chào', 'Hello')}, {profile?.displayName || profile?.username || L('bạn', 'there')}
                    </h2>
                    {profileLink ? (
                      <button type="button" className="db-link-pill" onClick={() => copyText(profileLink, 'link')}>
                        <span>{profileLink.replace(/^https?:\/\//, '')}</span>
                        {copied === 'link' ? Icon.check : Icon.copy}
                      </button>
                    ) : (
                      <p className="db-muted">{L('Bạn chưa tạo hồ sơ.', 'You have not created a profile yet.')}</p>
                    )}
                  </div>
                </div>
                <div className="db-hero-actions">
                  <button type="button" className="db-btn primary" onClick={() => navigate('/edit-profile')}>
                    {Icon.edit}
                    {profile?.username ? L('Chỉnh sửa hồ sơ', 'Edit profile') : L('Tạo hồ sơ', 'Create profile')}
                  </button>
                  {profileLink && (
                    <button type="button" className="db-btn" onClick={() => window.open(profileLink, '_blank')}>
                      {Icon.external}
                      {L('Xem trang', 'View page')}
                    </button>
                  )}
                </div>
              </div>

              {/* KPI */}
              <div className="db-kpis">
                <div className="db-kpi">
                  <div className="db-kpi-head">
                    <span className="db-kpi-ico">{Icon.eye}</span>
                    {L('Tổng lượt xem', 'Total views')}
                  </div>
                  <div className="db-kpi-value">{(profile?.viewCount || 0).toLocaleString()}</div>
                  <div className="db-kpi-sub">{L('Từ khi tạo hồ sơ', 'All time')}</div>
                </div>
                <div className="db-kpi">
                  <div className="db-kpi-head">
                    <span className="db-kpi-ico">{Icon.calendar}</span>
                    {L('Hôm nay', 'Today')}
                  </div>
                  <div className="db-kpi-value">{stats.today.toLocaleString()}</div>
                  <div className="db-kpi-sub">
                    {L('Hôm qua', 'Yesterday')}: {stats.yesterday.toLocaleString()}
                  </div>
                </div>
                <div className="db-kpi">
                  <div className="db-kpi-head">
                    <span className="db-kpi-ico">{Icon.trend}</span>
                    {L('7 ngày qua', 'Last 7 days')}
                  </div>
                  <div className="db-kpi-value">{stats.last7.toLocaleString()}</div>
                  <div className="db-kpi-sub">
                    {stats.delta === null ? (
                      L('Chưa đủ dữ liệu để so sánh', 'Not enough data to compare')
                    ) : (
                      <span className={`db-delta ${stats.delta >= 0 ? 'up' : 'down'}`}>
                        {stats.delta >= 0 ? '▲' : '▼'} {Math.abs(stats.delta)}%{' '}
                        <span className="db-muted">{L('so với 7 ngày trước', 'vs previous 7 days')}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="db-kpi">
                  <div className="db-kpi-head">
                    <span className="db-kpi-ico">{Icon.avg}</span>
                    {L('Trung bình / ngày', 'Avg / day')}
                  </div>
                  <div className="db-kpi-value">{(stats.last30 / 30).toFixed(1)}</div>
                  <div className="db-kpi-sub">{L('Tính trong 30 ngày', 'Over 30 days')}</div>
                </div>
              </div>

              {/* Biểu đồ lượt xem */}
              <div className="db-card">
                <div className="db-card-head">
                  <div>
                    <h3>{L('Lượt xem theo ngày', 'Daily views')}</h3>
                    <p className="db-muted">
                      {chartTotal.toLocaleString()} {L('lượt xem trong', 'views in the last')} {range} {L('ngày qua', 'days')}
                      {peak && peak.value > 0 && (
                        <>
                          {' · '}
                          {L('Cao nhất', 'Peak')}: {peak.value} ({peak.date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })})
                        </>
                      )}
                    </p>
                  </div>
                  <div className="db-controls">
                    <div className="db-seg">
                      {[7, 14, 30].map((r) => (
                        <button key={r} type="button" className={range === r ? 'active' : ''} onClick={() => setRange(r)}>
                          {r} {L('ngày', 'days')}
                        </button>
                      ))}
                    </div>
                    <div className="db-seg">
                      <button type="button" className={chartView === 'chart' ? 'active' : ''} onClick={() => setChartView('chart')}>
                        {L('Biểu đồ', 'Chart')}
                      </button>
                      <button type="button" className={chartView === 'table' ? 'active' : ''} onClick={() => setChartView('table')}>
                        {L('Bảng', 'Table')}
                      </button>
                    </div>
                  </div>
                </div>

                {chartView === 'chart' ? (
                  <ViewsChart data={chartData} language={language} />
                ) : (
                  <div className="db-table-wrap">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>{L('Ngày', 'Date')}</th>
                          <th>{L('Lượt xem', 'Views')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...chartData].reverse().map((d) => (
                          <tr key={d.key}>
                            <td>{fmtDate(d.date)}</td>
                            <td>{d.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {stats.trackedDays === 0 && (
                  <p className="db-note">
                    {L(
                      'Thống kê theo ngày bắt đầu được ghi nhận từ hôm nay. Tổng lượt xem trước đó vẫn được giữ ở ô "Tổng lượt xem".',
                      'Daily stats start recording from today. Earlier views are still counted in "Total views".'
                    )}
                  </p>
                )}
              </div>

              <div className="db-grid-2">
                {/* Thông tin tài khoản */}
                <div className="db-card">
                  <div className="db-card-head">
                    <h3>{L('Thông tin tài khoản', 'Account info')}</h3>
                  </div>
                  <dl className="db-info">
                    <div>
                      <dt>{L('Tên người dùng', 'Username')}</dt>
                      <dd>{profile?.username ? `@${profile.username}` : '—'}</dd>
                    </div>
                    <div>
                      <dt>{L('Tên hiển thị', 'Display name')}</dt>
                      <dd>{profile?.displayName || '—'}</dd>
                    </div>
                    <div>
                      <dt>UID</dt>
                      <dd>
                        <button type="button" className="db-copy" onClick={() => copyText(currentUser.uid, 'uid')} title={currentUser.uid}>
                          <code>{currentUser.uid}</code>
                          {copied === 'uid' ? Icon.check : Icon.copy}
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>
                        {currentUser.email}
                        <span className={`db-tag ${currentUser.emailVerified ? 'ok' : 'warn'}`}>
                          {currentUser.emailVerified ? L('Đã xác minh', 'Verified') : L('Chưa xác minh', 'Unverified')}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>{L('Bố cục', 'Layout')}</dt>
                      <dd>{(LAYOUT_NAMES[profile?.layout || 'card'] || LAYOUT_NAMES.card)[language === 'vi' ? 'vi' : 'en']}</dd>
                    </div>
                    <div>
                      <dt>{L('Gói', 'Plan')}</dt>
                      <dd>
                        {isPremium ? (
                          <span className="db-tag pro">
                            Premium · {L('đến', 'until')} {fmtDate(premiumUntil)}
                          </span>
                        ) : (
                          <>
                            {L('Miễn phí', 'Free')}
                            <button type="button" className="db-inline-link" onClick={() => navigate('/premium')}>
                              {L('Nâng cấp', 'Upgrade')}
                            </button>
                          </>
                        )}
                      </dd>
                    </div>
                    {createdAt && (
                      <div>
                        <dt>{L('Ngày tạo', 'Created')}</dt>
                        <dd>{fmtDate(createdAt)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Độ hoàn thiện hồ sơ */}
                <div className="db-card">
                  <div className="db-card-head">
                    <h3>{L('Độ hoàn thiện hồ sơ', 'Profile completeness')}</h3>
                    <strong className="db-percent">{completion}%</strong>
                  </div>
                  <div className="db-progress" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                    <div className="db-progress-fill" style={{ width: `${completion}%` }} />
                  </div>
                  <ul className="db-checklist">
                    {checklist.map((c) => (
                      <li key={c.label} className={c.ok ? 'ok' : ''}>
                        <span className="db-check">{c.ok ? Icon.check : null}</span>
                        <span>{c.label}</span>
                        {!c.ok && (
                          <button type="button" className="db-inline-link" onClick={() => navigate(c.label === L('Liên kết mạng xã hội', 'Social links') ? '/links' : '/edit-profile')}>
                            {L('Thêm', 'Add')}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Mạng xã hội + vị trí hiển thị */}
              {profile && (
                <div className="db-card db-socials">
                  <div className="db-socials-left">
                    <div className="db-card-head">
                      <h3>
                        {L('Liên kết', 'Links')} <span className="db-muted">({linkCount})</span>
                      </h3>
                      <button type="button" className="db-inline-link" onClick={() => navigate('/links')}>
                        {L('+ Quản lý Links', '+ Manage Links')}
                      </button>
                    </div>
                    <div className="db-social-icons">
                      {socialEntries.map(([key, val]) => {
                        const p = PLATFORM_BY_KEY[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            className="db-social-ico"
                            onClick={() => navigate('/links')}
                            title={`${p ? p.name : key}: ${val}`}
                            style={{ color: p?.color || '#ffffff' }}
                          >
                            {p ? p.icon : key.slice(0, 2).toUpperCase()}
                          </button>
                        );
                      })}
                      {customLinks.map((c) => (
                        <button
                          key={c.id || c.url}
                          type="button"
                          className="db-social-ico"
                          onClick={() => navigate('/links')}
                          title={`${c.label || L('Liên kết riêng', 'Custom URL')}: ${c.url}`}
                        >
                          {Icon.globe}
                        </button>
                      ))}
                      {linkCount === 0 && (
                        <span className="db-muted">
                          {L('Chưa có liên kết nào — bấm "+ Quản lý Links" để thêm', 'No links yet — click "+ Manage Links" to add')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="db-socials-right">
                    <span className="db-muted">{L('Vị trí hiển thị', 'Display position')}</span>
                    <div className="db-seg">
                      {['inside', 'outside'].map((pos) => {
                        const active = (profile.socialPosition || 'inside') === pos;
                        return (
                          <button
                            key={pos}
                            type="button"
                            className={active ? 'active' : ''}
                            onClick={async () => {
                              setProfile((prev) => ({ ...prev, socialPosition: pos }));
                              if (profile.id) {
                                try {
                                  await updateDoc(doc(db, 'profiles', profile.id), { socialPosition: pos });
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }}
                          >
                            {pos === 'inside' ? L('Bên trong thẻ', 'Inside card') : L('Bên ngoài thẻ', 'Outside card')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Email chưa xác minh */}
              {currentUser && !currentUser.emailVerified && (
                <section className="email-verification-alert">
                  <div className="alert-content">
                    <span className="alert-icon">📧</span>
                    <div className="alert-text">
                      <strong>{t(language, 'dashboard.emailNotVerified')}</strong>
                      <p>{t(language, 'dashboard.checkEmail', { email: currentUser.email })}</p>
                      <p className="alert-note">{t(language, 'dashboard.checkSpam')}</p>
                    </div>
                  </div>
                  {emailStatus && <div className={`email-status ${emailStatus.type}`}>{emailStatus.message}</div>}
                  <button
                    onClick={handleResendVerificationEmail}
                    className="resend-verification-btn"
                    disabled={emailStatus?.type === 'loading'}
                  >
                    {emailStatus?.type === 'loading'
                      ? t(language, 'dashboard.sendingEmail')
                      : t(language, 'dashboard.resendEmail')}
                  </button>
                </section>
              )}
            </section>
          )}

          {activeSection === 'account' && <AccountSettings profile={profile} />}

          {activeSection === 'guide' && (
            <section className="db-guide">
              <p className="db-muted db-guide-intro">
                {L(
                  'Chọn một chủ đề để xem hướng dẫn. Bạn cũng có thể hỏi nhanh qua khung chat ở góc dưới bên phải.',
                  'Pick a topic to read the guide. You can also ask through the chat box at the bottom right.'
                )}
              </p>
              <div className="db-guide-list">
                {TOPICS.map((topic) => {
                  const open = openTopic === topic.id;
                  const lang = language === 'vi' ? 'vi' : 'en';
                  return (
                    <div key={topic.id} className={`db-guide-item ${open ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="db-guide-q"
                        aria-expanded={open}
                        onClick={() => setOpenTopic(open ? null : topic.id)}
                      >
                        <span>{topic.label[lang]}</span>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {open && (
                        <div className="db-guide-a">
                          {(topic.answer?.[lang] || []).map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                          {Array.isArray(topic.links) && topic.links.length > 0 && (
                            <div className="db-guide-links">
                              {topic.links.map((lnk) =>
                                lnk.to ? (
                                  <Link key={lnk.to} to={lnk.to} className="db-inline-link">
                                    {lnk.label?.[lang] || lnk.to} →
                                  </Link>
                                ) : null
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppSidebar from './AppSidebar';
import UserMenu from './UserMenu';
import './ProfileEditor.css';
import './Invite.css';

// Ảnh poster đứng bên phải — đặt file vào public/ rồi sửa đường dẫn này (để '' sẽ hiện khung chờ)
const POSTERS = [
  { src: '/ytevent.webp', alt: 'YouTube Premium event' },
  { src: '/spotifyevent.webp', alt: 'Spotify Premium event' }
];
const POSTER_INTERVAL = 5000;

const ERROR_VI = {
  'invite/invalid': 'Mã mời không hợp lệ.',
  'invite/not-found': 'Mã mời không tồn tại.',
  'invite/own-code': 'Bạn không thể nhập mã của chính mình.',
  'invite/already-redeemed': 'Bạn đã nhập mã mời rồi.',
  'invite/email-not-verified': 'Vui lòng xác minh email trước khi nhập mã mời.',
  'invite/profile-required': 'Bạn cần tạo hồ sơ public trước khi dùng mã mời.'
};
const ERROR_EN = {
  'invite/invalid': 'Invalid invite code.',
  'invite/not-found': 'This invite code does not exist.',
  'invite/own-code': 'You cannot use your own code.',
  'invite/already-redeemed': 'You have already used an invite code.',
  'invite/email-not-verified': 'Please verify your email before using an invite code.',
  'invite/profile-required': 'You need a public profile before using invite codes.'
};

export default function Invite() {
  const { currentUser, getInviteInfo, redeemInviteCode } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);

  const [profile, setProfile] = useState(null);
  const [info, setInfo] = useState(null); // { code, uses, redeemedCode }
  const [loadError, setLoadError] = useState(null); // null | { code, message }
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'ok' | 'error', text }
  const [copied, setCopied] = useState(false);
  const [justRedeemed, setJustRedeemed] = useState(false);
  const [posterIdx, setPosterIdx] = useState(0);
  const [posterPaused, setPosterPaused] = useState(false);

  // Tự chuyển poster mỗi 5 giây (đặt lại bộ đếm khi bấm chấm; tạm dừng khi rê chuột)
  useEffect(() => {
    if (posterPaused || POSTERS.length < 2) return undefined;
    const id = setTimeout(() => setPosterIdx((i) => (i + 1) % POSTERS.length), POSTER_INTERVAL);
    return () => clearTimeout(id);
  }, [posterIdx, posterPaused]);

  useEffect(() => {
    let cancelled = false;
    getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid), limit(1)))
      .then((snap) => {
        if (!cancelled && !snap.empty) setProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
      })
      .catch(() => {});
    getInviteInfo()
      .then((data) => !cancelled && setInfo(data))
      .catch((err) => {
        console.error('Load invite info failed:', err);
        if (!cancelled) setLoadError({ code: err.code || '', message: err.message || '' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  function copyCode() {
    if (!info?.code) return;
    navigator.clipboard?.writeText(info.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleRedeem(e) {
    e.preventDefault();
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await redeemInviteCode(input);
      setInfo((prev) => ({ ...(prev || {}), redeemedCode: res.redeemedCode }));
      setInput('');
      setFeedback({ type: 'ok', text: L('Nhập mã mời thành công!', 'Invite code applied!') });
      setJustRedeemed(true);
      setTimeout(() => {
        setJustRedeemed(false);
        setFeedback(null);
      }, 3000);
    } catch (err) {
      const table = language === 'vi' ? ERROR_VI : ERROR_EN;
      setFeedback({ type: 'error', text: table[err.code] || err.message || L('Có lỗi xảy ra.', 'Something went wrong.') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="profile-editor-layout">
      <AppSidebar active="invite" profile={profile} />
      <main className="editor-main invite-main">
        <div className="invite-topbar">
          <h1>{L('Mã mời', 'Invite code')}</h1>
          <UserMenu profile={profile} afterLogout="/login" />
        </div>

        <div className="invite-grid">
          <div className="invite-col">
            {/* Tổng quan */}
            <section className="invite-hero">
              <div className="invite-hero-id">
                <div className="invite-avatar">
                  {profile?.avatar ? <img src={profile.avatar} alt="" /> : <span>{(profile?.displayName || profile?.username || currentUser.email || 'K').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div className="invite-hero-name">{profile?.displayName || profile?.username || currentUser.email}</div>
                  <div className="invite-muted invite-hero-sub">{L('Mời bạn bè tạo hồ sơ để nhận quà Premium', 'Invite friends to create profiles and earn Premium gifts')}</div>
                </div>
              </div>
              <div className="invite-stats">
                <div className="invite-stat-tile">
                  <span>{L('Lượt mời', 'Invites')}</span>
                  <strong>{info ? info.uses || 0 : '—'}</strong>
                </div>
                <div className="invite-stat-tile">
                  <span>{L('Mã đã nhập', 'Code used')}</span>
                  <strong>{info?.redeemedCode ? '✓' : '—'}</strong>
                </div>
              </div>
            </section>

            {loadError?.code === 'invite/profile-required' && (
              <section className="invite-card invite-gate">
                <h2>{L('Tạo hồ sơ public để dùng mã mời', 'Create a public profile to use invites')}</h2>
                <p className="invite-muted">{L('Bạn cần có hồ sơ public (đã đặt tên người dùng, không ẩn) mới lấy được mã và nhập mã mời.', 'You need a public profile (with a username, not hidden) to get and use invite codes.')}</p>
                <Link to="/edit-profile" className="invite-btn invite-link">{L('Tạo hồ sơ', 'Create profile')}</Link>
              </section>
            )}

            {/* Mã của tôi */}
            {loadError?.code !== 'invite/profile-required' && (
            <section className="invite-card">
              <div className="invite-card-head">
                <span className="invite-step">1</span>
                <div>
                  <h2>{L('Mã của tôi', 'My code')}</h2>
                  <p className="invite-muted">{L('Chia sẻ mã này cho bạn bè khi họ đăng ký.', 'Share this code with friends when they sign up.')}</p>
                </div>
              </div>
              {loadError ? (
                <div className="invite-feedback error">
                  {loadError.code === 'http/404' || loadError.code === 'http/405'
                    ? L('Máy chủ API chưa chạy hoặc chưa được triển khai (/api/invite). Hãy chạy bằng "vercel dev" hoặc deploy lên Vercel.', 'The API server is not running or not deployed (/api/invite). Run "vercel dev" or deploy to Vercel.')
                    : L('Không tải được mã mời', 'Could not load your code')}
                  {loadError.code ? ` (${loadError.code})` : ''}
                  <button type="button" className="invite-retry" onClick={() => window.location.reload()}>{L('Thử lại', 'Retry')}</button>
                </div>
              ) : (
                <div className="invite-mycode">
                  <span className="invite-code">{info?.code || '········'}</span>
                  <button type="button" className="invite-btn ghost" onClick={copyCode} disabled={!info?.code}>
                    {copied ? L('Đã sao chép', 'Copied') : L('Sao chép', 'Copy')}
                  </button>
                </div>
              )}
            </section>
            )}

            {/* Nhập mã — tạm ẩn khi đã nhập 1 lần */}
            {!loadError && (!info?.redeemedCode || justRedeemed) && (
            <section className="invite-card">
              <div className="invite-card-head">
                <span className="invite-step">2</span>
                <div>
                  <h2>{L('Nhập mã mời', 'Enter an invite code')}</h2>
                  <p className="invite-muted">{L('Có người đã mời bạn? Nhập mã của họ vào đây. Mỗi tài khoản chỉ nhập được một lần.', 'Did someone invite you? Enter their code here. Each account can use one code, once.')}</p>
                </div>
              </div>
              {info?.redeemedCode ? (
                <div className="invite-done">
                  {L('Bạn đã dùng mã', 'You used code')} <strong>{info.redeemedCode}</strong>
                </div>
              ) : (
                <form className="invite-form" onSubmit={handleRedeem}>
                  <input
                    className="invite-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value.toUpperCase())}
                    placeholder={L('Nhập mã mời', 'Invite code')}
                    maxLength={12}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button type="submit" className="invite-btn" disabled={!input.trim() || submitting}>
                    {submitting ? L('Đang kiểm tra…', 'Checking…') : L('Xác nhận', 'Apply')}
                  </button>
                </form>
              )}
              {feedback && <div className={`invite-feedback ${feedback.type}`}>{feedback.text}</div>}
            </section>
            )}
          </div>

          <aside className="invite-poster-wrap" aria-label="Poster" onMouseEnter={() => setPosterPaused(true)} onMouseLeave={() => setPosterPaused(false)}>
            <div className="invite-poster">
              {POSTERS.map((po, i) => (
                <img key={po.src} src={po.src} alt={po.alt} className={i === posterIdx ? 'active' : ''} aria-hidden={i !== posterIdx} />
              ))}
            </div>
            {POSTERS.length > 1 && (
              <div className="invite-dots" role="tablist">
                {POSTERS.map((po, i) => (
                  <button
                    key={po.src}
                    type="button"
                    role="tab"
                    aria-selected={i === posterIdx}
                    aria-label={`Poster ${i + 1}`}
                    className={`invite-dot ${i === posterIdx ? 'active' : ''}`}
                    onClick={() => setPosterIdx(i)}
                  />
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

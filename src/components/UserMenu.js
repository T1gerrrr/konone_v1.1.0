import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './UserMenu.css';

const ico = {
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  shield: <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z" />,
  chevron: <polyline points="6 9 12 15 18 9" />
};

function Svg({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// Avatar ở góc phải: bấm mở menu Tài khoản / Mã mời / Đăng xuất
export default function UserMenu({ profile: profileProp, afterLogout = '/' }) {
  const { currentUser, logout, signInMethod, getInviteInfo, adminCall } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [fetched, setFetched] = useState(null);
  const [inviteCount, setInviteCount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const profile = profileProp || fetched;

  // Trang không truyền sẵn hồ sơ (vd. trang chủ) thì tự lấy để có avatar
  useEffect(() => {
    if (profileProp || !currentUser) return undefined;
    let cancelled = false;
    getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid), limit(1)))
      .then((snap) => {
        if (!cancelled && !snap.empty) setFetched(snap.docs[0].data());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profileProp, currentUser]);

  // Số lượt đã dùng mã mời của tôi (hiện cạnh avatar)
  useEffect(() => {
    if (!currentUser) return undefined;
    let cancelled = false;
    getInviteInfo()
      .then((d) => !cancelled && setInviteCount(d.uses || 0))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Tài khoản quản trị mới thấy mục "Quản trị" (server kiểm tra lại mọi thao tác)
  useEffect(() => {
    if (!currentUser) return undefined;
    let cancelled = false;
    adminCall({ action: 'whoami' })
      .then((r) => !cancelled && setIsAdmin(Boolean(r.admin)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentUser, adminCall]);

  // Đóng khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!currentUser) return null;

  const name = profile?.displayName || profile?.username || currentUser.displayName || currentUser.email || 'K';
  const avatarUrl = profile?.avatar || currentUser.photoURL || '';
  const initial = name.charAt(0).toUpperCase();
  const method = signInMethod ? signInMethod(currentUser) : 'password';
  const methodLabel = { password: L('Email & mật khẩu', 'Email & password'), google: 'Google', github: 'GitHub' }[method] || method;

  async function handleLogout() {
    setOpen(false);
    try {
      await logout();
      navigate(afterLogout);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const avatar = avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initial}</span>;

  return (
    <div className="um" ref={rootRef}>
      <div className="um-bar">
      {inviteCount !== null && (
        <button
          type="button"
          className="um-count"
          onClick={() => navigate('/invite')}
          title={L('Lượt mời của bạn', 'Your invites')}
        >
          <Svg>{ico.gift}</Svg>
          <span>{inviteCount}</span>
        </button>
      )}
      <button
        type="button"
        className={`um-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={L('Menu tài khoản', 'Account menu')}
      >
        {avatar}
      </button>
      </div>

      {open && (
        <div className="um-menu" role="menu">
          <div className="um-head">
            <div className="um-head-avatar">{avatar}</div>
            <div className="um-head-text">
              <div className="um-head-name">{name}</div>
              <div className="um-head-sub">{currentUser.email}</div>
            </div>
          </div>

          <button type="button" className="um-item" role="menuitem" onClick={() => setShowAccount((v) => !v)} aria-expanded={showAccount}>
            <Svg>{ico.user}</Svg>
            <span>{L('Tài khoản', 'Account')}</span>
            <span className={`um-chev ${showAccount ? 'open' : ''}`}>
              <Svg>{ico.chevron}</Svg>
            </span>
          </button>
          {showAccount && (
            <dl className="um-account">
              <div>
                <dt>Email</dt>
                <dd>{currentUser.email}</dd>
              </div>
              <div>
                <dt>{L('Tên hiển thị', 'Display name')}</dt>
                <dd>{profile?.displayName || '—'}</dd>
              </div>
              <div>
                <dt>{L('Tên người dùng', 'Username')}</dt>
                <dd>{profile?.username ? `@${profile.username}` : '—'}</dd>
              </div>
              <div>
                <dt>{L('Đăng nhập bằng', 'Sign-in method')}</dt>
                <dd>{methodLabel}</dd>
              </div>
              <div>
                <dt>{L('Email', 'Email')}</dt>
                <dd className={currentUser.emailVerified ? 'ok' : 'warn'}>
                  {currentUser.emailVerified ? L('Đã xác minh', 'Verified') : L('Chưa xác minh', 'Not verified')}
                </dd>
              </div>
            </dl>
          )}

          <button
            type="button"
            className="um-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/invite');
            }}
          >
            <Svg>{ico.gift}</Svg>
            <span>{L('Mã mời', 'Invite code')}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              className="um-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/admin');
              }}
            >
              <Svg>{ico.shield}</Svg>
              <span>{L('Quản trị', 'Admin')}</span>
            </button>
          )}

          <div className="um-sep" />

          <button type="button" className="um-item danger" role="menuitem" onClick={handleLogout}>
            <Svg>{ico.logout}</Svg>
            <span>{L('Đăng xuất', 'Log out')}</span>
          </button>
        </div>
      )}
    </div>
  );
}

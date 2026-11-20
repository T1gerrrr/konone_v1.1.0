import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { FaLanguage } from 'react-icons/fa6';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './SiteHeader.css';

const DISCORD_URL = 'https://discord.gg/YVJSEN3s6v';

// Menu header dạng viên thuốc, nằm giữa, trượt xuống khi tải trang và đi theo khi cuộn
export default function SiteHeader() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const langRef = useRef(null);
  const [userOpen, setUserOpen] = useState(false);
  const [username, setUsername] = useState('');
  const userRef = useRef(null);

  // Lấy tên người dùng để mở "My Page"
  useEffect(() => {
    if (!currentUser) { setUsername(''); return undefined; }
    let cancelled = false;
    getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid), limit(1)))
      .then((snap) => { if (!cancelled && !snap.empty) setUsername(snap.docs[0].data().username || ''); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser]);

  useEffect(() => {
    if (!userOpen) return undefined;
    const onDown = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setUserOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [userOpen]);

  async function handleLogout() {
    setUserOpen(false);
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  // Đóng dropdown khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (lang) => {
    changeLanguage(lang);
    setOpen(false);
  };

  const L = (vi, en) => (language === 'vi' ? vi : en);

  return (
    <header className="site-header">
      <nav className="site-header-pill" aria-label="Main navigation">
        <img src="/logo-konone-v1.png" alt="KonOne" className="site-header-logo" />
        <span className="site-header-sep" aria-hidden="true" />
        <NavLink to="/" end className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}>
          {L('Trang chủ', 'Home')}
        </NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}>
          {L('Xếp hạng', 'Leaderboard')}
        </NavLink>
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="site-header-link">
          Discord
        </a>
        {currentUser ? (
          <div className="site-header-userwrap" ref={userRef}>
            <button
              type="button"
              className={`site-header-link site-header-user${userOpen ? ' open' : ''}`}
              onClick={() => setUserOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={userOpen}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              <span>Dashboard</span>
              <svg className="site-header-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
            </button>
            {userOpen && (
              <ul className="site-header-menu site-header-menu--user" role="menu">
                <li role="none">
                  <button type="button" role="menuitem" className="site-header-option" onClick={() => { setUserOpen(false); navigate('/dashboard'); }}>
                    Dashboard
                  </button>
                </li>
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="site-header-option"
                    onClick={() => {
                      setUserOpen(false);
                      if (username) window.open(`${window.location.origin}/${username}`, '_blank', 'noopener');
                      else navigate('/dashboard');
                    }}
                  >
                    My Page
                  </button>
                </li>
                <li role="none">
                  <button type="button" role="menuitem" className="site-header-option" onClick={() => { setUserOpen(false); navigate('/dashboard?section=account'); }}>
                    Account
                  </button>
                </li>
                <li className="site-header-menu-sep" role="separator" />
                <li role="none">
                  <button type="button" role="menuitem" className="site-header-option danger" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) => `site-header-link${isActive ? ' active' : ''}`}
          >
            {L('Đăng nhập', 'Login')}
          </NavLink>
        )}
        <span className="site-header-sep" aria-hidden="true" />
        <div className="site-header-langwrap" ref={langRef}>
          <button
            type="button"
            className={`site-header-lang${open ? ' open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={L('Ngôn ngữ', 'Language')}
          >
            <FaLanguage />
          </button>
          {open && (
            <ul className="site-header-menu" role="listbox">
              {[['vi', 'Tiếng Việt'], ['en', 'English']].map(([code, label]) => (
                <li key={code} role="option" aria-selected={language === code}>
                  <button
                    type="button"
                    className={`site-header-option${language === code ? ' active' : ''}`}
                    onClick={() => pick(code)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </header>
  );
}

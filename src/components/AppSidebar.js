import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { FEATURES } from '../constants/features';
import './ProfileEditor.css';

// Menu bên trái dùng chung (cùng kiểu với trang Chỉnh sửa / Links)
export default function AppSidebar({ active, profile }) {
  const { language, changeLanguage } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();
  const profileLink = profile?.username ? `${window.location.origin}/${profile.username}` : null;

  const items = [
    {
      id: 'dashboard',
      to: '/dashboard',
      label: L('Bảng điều khiển', 'Dashboard'),
      icon: (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </>
      )
    },
    {
      id: 'edit',
      to: '/edit-profile',
      label: L('Chỉnh sửa', 'Customize'),
      icon: (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </>
      )
    },
    {
      id: 'links',
      to: '/links',
      label: L('Liên kết', 'Links'),
      icon: (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      )
    },
    {
      id: 'premium',
      to: '/premium',
      label: 'Premium',
      icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    },
    {
      id: 'leaderboard',
      to: '/leaderboard',
      label: L('Xếp hạng', 'Leaderboard'),
      icon: (
        <>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </>
      )
    },
    {
      id: 'templates',
      to: '/profile-template',
      hidden: !FEATURES.profileTemplate, // trang Mẫu đang tạm ẩn
      label: L('Mẫu', 'Templates'),
      icon: (
        <>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </>
      )
    }
  ].filter((it) => !it.hidden);

  return (
    <aside className="editor-sidebar" aria-label={L('Menu bên', 'Sidebar Menu')}>
      <div className="sidebar-header">
        <Link to="/" className="editor-brand-link" title={L('Trang chủ KonOne', 'KonOne Home')}>
          <img src="/logo-konone-v1.png" alt="KonOne" className="logo-icon" />
          <span className="logo-text sidebar-reveal">KonOne</span>
        </Link>

        <div className="language-selector-editor sidebar-reveal">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-select-editor"
            aria-label={L('Ngôn ngữ', 'Language')}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((it) => (
          <div
            key={it.id}
            className={`nav-item ${active === it.id ? 'active' : ''}`}
            onClick={() => navigate(it.to)}
            title={it.label}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              {it.icon}
            </svg>
            <span className="sidebar-reveal">{it.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {profileLink && (
          <button
            type="button"
            className="sidebar-btn my-page-btn"
            onClick={() => window.open(profileLink, '_blank')}
            title={L('Trang của tôi', 'My Page')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="sidebar-reveal">{L('Trang của tôi', 'My Page')}</span>
          </button>
        )}

        <div className="user-info-footer">
          <div className="user-avatar-dot">
            {(profile?.displayName || profile?.username || 'K').charAt(0).toUpperCase()}
          </div>
          <div className="user-details sidebar-reveal">
            <div className="user-name">
              {profile?.username ? `@${profile.username}` : L('Chưa có tên người dùng', 'No username')}
            </div>
            <div className="user-views">
              {(profile?.viewCount || 0).toLocaleString()} {L('lượt xem', 'views')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

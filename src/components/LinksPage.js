import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, addDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import { SOCIAL_PLATFORMS, PLATFORM_BY_KEY } from '../constants/socialPlatforms';
import { FREE_LINK_LIMIT, countLinks, isPremiumActive, askUpgrade } from '../constants/premium';
import { notifyError } from '../notify/notify';
import './ProfileEditor.css';
import './LinksPage.css';

export default function LinksPage() {
  const { currentUser } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();

  const [profileId, setProfileId] = useState(null);
  const [profileMeta, setProfileMeta] = useState({ username: '', displayName: '', viewCount: 0 });
  const [socialLinks, setSocialLinks] = useState({});
  const [socialModes, setSocialModes] = useState({});
  const [socialPosition, setSocialPosition] = useState('inside');
  const [customLinks, setCustomLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const linkCount = countLinks(socialLinks, customLinks);
  const atFreeLimit = !isPremium && linkCount >= FREE_LINK_LIMIT;
  const limitName = language === 'vi' ? `Hơn ${FREE_LINK_LIMIT} liên kết` : `More than ${FREE_LINK_LIMIT} links`;

  // Modal state when clicking a platform tile or "Add Custom URL"
  const [activePlatform, setActivePlatform] = useState(null);
  const [modalValue, setModalValue] = useState('');
  const [modalMode, setModalMode] = useState('link');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [editingCustomId, setEditingCustomId] = useState(null);

  useEffect(() => {
    async function loadLinks() {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'profiles'), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data();
          setProfileId(d.id);
          setIsPremium(isPremiumActive(data));
          setProfileMeta({
            username: data.username || '',
            displayName: data.displayName || '',
            viewCount: data.viewCount || 0
          });
          setSocialLinks(data.socialLinks && typeof data.socialLinks === 'object' ? data.socialLinks : {});
          setSocialModes(data.socialModes && typeof data.socialModes === 'object' ? data.socialModes : {});
          setSocialPosition(data.socialPosition === 'outside' ? 'outside' : 'inside');
          setCustomLinks(Array.isArray(data.customLinks) ? data.customLinks : []);
        }
      } catch (err) {
        console.error('Error loading links:', err);
      }
    }
    loadLinks();
  }, [currentUser]);

  async function persistLinks(nextSocialLinks, nextCustomLinks, nextModes = socialModes, nextPos = socialPosition) {
    setSaving(true);
    try {
      if (profileId) {
        await updateDoc(doc(db, 'profiles', profileId), {
          socialLinks: nextSocialLinks,
          socialModes: nextModes,
          socialPosition: nextPos,
          customLinks: nextCustomLinks,
          updatedAt: new Date()
        });
      } else if (currentUser) {
        const ref = await addDoc(collection(db, 'profiles'), {
          userId: currentUser.uid,
          username: currentUser.email ? currentUser.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() : 'user',
          displayName: currentUser.displayName || 'KonOne User',
          socialLinks: nextSocialLinks,
          socialModes: nextModes,
          socialPosition: nextPos,
          customLinks: nextCustomLinks,
          isStub: true, // hồ sơ tạm do trang Links tạo — chưa phải hồ sơ thật
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setProfileId(ref.id);
      }
    } catch (err) {
      console.error('Error saving links:', err);
      notifyError(L('Lỗi khi lưu liên kết: ', 'Error saving links: ') + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleOpenPlatform(platform) {
    const alreadyLinked = Boolean(String(socialLinks[platform.key] || '').trim());
    if (!alreadyLinked && atFreeLimit) {
      askUpgrade(false, limitName, navigate, language);
      return;
    }
    setActivePlatform(platform);
    setModalValue(socialLinks[platform.key] || '');
    setModalMode(socialModes[platform.key] || 'link');
  }

  async function handleSavePlatformModal(e) {
    e.preventDefault();
    if (!activePlatform) return;
    const trimmed = modalValue.trim();
    const nextSocials = { ...socialLinks };
    const nextModes = { ...socialModes };
    if (trimmed) {
      nextSocials[activePlatform.key] = trimmed;
      nextModes[activePlatform.key] = modalMode;
    } else {
      delete nextSocials[activePlatform.key];
      delete nextModes[activePlatform.key];
    }
    setSocialLinks(nextSocials);
    setSocialModes(nextModes);
    setActivePlatform(null);
    await persistLinks(nextSocials, customLinks, nextModes, socialPosition);
  }

  async function handlePositionChange(nextPos) {
    setSocialPosition(nextPos);
    await persistLinks(socialLinks, customLinks, socialModes, nextPos);
  }

  async function handleRemovePlatformLink(key) {
    const nextSocials = { ...socialLinks };
    delete nextSocials[key];
    setSocialLinks(nextSocials);
    await persistLinks(nextSocials, customLinks);
  }

  function handleOpenAddCustom(item = null) {
    if (item) {
      setEditingCustomId(item.id);
      setCustomLabel(item.label || '');
      setCustomUrl(item.url || '');
    } else {
      if (atFreeLimit) {
        askUpgrade(false, limitName, navigate, language);
        return;
      }
      setEditingCustomId(null);
      setCustomLabel('');
      setCustomUrl('');
    }
    setCustomModalOpen(true);
  }

  async function handleSaveCustomModal(e) {
    e.preventDefault();
    const urlTrimmed = customUrl.trim();
    if (!urlTrimmed) return;
    const labelTrimmed = customLabel.trim() || urlTrimmed.replace(/^https?:\/\//i, '').split('/')[0];

    let nextCustom;
    if (editingCustomId) {
      nextCustom = customLinks.map((c) =>
        c.id === editingCustomId ? { ...c, label: labelTrimmed, url: urlTrimmed } : c
      );
    } else {
      nextCustom = [
        ...customLinks,
        { id: `custom_${Date.now()}`, label: labelTrimmed, url: urlTrimmed }
      ];
    }
    setCustomLinks(nextCustom);
    setCustomModalOpen(false);
    await persistLinks(socialLinks, nextCustom);
  }

  async function handleRemoveCustomLink(id) {
    const nextCustom = customLinks.filter((c) => c.id !== id);
    setCustomLinks(nextCustom);
    await persistLinks(socialLinks, nextCustom);
  }

  const profileLink = profileMeta.username ? `${window.location.origin}/${profileMeta.username}` : null;
  const linkedPlatformEntries = Object.entries(socialLinks).filter(([, val]) => Boolean(val && String(val).trim()));

  return (
    <div className="profile-editor-layout">
      {/* MENU BÊN TRÁI đồng bộ với trang Customize */}
      <aside className="editor-sidebar" aria-label={L("Menu bên", "Sidebar Menu")}>
        <div className="sidebar-header">
          <Link to="/" className="editor-brand-link" title={L("Trang chủ KonOne", "KonOne Home")}>
            <img src="/logo-konone-v1.png" alt="KonOne Logo" className="logo-icon" />
            <span className="logo-text sidebar-reveal">KonOne</span>
          </Link>

          <div className="language-selector-editor sidebar-reveal">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="language-select-editor"
            >
              <option value="vi">{t(language, 'profileEditor.vietnamese')}</option>
              <option value="en">{t(language, 'profileEditor.english')}</option>
            </select>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item" onClick={() => navigate('/dashboard')} title={L("Bảng điều khiển", "Dashboard")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className="sidebar-reveal">{L("Bảng điều khiển", "Dashboard")}</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/edit-profile')} title={t(language, 'profileEditor.customize')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="sidebar-reveal">{t(language, 'profileEditor.customize')}</span>
          </div>

          <div className="nav-item active" onClick={() => navigate('/links')} title={L("Liên kết", "Links")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="sidebar-reveal">{L("Liên kết", "Links")}</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/edit-layout')} title={language === 'vi' ? 'Bố cục' : 'Layout'}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="sidebar-reveal">{language === 'vi' ? 'Bố cục' : 'Layout'}</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/premium')} title="Premium">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="sidebar-reveal">Premium</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          {profileLink && (
            <button
              type="button"
              className="sidebar-btn my-page-btn"
              onClick={() => window.open(profileLink, '_blank')}
              title={t(language, 'profileEditor.myPage')}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="sidebar-reveal">{t(language, 'profileEditor.myPage')}</span>
            </button>
          )}

          <div className="user-info-footer">
            <div className="user-avatar-dot">
              {(profileMeta.displayName || profileMeta.username || 'K').charAt(0).toUpperCase()}
            </div>
            <div className="user-details sidebar-reveal">
              <div className="user-name">{profileMeta.username || t(language, 'profileEditor.noUsername')}</div>
              <div className="user-views">👁 {profileMeta.viewCount.toLocaleString()} {t(language, 'profileEditor.views')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH: HỘP CHỌN LINK GIỐNG HỆT ẢNH MẪU */}
      <main className="editor-main">
        <div className="links-page-container">
          <div className="links-picker-card">
            <div className="links-picker-header">
              <h1 className="links-picker-title">
                <svg
                  className="links-chain-ico"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>{L("Liên kết các tài khoản mạng xã hội của bạn.", "Link your social media profiles.")}</span>
              </h1>
              <p className="links-picker-subtitle">{L("Chọn một mạng xã hội để thêm vào hồ sơ.", "Pick a social media to add to your profile.")}</p>
              {!isPremium && (
                <p className="links-limit-note">
                  {language === 'vi'
                    ? `Tài khoản miễn phí: ${linkCount}/${FREE_LINK_LIMIT} liên kết. `
                    : `Free account: ${linkCount}/${FREE_LINK_LIMIT} links. `}
                  <button type="button" onClick={() => navigate('/premium')}>
                    {language === 'vi' ? 'Nâng cấp Premium để thêm không giới hạn' : 'Upgrade to Premium for unlimited links'}
                  </button>
                </p>
              )}
            </div>

            {/* Lưới 12 cột x 4 hàng = 45 icon mạng xã hội */}
            <div className="social-icons-picker-grid">
              {SOCIAL_PLATFORMS.map((platform) => {
                const isLinked = Boolean(socialLinks[platform.key] && String(socialLinks[platform.key]).trim());
                return (
                  <button
                    key={platform.key}
                    type="button"
                    className={`social-picker-tile ${isLinked ? 'is-linked' : ''}`}
                    style={{ color: platform.color }}
                    title={`${platform.name}${isLinked ? ` (${socialLinks[platform.key]})` : ''}`}
                    onClick={() => handleOpenPlatform(platform)}
                  >
                    {platform.icon}
                    {isLinked && <span className="tile-linked-dot" />}
                  </button>
                );
              })}
            </div>

            {/* Nút Add Custom URL + Tùy chọn hiển thị Icon Bên trong thẻ hoặc Bên ngoài thẻ */}
            <div className="links-picker-bottom-bar">
              <button
                type="button"
                className="add-custom-url-btn"
                onClick={() => handleOpenAddCustom(null)}
              >
                <span className="custom-url-globe">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <circle cx="12" cy="12" r="9.5" />
                    <path d="M2.5 12h19" />
                    <path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19z" />
                  </svg>
                </span>
                <span className="custom-url-text">
                  <strong>{L("Thêm liên kết riêng", "Add Custom URL")}</strong>
                  <span>{L("Dùng liên kết của riêng bạn.", "Use your own URL and choose an icon to match.")}</span>
                </span>
              </button>

              <div className="social-position-picker-box">
                <span className="pos-picker-label">
                  {language === 'vi' ? 'Vị trí hiển thị Icon trên Hồ sơ:' : 'Social Icons Position:'}
                </span>
                <div className="pos-segmented-control">
                  <button
                    type="button"
                    className={`pos-seg-btn ${socialPosition === 'inside' ? 'active' : ''}`}
                    onClick={() => handlePositionChange('inside')}
                  >
                    {language === 'vi' ? 'Bên trong thẻ' : 'Inside Card'}
                  </button>
                  <button
                    type="button"
                    className={`pos-seg-btn ${socialPosition === 'outside' ? 'active' : ''}`}
                    onClick={() => handlePositionChange('outside')}
                  >
                    {language === 'vi' ? 'Bên ngoài thẻ' : 'Outside Card'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách các liên kết đã gắn */}
          {(linkedPlatformEntries.length > 0 || customLinks.length > 0) && (
            <div className="active-links-section">
              <div className="active-links-head">
                <h3>
                  {language === 'vi' ? 'Các liên kết đã thêm vào Hồ sơ' : 'Linked Profiles & Custom URLs'}
                </h3>
                <span className="active-links-count">
                  {linkedPlatformEntries.length + customLinks.length}{' '}{L("đang dùng", "active")}
                </span>
              </div>

              <div className="active-links-list">
                {linkedPlatformEntries.map(([key, val]) => {
                  const p = PLATFORM_BY_KEY[key] || {
                    key,
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    color: '#ffffff',
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )
                  };
                  return (
                    <div className="active-link-row" key={key}>
                      <div className="active-link-left">
                        <div className="active-link-ico" style={{ color: p.color }}>
                          {p.icon}
                        </div>
                        <div className="active-link-meta">
                          <strong>{p.name}</strong>
                          <a
                            href={String(val).startsWith('http') || String(val).startsWith('mailto:') ? val : `https://${val}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {val}
                          </a>
                        </div>
                      </div>
                      <div className="active-link-actions">
                        <button
                          type="button"
                          className="link-row-btn"
                          onClick={() => handleOpenPlatform(p)}
                        >
                          {language === 'vi' ? 'Sửa' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          className="link-row-btn danger"
                          onClick={() => handleRemovePlatformLink(key)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}

                {customLinks.map((item) => (
                  <div className="active-link-row" key={item.id}>
                    <div className="active-link-left">
                      <div className="active-link-ico" style={{ color: '#e4e4e7' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M3 12h18" />
                          <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
                        </svg>
                      </div>
                      <div className="active-link-meta">
                        <strong>{item.label || L('Liên kết riêng', 'Custom URL')}</strong>
                        <a
                          href={String(item.url).startsWith('http') ? item.url : `https://${item.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.url}
                        </a>
                      </div>
                    </div>
                    <div className="active-link-actions">
                      <button
                        type="button"
                        className="link-row-btn"
                        onClick={() => handleOpenAddCustom(item)}
                      >
                        {language === 'vi' ? 'Sửa' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        className="link-row-btn danger"
                        onClick={() => handleRemoveCustomLink(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Add {Platform} Social giống hệt ảnh mẫu */}
      {activePlatform && (
        <div className="link-modal-backdrop" onClick={() => setActivePlatform(null)}>
          <div className="link-modal-card guns-social-modal" onClick={(e) => e.stopPropagation()}>
            <div className="guns-modal-header">
              <h4>{L("Thêm", "Add")}{' '}{activePlatform.name}{' '}{L("", "Social")}</h4>
              <button type="button" className="link-modal-close" onClick={() => setActivePlatform(null)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlatformModal}>
              <div className="guns-modal-mode-block">
                <label className="guns-modal-label">
                  {L("Kiểu hiển thị", "Social Mode")}{' '}<span className="help-q-ico" title={L("Liên kết: mở trang · Văn bản: sao chép tên/tag", "Link opens URL; Text copies your handle/tag")}>?</span>
                </label>
                <div className="guns-mode-segmented">
                  <button
                    type="button"
                    className={`guns-mode-tab ${modalMode === 'link' ? 'active' : ''}`}
                    onClick={() => setModalMode('link')}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>{L("Liên kết", "Link")}</span>
                  </button>
                  <button
                    type="button"
                    className={`guns-mode-tab ${modalMode === 'text' ? 'active' : ''}`}
                    onClick={() => setModalMode('text')}
                  >
                    <span className="mode-text-a">A</span>
                    <span>{L("Văn bản", "Text")}</span>
                  </button>
                </div>
              </div>

              <div className="guns-social-input-row">
                <span className="guns-input-platform-ico" style={{ color: activePlatform.color }}>
                  {activePlatform.icon}
                </span>
                <input
                  type="text"
                  autoFocus
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  placeholder={
                    modalMode === 'text'
                      ? L(`Tên / tag ${activePlatform.name} của bạn...`, `Your ${activePlatform.name} username / text...`)
                      : (activePlatform.placeholder || '').replace(/^https?:\/\//i, '').replace(/\/[^/]*$/, '/...')
                  }
                />
              </div>

              <div className="guns-modal-footer">
                <div className="guns-modal-footer-left">
                  <button type="submit" className="guns-add-social-btn" disabled={saving}>
                    {saving ? '...' : socialLinks[activePlatform.key] ? 'Save' : 'Add'}
                  </button>
                  <span className="guns-need-help">{L("Cần trợ giúp?", "Need help?")}</span>
                </div>

                {socialLinks[activePlatform.key] && (
                  <button
                    type="button"
                    className="link-row-btn danger"
                    onClick={() => {
                      handleRemovePlatformLink(activePlatform.key);
                      setActivePlatform(null);
                    }}
                  >
                    {language === 'vi' ? 'Xóa' : 'Remove'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal thêm / sửa Custom URL */}
      {customModalOpen && (
        <div className="link-modal-backdrop" onClick={() => setCustomModalOpen(false)}>
          <div className="link-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="link-modal-head">
              <div className="link-modal-platform">
                <div className="link-modal-ico" style={{ color: '#e4e4e7' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18" />
                    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
                  </svg>
                </div>
                <h4>{editingCustomId ? L('Sửa liên kết riêng', 'Edit Custom URL') : L('Thêm liên kết riêng', 'Add Custom URL')}</h4>
              </div>
              <button type="button" className="link-modal-close" onClick={() => setCustomModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomModal}>
              <div className="link-modal-body">
                <div className="custom-dark-field">
                  <label>{language === 'vi' ? "Tên hiển thị" : 'Title / Label'}</label>
                  <div className="dark-input-box">
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder={L("Portfolio / Cửa hàng của tôi", "My Portfolio / Store")}
                    />
                  </div>
                </div>

                <div className="custom-dark-field">
                  <label>{L("Liên kết riêng", "Custom URL")}</label>
                  <div className="dark-input-box">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="link-modal-foot">
                <button type="button" className="cancel-btn" onClick={() => setCustomModalOpen(false)}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? L('Đang lưu...', 'Saving...') : (language === 'vi' ? 'Lưu URL' : 'Save Custom URL')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from '../config/cloudinary';
import { t } from '../translations';
import {
  SnowEffect,
  RainEffect,
  StarsEffect,
  ParticlesEffect,
  LeavesEffect,
  AuroraEffect,
  FireworksEffect,
  MatrixEffect,
  ConfettiEffect,
  NebulaEffect
} from './Effects';
import './ProfileEditor.css';

const AVATAR_FRAMES = [
  { label: 'No Frame', value: '' },
  { label: 'Frame 1', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_1.png' },
  { label: 'Frame 2', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_2.png' },
  { label: 'Frame 3', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_3.png' },
  { label: 'Frame 4', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_4.png' },
  { label: 'Frame 5', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_5.png' },
  { label: 'Frame 6', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_6.png' },
  { label: 'Frame 7', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_8.png' },
  { label: 'Frame 8', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_9.png' },
  { label: 'Frame 9', value: 'https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/icon_1.png' }
];

const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://twitter.com/...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' }
];

export default function ProfileEditor() {
  const { currentUser } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [profileOpacity, setProfileOpacity] = useState(50);
  const [profileBlur, setProfileBlur] = useState(50);
  const [isPremium, setIsPremium] = useState(false);
  const [previewEffect, setPreviewEffect] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Premium text styling
  const [textFontFamily, setTextFontFamily] = useState('Arial');
  const [text3DEffect, setText3DEffect] = useState(false);
  const [textBorderWidth, setTextBorderWidth] = useState(0);
  const [textBorderColor, setTextBorderColor] = useState('#ffffff');
  const [textBorderStyle, setTextBorderStyle] = useState('solid');
  const [viewCount, setViewCount] = useState(0);

  // Module đang được mở hoặc ghim (pinned) khi click
  const [pinnedTile, setPinnedTile] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    avatar: '',
    avatarFrame: '',
    coverImage: '',
    backgroundImage: '',
    backgroundVideo: '',
    musicUrl: '',
    effect: 'none',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      tiktok: ''
    },
    jobTitle: '',
    status: '',
    turma: '',
    hashtags: [],
    cardColor: '',
    cursorIcon: '',
    presenceType: 'listening',
    presenceTitle: '',
    presenceSubtitle: '',
    presenceIcon: ''
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          setProfileId(querySnapshot.docs[0].id);

          const premiumExpiresAt = profileData.premiumExpiresAt?.toDate
            ? profileData.premiumExpiresAt.toDate()
            : profileData.premiumExpiresAt
              ? new Date(profileData.premiumExpiresAt)
              : null;
          const isPremiumActive = profileData.isPremium && premiumExpiresAt && premiumExpiresAt > new Date();
          setIsPremium(isPremiumActive);

          setFormData({
            username: profileData.username || '',
            displayName: profileData.displayName || '',
            bio: profileData.bio || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            website: profileData.website || '',
            avatar: profileData.avatar || '',
            avatarFrame: profileData.avatarFrame || '',
            coverImage: profileData.coverImage || '',
            backgroundImage: profileData.backgroundImage || '',
            backgroundVideo: profileData.backgroundVideo || '',
            musicUrl: profileData.musicUrl || '',
            effect: profileData.effect || 'none',
            socialLinks: profileData.socialLinks || {
              facebook: '',
              instagram: '',
              twitter: '',
              linkedin: '',
              tiktok: ''
            },
            jobTitle: profileData.jobTitle || '',
            status: profileData.status || '',
            turma: profileData.turma || '',
            hashtags: Array.isArray(profileData.hashtags) ? profileData.hashtags : [],
            cardColor: profileData.cardColor || '',
            cursorIcon: profileData.cursorIcon || '',
            presenceType: profileData.presenceType || 'listening',
            presenceTitle: profileData.presenceTitle || '',
            presenceSubtitle: profileData.presenceSubtitle || '',
            presenceIcon: profileData.presenceIcon || ''
          });

          // Load profile opacity and blur
          setProfileOpacity(profileData.profileOpacity || 50);
          setProfileBlur(profileData.profileBlur || 50);

          // Load Premium text styling
          setTextFontFamily(profileData.textFontFamily || 'Arial');
          setText3DEffect(profileData.text3DEffect || false);
          setTextBorderWidth(profileData.textBorderWidth || 0);
          setTextBorderColor(profileData.textBorderColor || '#ffffff');
          setTextBorderStyle(profileData.textBorderStyle || 'solid');

          // Load view count
          setViewCount(profileData.viewCount || 0);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  async function handleImageUpload(file, type) {
    if (!file) return null;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 10MB');
      return null;
    }

    // Set uploading state for specific type
    if (type === 'avatar') {
      setUploadingAvatar(true);
    } else if (type === 'coverImage') {
      setUploadingCover(true);
    } else if (type === 'backgroundImage') {
      setUploadingBackground(true);
    }
    if (type === 'avatar') setUploadingAvatar(true);
    else if (type === 'coverImage') setUploadingCover(true);
    else if (type === 'backgroundImage') setUploadingBackground(true);
    setUploading(true);

    try {
      const folder = `profiles/${currentUser.uid}/${type}`;
      const url = await uploadToCloudinary(file, folder);
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi khi tải ảnh lên Cloudinary: ' + error.message);
      return null;
    } finally {
      setUploading(false);
      if (type === 'avatar') {
        setUploadingAvatar(false);
      } else if (type === 'coverImage') {
        setUploadingCover(false);
      } else if (type === 'backgroundImage') {
        setUploadingBackground(false);
      }
      if (type === 'avatar') setUploadingAvatar(false);
      else if (type === 'coverImage') setUploadingCover(false);
      else if (type === 'backgroundImage') setUploadingBackground(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user selected Premium effect without Premium
      // Free effects: snow, particles, confetti, fireworks
      // Premium effects: rain, stars, leaves, aurora, matrix, nebula
      const premiumEffects = ['rain', 'stars', 'leaves', 'aurora', 'matrix', 'nebula'];
      if (premiumEffects.includes(formData.effect) && !isPremium) {
        const confirmUpgrade = window.confirm(
          'Tính năng Premium!\n\n' +
          `Hiệu ứng "${formData.effect}" chỉ dành cho tài khoản Premium.\n\n` +
          'Bạn có muốn nâng cấp lên Premium để sử dụng hiệu ứng này không?'
            `Hiệu ứng "${formData.effect}" chỉ dành cho tài khoản Premium.\n\n` +
          'Bạn có muốn nâng cấp lên Premium để sử dụng hiệu ứng này không?'
        );
        if (confirmUpgrade) {
          navigate('/premium');
        }
        if (confirmUpgrade) navigate('/premium');
        setLoading(false);
        return;
      }

      // Check if user selected background video without Premium
      if (formData.backgroundVideo && !isPremium) {
        const confirmUpgrade = window.confirm(
          ' Tính năng Premium!\n\n' +
          'Background Video chỉ dành cho tài khoản Premium.\n\n' +
          'Bạn có muốn nâng cấp lên Premium để sử dụng tính năng này không?'
          'Tính năng Premium!\n\n' +
          'Background Video chỉ dành cho tài khoản Premium.\n\n' +
          'Bạn có muốn nâng cấp lên Premium để sử dụng tính năng này không?'
        );
        if (confirmUpgrade) {
          navigate('/premium');
        }
        if (confirmUpgrade) navigate('/premium');
        setLoading(false);
        return;
      }

      const normalizedUsername = formData.username.toLowerCase().trim();
      if (!normalizedUsername || !formData.displayName.trim()) {
        alert(language === 'vi' ? 'Vui lòng nhập Username và Tên hiển thị ở mục Thông tin định danh!' : 'Please enter Username and Display Name!');
        setPinnedTile('identity');
        setLoading(false);
        return;
      }

      // Clean hashtags - remove empty strings and ensure valid array
      const cleanHashtags = Array.isArray(formData.hashtags)
        ? formData.hashtags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
          ? formData.hashtags.filter((tag) => tag && typeof tag === 'string' && tag.trim() !== '')
          : [];

      // Clean socialLinks - ensure all fields are strings
      const cleanSocialLinks = {
        facebook: String(formData.socialLinks?.facebook || ''),
        instagram: String(formData.socialLinks?.instagram || ''),
        twitter: String(formData.socialLinks?.twitter || ''),
        linkedin: String(formData.socialLinks?.linkedin || ''),
        tiktok: String(formData.socialLinks?.tiktok || '')
      };

      // Build profile data object - only include valid fields
      const profileData = {
        username: normalizedUsername,
        userId: currentUser.uid,
        displayName: String(formData.displayName || ''),
        bio: String(formData.bio || ''),
        email: String(formData.email || ''),
        phone: String(formData.phone || ''),
        location: String(formData.location || ''),
        website: String(formData.website || ''),
        avatar: String(formData.avatar || ''),
        avatarFrame: String(formData.avatarFrame || ''),
        coverImage: String(formData.coverImage || ''),
        backgroundImage: String(formData.backgroundImage || ''),
        backgroundVideo: String(formData.backgroundVideo || ''),
        musicUrl: String(formData.musicUrl || ''),
        effect: String(formData.effect || 'none'),
        socialLinks: cleanSocialLinks,
        jobTitle: String(formData.jobTitle || ''),
        status: String(formData.status || ''),
        turma: String(formData.turma || ''),
        hashtags: cleanHashtags,
        cardColor: String(formData.cardColor || ''),
        cursorIcon: String(formData.cursorIcon || ''),
        presenceType: String(formData.presenceType || 'listening'),
        presenceTitle: String(formData.presenceTitle || ''),
        presenceSubtitle: String(formData.presenceSubtitle || ''),
        presenceIcon: String(formData.presenceIcon || ''),
        profileOpacity: Number(profileOpacity) || 50,
        profileBlur: Number(profileBlur) || 50,
        textFontFamily: String(textFontFamily || 'Arial'),
        text3DEffect: Boolean(text3DEffect),
        textBorderWidth: Number(textBorderWidth) || 0,
        textBorderColor: String(textBorderColor || '#ffffff'),
        textBorderStyle: String(textBorderStyle || 'solid'),
        updatedAt: new Date()
      };

      if (profileId) {
        await updateDoc(doc(db, 'profiles', profileId), profileData);
        alert('Cập nhật hồ sơ thành công!');
      } else {
        const usernameCheck = query(
          collection(db, 'profiles'),
          where('username', '==', normalizedUsername)
        );
        const usernameCheck = query(collection(db, 'profiles'), where('username', '==', normalizedUsername));
        const usernameSnapshot = await getDocs(usernameCheck);

        if (!usernameSnapshot.empty) {
          alert('Tên người dùng đã tồn tại. Vui lòng chọn tên khác.');
          setLoading(false);
          return;
        }

        profileData.createdAt = new Date();
        await addDoc(collection(db, 'profiles'), profileData);
        alert('Tạo hồ sơ thành công!');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Lỗi khi lưu hồ sơ: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        setFormData((prev) =>({
          ...prev,
          socialLinks: {
            ...prev.socialLinks,
            [socialKey]: value
          }
        }));
    } else {
      const processedValue = name === 'username' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : value;
      setFormData(prev => ({
        setFormData((prev) =>({
          ...prev,
          [name]: processedValue
        }));
    }
  }

  async function handleImageChange(e, type) {
    const file = e.target.files[0];
    if (file) {
      const url = await handleImageUpload(file, type);
      if (url) {
        setFormData(prev => ({
          setFormData((prev) =>({
            ...prev,
            [type]: url
          }));
      }
    }
  }

  function handleRemoveImage(type) {
    setFormData(prev => ({
      setFormData((prev) =>({
        ...prev,
        [type]: ''
      }));
  }

  const profileLink = formData.username
    ? `${window.location.origin}/${formData.username}`
    : null;
  function toggleTile(id) {
    setPinnedTile((prev) => (prev === id ? null : id));
  }

  const profileLink = formData.username ? `${window.location.origin}/${formData.username}` : null;
  const activeSocialCount = Object.values(formData.socialLinks || {}).filter(Boolean).length;

  return (
    <div className="profile-editor-layout">
      {/* Sidebar */}
      {/* Sidebar gọn gàng đồng bộ với Dashboard */}
      <aside className="editor-sidebar">
        <div className="sidebar-header">
          <img src="/logo-konone-v1.png" alt="KonOne Logo" className="logo-icon" />
          <span className="logo-text">KonOne</span>
          <Link to="/" className="editor-brand-link">
            <img src="/logo-konone-v1.png" alt="KonOne Logo" className="logo-icon" />
            <span className="logo-text">KonOne</span>
          </Link>
          <div className="language-selector-editor">
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
          <div className={`nav-item ${activeSection === 'account' ? 'active' : ''}`} onClick={() => setActiveSection('account')}>
            <span className="nav-icon"></span> Account
            <span className="nav-arrow">▼</span>
            <div className="nav-item" onClick={() => navigate('/dashboard')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Dashboard</span>
            </div>
            <div className={`nav-item ${activeSection === 'customize' ? 'active' : ''}`} onClick={() => setActiveSection('customize')}>
              <span className="nav-icon"></span> {t(language, 'profileEditor.customize')}

              <div className="nav-item active">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>{t(language, 'profileEditor.customize')}</span>
              </div>

              <div className="nav-item" onClick={() => navigate('/edit-layout')}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                <span>{language === 'vi' ? 'Bố cục' : 'Layout'}</span>
              </div>

              <div className="nav-item" onClick={() => navigate('/premium')}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Premium</span>
              </div>
            </nav>

            <div className="sidebar-footer">

              <button
                type="button"
                className="footer-btn my-page-btn"
                onClick={() => profileLink && window.open(profileLink, '_blank')}
                disabled={!profileLink}
              >
                <span className="btn-icon"></span> My Page
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>My Page</span>
              </button>
              <button
                type="button"
                className="footer-btn share-btn"
                onClick={() => profileLink && navigator.share?.({ url: profileLink })}
                onClick={() => {
                  if (profileLink) {
                    navigator.clipboard.writeText(profileLink);
                    alert(language === 'vi' ? 'Đã sao chép liên kết hồ sơ!' : 'Profile link copied!');
                  }
                }}
                disabled={!profileLink}
              >
                <span className="btn-icon"></span> Share Your Profile
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share Your Profile</span>
              </button>

              <div className="user-info">
                <div className="user-name">{formData.username || 'No username'}</div>
                <div className="user-name">{formData.username ? `@${formData.username}` : 'No username'}</div>
                <div className="user-uid">UID {currentUser?.uid?.slice(0, 8) || 'N/A'}</div>
                <div className="user-views" style={{ fontSize: '12px', color: '#999', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <div className="user-views">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                      {viewCount.toLocaleString()} views
                      <span>{viewCount.toLocaleString()} views</span>
                    </div>
                    <span className="user-menu">⋯</span>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            {/* Main Content — Tổng quan tất cả thành phần trong 1 màn hình, rê chuột hoặc bấm vào sẽ mở chi tiết */}
            <main className="editor-main">
              <form onSubmit={handleSubmit} className="editor-form">
                {/* Media Uploads Section */}
                <div className="media-uploads-section">
                  <h2 className="section-title">{t(language, 'profileEditor.mediaUploads')}</h2>
                  <div className="media-grid">
                    {/* Background */}
                    <div className="media-card">
                      <div className="media-card-header">
                        <span className="media-label">Background</span>
                        {(formData.backgroundImage || formData.backgroundVideo) && (
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => {
                              handleRemoveImage('backgroundImage');
                              setFormData(prev => ({ ...prev, backgroundVideo: '' }));
                            }}
                          >
                            ✕
                          </button>
                        )}
                        {/* Thanh tiêu đề & nút Lưu nhanh */}
                        <div className="editor-topbar">
                          <div>
                            <h1 className="editor-page-title">
                              {language === 'vi' ? 'Trình chỉnh sửa hồ sơ' : 'Profile Studio'}
                            </h1>
                            <p className="editor-page-subtitle">
                              {language === 'vi'
                                ? 'Rê chuột hoặc nhấn vào từng mục bên dưới để mở bảng chỉnh sửa chi tiết'
                                : 'Hover or click on any module below to reveal detailed controls'}
                            </p>
                          </div>

                          <div className="editor-topbar-actions">
                            {!isPremium && (
                              <button
                                type="button"
                                className="editor-pro-pill"
                                onClick={() => navigate('/premium')}
                              >
                                ✦ {language === 'vi' ? 'Mở khóa Premium' : 'Unlock Premium'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => navigate('/dashboard')}
                              className="cancel-btn"
                            >
                              {t(language, 'profileEditor.cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={loading || uploading}
                              className="save-btn"
                            >
                              {uploading
                                ? language === 'vi' ? 'Đang tải...' : 'Uploading...'
                                : loading
                                  ? language === 'vi' ? 'Đang lưu...' : 'Saving...'
                                  : t(language, 'profileEditor.save')}
                            </button>
                          </div>
                        </div>

                        {/* Lưới 9 Module rút gọn — Thấy toàn bộ ngay khi vừa vào trang */}
                        <div className="editor-modules-grid">
                          {/* 1. THÔNG TIN ĐỊNH DANH (Username, Display Name, Bio) */}
                          <div className={`editor-tile ${pinnedTile === 'identity' ? 'is-pinned' : ''}`}>
                            <div className="tile-head" onClick={() => toggleTile('identity')}>
                              <div className="tile-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                              <div className="media-preview" style={{ position: 'relative' }}>
                                {uploadingBackground && (
                                  <div className="uploading-overlay">
                                    <div className="spinner"></div>
                                    <p>{language === 'vi' ? 'Đang tải...' : 'Uploading...'}</p>
                                  </div>
                                )}
                                {formData.backgroundImage ? (
                                  <>
                                    <img src={formData.backgroundImage} alt="Background" />
                                    <span className="file-format">UPLOAD</span>
                                  </>
                                ) : (
                                  <div className="media-placeholder">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageChange(e, 'backgroundImage')}
                                      disabled={uploadingBackground}
                                      className="media-input"
                                    />
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon" style={{ width: '32px', height: '32px', opacity: 0.5 }}>
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                      <circle cx="8.5" cy="8.5" r="1.5" />
                                      <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                    <span className="placeholder-text">Click to upload a file</span>
                                  </div>
                                )}
                                <div className="tile-meta">
                                  <h3>{language === 'vi' ? 'Thông tin định danh' : 'Identity & Bio'}</h3>
                                  <span className="tile-summary">
                                    {formData.username
                                      ? `@${formData.username} • ${formData.displayName || 'No name'}`
                                      : language === 'vi' ? 'Chưa đặt username' : 'Username not set'}
                                  </span>
                                </div>
                                <span className="tile-chevron">⌄</span>
                              </div>

                              {/* Audio */}
                              <div className="media-card">
                                <div className="media-card-header">
                                  <span className="media-label">Audio</span>
                                </div>
                                <div className="media-preview">
                                  <div className="media-placeholder">
                                    <div className="tile-body">
                                      <div className="tile-field-row">
                                        <div className="tile-field">
                                          <label>Username *</label>
                                          <input
                                            type="url"
                                            name="musicUrl"
                                            value={formData.musicUrl}
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="YouTube URL"
                                            className="audio-input"
                                            required
                                            placeholder="username"
                                            pattern="[a-z0-9]+"
                                          />
                                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon" style={{ width: '32px', height: '32px', opacity: 0.5 }}>
                                            <path d="M9 18V5l12-2v13" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="16" r="3" />
                                          </svg>
                                          <span className="placeholder-text">Only enter the YouTube URL here</span>
                                        </div>
                                        <div className="tile-field">
                                          <label>Display Name *</label>
                                          <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            required
                                            placeholder="Display Name"
                                          />
                                        </div>
                                      </div>
                                      <div className="tile-field">
                                        <label>Description / Bio</label>
                                        <textarea
                                          name="bio"
                                          value={formData.bio}
                                          onChange={handleChange}
                                          placeholder="Write a short description for your profile..."
                                          rows="2"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Background Video (Premium) */}
                                  <div className="media-card">
                                    <div className="media-card-header">
                                      <span className="media-label">Background Video</span>
                                      {!isPremium && (
                                        <span className="premium-badge">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                          </svg>
                                          Premium
                                        </span>
            {/* 2. AVATAR & KHUNG VIỀN */}
                                      <div className={`editor-tile ${pinnedTile === 'avatar' ? 'is-pinned' : ''}`}>
                                        <div className="tile-head" onClick={() => toggleTile('avatar')}>
                                          <div className="tile-icon">
                                            {formData.avatar ? (
                                              <img src={formData.avatar} alt="" className="tile-mini-thumb round" />
                                            ) : (
                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <circle cx="12" cy="10" r="3" />
                                                <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                                              </svg>
                                            )}
                                            {formData.backgroundVideo && (
                                              <button
                                                type="button"
                                                className="remove-btn"
                                                onClick={() => setFormData(prev => ({ ...prev, backgroundVideo: '' }))}
                                                disabled={!isPremium}
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </div>
                                          <div className="media-preview">
                                            {formData.backgroundVideo ? (
                    <div className="video-preview">
                <div className="tile-meta">
                  <h3>Avatar &amp; Frame</h3>
                  <span className="tile-summary">
                    {formData.avatar ? (language === 'vi' ? 'Đã có ảnh đại diện' : 'Avatar uploaded') : (language === 'vi' ? 'Chưa tải ảnh' : 'No avatar')}
                    {formData.avatarFrame ? ' • Có khung' : ''}
                  </span>
                </div>
                <span className="tile-chevron">⌄</span>
              </div>

                      <span className="video-text">YouTube Video Background</span>
                      <span className="file-format">VIDEO</span>
              <div className="tile-body">
                <div className="tile-avatar-editor">
                  <div className="tile-avatar-preview-box">
                    {uploadingAvatar && <div className="uploading-overlay"><div className="spinner" /></div>}
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="tile-avatar-img" />
                    ) : (
                      <span className="tile-avatar-empty">No Image</span>
                    )}
                    {formData.avatarFrame && (
                      <img src={formData.avatarFrame} alt="Frame" className="tile-avatar-frame-overlay" />
                    )}
                  </div>

                  <div className="tile-avatar-controls">
                    <div className="tile-upload-actions">
                      <label className="tile-upload-btn">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'avatar')}
                          disabled={uploadingAvatar}
                        />
                        {language === 'vi' ? 'Tải ảnh lên' : 'Upload Avatar'}
                      </label>
                      {formData.avatar && (
                        <button
                          type="button"
                          className="tile-clear-btn"
                          onClick={() => handleRemoveImage('avatar')}
                        >
                          {language === 'vi' ? 'Xóa' : 'Remove'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="media-placeholder">
                      <input
                        type="url"
                        name="backgroundVideo"
                        value={formData.backgroundVideo}
                        onChange={handleChange}
                        placeholder="YouTube Video URL"
                        className="audio-input"
                        disabled={!isPremium}
                      />

                      <span className="placeholder-text">
                        {isPremium ? 'Only enter the YouTube URL here' : 'Unlock Premium to add background video'}
                      </span>
                    <div className="tile-field" style={{ marginTop: 8 }}>
                      <label>Avatar Frame</label>
                      <select
                        value={formData.avatarFrame}
                        onChange={(e) => setFormData((prev) => ({ ...prev, avatarFrame: e.target.value }))}
                        className="custom-select"
                      >
                        {AVATAR_FRAMES.map((f) => (
                          <option key={f.label} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {!isPremium && (
                    <div className="premium-overlay">
                      <Link to="/premium" className="unlock-premium-btn">Unlock Premium</Link>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>

                                          {/* Avatar & Frame & Cover Group */}
                                          <div style={{ marginBottom: '32px' }}>
                                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '16px', paddingLeft: '8px' }}>Avatar, Frame & Cover</h3>
                                            <div className="media-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                              {/* Profile Avatar */}
                                              <div className="media-card">
                                                <div className="media-card-header">
                                                  <span className="media-label">Profile Avatar</span>
                                                  {formData.avatar && (
                                                    <button
                                                      type="button"
                                                      className="remove-btn"
                                                      onClick={() => handleRemoveImage('avatar')}
                                                    >
                                                      ✕
                                                    </button>
            {/* 3. ẢNH BÌA (COVER / BANNER) */}
                                                  <div className={`editor-tile ${pinnedTile === 'cover' ? 'is-pinned' : ''}`}>
                                                    <div className="tile-head" onClick={() => toggleTile('cover')}>
                                                      <div className="tile-icon">
                                                        {formData.coverImage ? (
                                                          <img src={formData.coverImage} alt="" className="tile-mini-thumb" />
                                                        ) : (
                                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="16" rx="2" />
                                                            <circle cx="8.5" cy="9.5" r="1.5" />
                                                            <polyline points="21 15 16 10 5 20" />
                                                          </svg>
                                                        )}
                                                      </div>
                                                      <div className="media-preview" style={{
                                                        aspectRatio: '1/1',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative'
                                                      }}>
                                                        {uploadingAvatar && (
                    <div className="uploading-overlay">
                      <div className="spinner"></div>
                      <p>{language === 'vi' ? 'Đang tải...' : 'Uploading...'}</p>
                <div className="tile-meta">
                  <h3>Cover / Banner</h3>
                  <span className="tile-summary">
                    {formData.coverImage
                      ? language === 'vi' ? 'Đã tải ảnh bìa' : 'Cover uploaded'
                      : language === 'vi' ? 'Chưa có ảnh bìa' : 'No cover image'}
                  </span>
                </div>
                <span className="tile-chevron">⌄</span>
              </div>

              <div className="tile-body">
                <div className="tile-media-drop">
                  {uploadingCover && <div className="uploading-overlay"><div className="spinner" /></div>}
                  {formData.coverImage ? (
                    <div className="tile-media-filled">
                      <img src={formData.coverImage} alt="Cover" />
                      <button
                        type="button"
                        className="tile-remove-chip"
                        onClick={() => handleRemoveImage('coverImage')}
                      >
                        ✕ {language === 'vi' ? 'Xóa ảnh' : 'Remove'}
                      </button>
                    </div>
                  )}
                  {formData.avatar ? (
                    <>
                      <img src={formData.avatar} alt="Avatar" style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }} />
                      <span className="file-format">UPLOAD</span>
                    </>
                  ) : (
                    <div className="media-placeholder" style={{ borderRadius: '50%' }}>
                    <label className="tile-drop-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'avatar')}
                        disabled={uploadingAvatar}
                        className="media-input"
                        onChange={(e) => handleImageChange(e, 'coverImage')}
                        disabled={uploadingCover}
                      />
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon" style={{ width: '32px', height: '32px', opacity: 0.5 }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="placeholder-text">Click to upload a file</span>
                    </div>
                      <span>+ {language === 'vi' ? 'Chọn ảnh bìa thẻ hồ sơ' : 'Click to upload cover image'}</span>
                    </label>
                  )}
                </div>
              </div>
                                                    </div>

                                                    {/* Avatar Frame Selection */}
                                                    <div className="media-card">
                                                      <div className="media-card-header">
                                                        <span className="media-label">Avatar Frame</span>
                                                      </div>
                                                      <div className="media-preview" style={{ padding: '20px', minHeight: 'auto', aspectRatio: 'auto' }}>
                                                        <select
                                                          value={formData.avatarFrame}
                                                          onChange={(e) => setFormData(prev => ({ ...prev, avatarFrame: e.target.value }))}
                                                          className="custom-select"
                                                          style={{ width: '100%', marginBottom: '20px' }}
                                                        >
                                                          <option value="">No Frame</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_1.png">Khung 1</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_2.png">Khung 2</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_3.png">Khung 3</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_4.png">Khung 4</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_5.png">Khung 5</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_6.png">Khung 6</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_8.png">Khung 7</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/khung_9.png">Khung 8</option>
                                                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/icon_1.png">Khung 9</option>
                                                        </select>

                                                        {/* Frame Preview */}
                                                        {formData.avatarFrame && (
                                                          <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '20px',
                                                            background: 'rgba(0, 0, 0, 0.1)',
                                                            borderRadius: '8px'
                                                          }}>
                                                            <div style={{ fontSize: '14px', color: '#999', marginBottom: '10px' }}>Preview:</div>
                                                            <div style={{
                                                              position: 'relative',
                                                              width: '150px',
                                                              height: '150px',
                                                              borderRadius: '50%',
                                                              overflow: 'hidden',
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'center'
                                                            }}>
                                                              {formData.avatar ? (
                                                                <>
                                                                  <img
                                                                    src={formData.avatar}
                                                                    alt="Avatar Preview"
                                                                    style={{
                                                                      width: '80%',
                                                                      height: '80%',
                                                                      objectFit: 'cover',
                                                                      borderRadius: '50%'
                                                                    }}
                                                                  />
                                                                  <img
                                                                    src={formData.avatarFrame}
                                                                    alt="Frame Preview"
                                                                    style={{
                                                                      position: 'absolute',
                                                                      top: '50%',
                                                                      left: '50%',
                                                                      transform: 'translate(-50%, -50%)',
                                                                      width: '115%',
                                                                      height: '115%',
                                                                      objectFit: 'contain',
                                                                      pointerEvents: 'none'
                                                                    }}
                                                                  />
                                                                </>
                                                              ) : (
                                                                <div style={{
                                                                  width: '100%',
                                                                  height: '100%',
                                                                  background: '#333',
                                                                  display: 'flex',
                                                                  alignItems: 'center',
                                                                  justifyContent: 'center',
                                                                  fontSize: '48px'
                                                                }}>
                                                                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                                    <circle cx="12" cy="7" r="4" />
                                                                  </svg>
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
            {/* 4. HÌNH NỀN TRANG (BACKGROUND IMAGE) */}
                                                        <div className={`editor-tile ${pinnedTile === 'background' ? 'is-pinned' : ''}`}>
                                                          <div className="tile-head" onClick={() => toggleTile('background')}>
                                                            <div className="tile-icon">
                                                              {formData.backgroundImage ? (
                                                                <img src={formData.backgroundImage} alt="" className="tile-mini-thumb" />
                                                              ) : (
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                  <rect x="2" y="3" width="20" height="18" rx="2" />
                                                                  <path d="M2 15l5-5 4 4 5-6 6 7" />
                                                                </svg>
                                                              )}
                                                            </div>
                                                            <div className="tile-meta">
                                                              <h3>Background Image</h3>
                                                              <span className="tile-summary">
                                                                {formData.backgroundImage
                                                                  ? language === 'vi' ? 'Đã cài hình nền' : 'Custom background active'
                                                                  : language === 'vi' ? 'Mặc định hệ thống' : 'Default background'}
                                                              </span>
                                                            </div>
                                                            <span className="tile-chevron">⌄</span>
                                                          </div>

                                                          {/* Cover Image / Banner (Premium) */}
                                                          <div className="media-card">
                                                            <div className="media-card-header">
                                                              <span className="media-label">Cover Image / Banner</span>
                                                              {formData.coverImage && (
                                                                <button
                                                                  type="button"
                                                                  className="remove-btn"
                                                                  onClick={() => handleRemoveImage('coverImage')}
                                                                >
                                                                  ✕
                                                                </button>
                                                              )}
                                                            </div>
                                                            <div className="media-preview" style={{ position: 'relative' }}>
                                                              {uploadingCover && (
                                                                <div className="uploading-overlay">
                                                                  <div className="spinner"></div>
                                                                  <p>{language === 'vi' ? 'Đang tải...' : 'Uploading...'}</p>
                                                                  <div className="tile-body">
                                                                    <div className="tile-media-drop">
                                                                      {uploadingBackground && <div className="uploading-overlay"><div className="spinner" /></div>}
                                                                      {formData.backgroundImage ? (
                                                                        <div className="tile-media-filled">
                                                                          <img src={formData.backgroundImage} alt="Background" />
                                                                          <button
                                                                            type="button"
                                                                            className="tile-remove-chip"
                                                                            onClick={() => handleRemoveImage('backgroundImage')}
                                                                          >
                                                                            ✕ {language === 'vi' ? 'Xóa nền' : 'Remove'}
                                                                          </button>
                                                                        </div>
                                                                      )}
                                                                      {formData.coverImage ? (
                                                                        <>
                                                                          <img src={formData.coverImage} alt="Cover" />
                                                                          <span className="file-format">UPLOAD</span>
                                                                        </>
                                                                      ) : (
                    <div className="media-placeholder">
                    <label className="tile-drop-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'coverImage')}
                        disabled={uploadingCover}
                        className="media-input"
                        onChange={(e) => handleImageChange(e, 'backgroundImage')}
                        disabled={uploadingBackground}
                      />
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon" style={{ width: '32px', height: '32px', opacity: 0.5 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="placeholder-text">
                        Click to upload cover image
                      </span>
                    </div>
                      <span>+ {language === 'vi' ? 'Tải hình nền toàn trang' : 'Click to upload page background'}</span>
                    </label>
                  )}
                                                                  </div>
                                                                </div>
            </div>

                                                            {/* Premium Banner */}
                                                            {!isPremium && (
                                                              <div className="premium-banner" onClick={() => navigate('/premium')} style={{ cursor: 'pointer' }}>
                                                                <div className="premium-pattern"></div>
                                                                <div className="premium-content">

                                                                  <span className="premium-text">Want exclusive features? Unlock more with Premium</span>
                                                                  {/* 5. NHẠC NỀN (AUDIO YOUTUBE) */}
                                                                  <div className={`editor-tile ${pinnedTile === 'audio' ? 'is-pinned' : ''}`}>
                                                                    <div className="tile-head" onClick={() => toggleTile('audio')}>
                                                                      <div className="tile-icon">
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                          <path d="M9 18V5l12-2v13" />
                                                                          <circle cx="6" cy="18" r="3" />
                                                                          <circle cx="18" cy="16" r="3" />
                                                                        </svg>
                                                                      </div>
                                                                      <div className="tile-meta">
                                                                        <h3>Audio / Music</h3>
                                                                        <span className="tile-summary">
                                                                          {formData.musicUrl
                                                                            ? language === 'vi' ? 'Đã gắn link nhạc YouTube' : 'YouTube audio linked'
                                                                            : language === 'vi' ? 'Chưa có nhạc nền' : 'No background music'}
                                                                        </span>
                                                                      </div>
                                                                      <span className="tile-chevron">⌄</span>
                                                                    </div>
            )}
                                                                  </div>

                                                                  {/* General Customization */}
                                                                  <div className="customization-section">
                                                                    <h2 className="section-title">{t(language, 'profileEditor.generalCustomization')}</h2>

                                                                    <div className="form-group">
                                                                      <label>Description</label>
                                                                      <textarea
                                                                        name="bio"
                                                                        value={formData.bio}
                                                                        onChange={handleChange}
                                                                        placeholder="A this is my description"
                                                                        rows="3"
                                                                      />
                                                                    </div>

                                                                    {/* Card Color */}
                                                                    <div className="form-group">
                                                                      <label>
                                                                        <span>Card Color</span>
                                                                        <span className="form-hint">(Border in card)</span>
                                                                      </label>
                                                                      <div className="color-picker-container">
                                                                        <input
                                                                          type="color"
                                                                          name="cardColor"
                                                                          value={formData.cardColor || '#C71585'}
                                                                          onChange={handleChange}
                                                                          className="color-picker-input"
                                                                        />
                                                                        <input
                                                                          type="text"
                                                                          name="cardColor"
                                                                          value={formData.cardColor || ''}
                                                                          onChange={handleChange}
                                                                          placeholder="#C71585 (default)"
                                                                          className="color-text-input"
                                                                        />
                                                                        <button
                                                                          type="button"
                                                                          onClick={() => setFormData(prev => ({ ...prev, cardColor: '' }))}
                                                                          className="color-reset-btn"
                                                                          title="Reset to default"
                                                                        >
                                                                          Reset
                                                                        </button>
                                                                        <div className="tile-body">
                                                                          <div className="tile-field">
                                                                            <label>YouTube Audio URL</label>
                                                                            <div className="tile-input-with-clear">
                                                                              <input
                                                                                type="url"
                                                                                name="musicUrl"
                                                                                value={formData.musicUrl}
                                                                                onChange={handleChange}
                                                                                placeholder="https://www.youtube.com/watch?v=..."
                                                                              />
                                                                              {formData.musicUrl && (
                                                                                <button
                                                                                  type="button"
                                                                                  onClick={() => setFormData((prev) => ({ ...prev, musicUrl: '' }))}
                                                                                >
                                                                                  ✕
                                                                                </button>
                                                                              )}
                                                                            </div>
                                                                          </div>
                                                                        </div>
                                                                      </div>

                                                                      {/* Presence Card (Modern Layout) */}
                                                                      <div className="form-group presence-customization">
                                                                        <label>
                                                                          <span>{t(language, 'profileEditor.presenceCard')}</span>
                                                                          <span className="form-hint">(Discord-style status)</span>
                                                                        </label>

                                                                        <div className="presence-grid" style={{
                                                                          display: 'grid',
                                                                          gridTemplateColumns: '1fr 2fr',
                                                                          gap: '15px',
                                                                          background: 'rgba(255, 255, 255, 0.03)',
                                                                          padding: '15px',
                                                                          borderRadius: '12px',
                                                                          border: '1px solid rgba(255, 255, 255, 0.05)'
                                                                        }}>
                                                                          <div className="form-group">
                                                                            <label>{t(language, 'profileEditor.presenceType')}</label>
                                                                            <select
                                                                              name="presenceType"
                                                                              value={formData.presenceType}
                                                                              onChange={handleChange}
                                                                              className="custom-select"
                                                                            >
                                                                              <option value="playing">{t(language, 'profileEditor.activityPlaying')}</option>
                                                                              <option value="listening">{t(language, 'profileEditor.activityListening')}</option>
                                                                              <option value="watching">{t(language, 'profileEditor.activityWatching')}</option>
                                                                              <option value="streaming">{t(language, 'profileEditor.activityStreaming')}</option>
                                                                              <option value="competing">{t(language, 'profileEditor.activityCompeting')}</option>
                                                                            </select>
                                                                            {/* 6. VIDEO NỀN (BACKGROUND VIDEO - PREMIUM) */}
                                                                            <div className={`editor-tile ${pinnedTile === 'video' ? 'is-pinned' : ''}`}>
                                                                              <div className="tile-head" onClick={() => toggleTile('video')}>
                                                                                <div className="tile-icon">
                                                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                    <polygon points="23 7 16 12 23 17 23 7" />
                                                                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                                                                  </svg>
                                                                                </div>

                                                                                <div className="form-group">
                                                                                  <label>{t(language, 'profileEditor.presenceTitle')}</label>
                                                                                  <input
                                                                                    type="text"
                                                                                    name="presenceTitle"
                                                                                    value={formData.presenceTitle}
                                                                                    onChange={handleChange}
                                                                                    placeholder="e.g. YouTube Music, League of Legends"
                                                                                  />
                                                                                  <div className="tile-meta">
                                                                                    <h3>
                                                                                      Background Video
                                                                                      <span className="tile-pro-tag">PRO</span>
                                                                                    </h3>
                                                                                    <span className="tile-summary">
                                                                                      {formData.backgroundVideo
                                                                                        ? 'YouTube Video Active'
                                                                                        : isPremium
                                                                                          ? language === 'vi' ? 'Chưa gắn video nền' : 'No video URL'
                                                                                          : language === 'vi' ? 'Tính năng Premium' : 'Requires Premium'}
                                                                                    </span>
                                                                                  </div>
                                                                                  <span className="tile-chevron">⌄</span>
                                                                                </div>

                                                                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                                                  <label>{t(language, 'profileEditor.presenceSubtitle')}</label>
                                                                                  <div className="tile-body">
                                                                                    <div className="tile-field">
                                                                                      <label>YouTube Video URL</label>
                                                                                      <input
                                                                                        type="text"
                                                                                        name="presenceSubtitle"
                                                                                        value={formData.presenceSubtitle}
                                                                                        type="url"
                                                                                        name="backgroundVideo"
                                                                                        value={formData.backgroundVideo}
                                                                                        onChange={handleChange}
                                                                                        placeholder="e.g. Listening to Lofi Hip Hop"
                                                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                                                        disabled={!isPremium}
                                                                                      />
                                                                                      {!isPremium && (
                                                                                        <div className="tile-pro-notice">
                                                                                          <span>{language === 'vi' ? 'Nâng cấp Premium để dùng video nền.' : 'Unlock Premium to use video background.'}</span>
                                                                                          <Link to="/premium">Unlock Premium →</Link>
                                                                                        </div>
                                                                                      )}
                                                                                    </div>
                                                                                  </div>
                                                                                </div>

                                                                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                                                  <label>Presence Icon (Game/Coding)</label>
                                                                                  <select
                                                                                    name="presenceIcon"
                                                                                    value={formData.presenceIcon}
                                                                                    onChange={handleChange}
                                                                                    className="custom-select"
                                                                                  >
                                                                                    <option value="">None (Use Avatar)</option>
                                                                                    <optgroup label="Games">
                                                                                      <option value="fivem">FiveM</option>
                                                                                      <option value="pubg">PUBG</option>
                                                                                      <option value="lol">League of Legends</option>
                                                                                      <option value="valorant">Valorant</option>
                                                                                      <option value="csgo">CS:GO</option>
                                                                                      <option value="minecraft">Minecraft</option>
                                                                                      <option value="roblox">Roblox</option>
                                                                                    </optgroup>
                                                                                    <optgroup label="Coding">
                                                                                      <option value="lua">Lua</option>
                                                                                      <option value="html">HTML</option>
                                                                                      <option value="css">CSS</option>
                                                                                      <option value="js">JavaScript</option>
                                                                                      <option value="react">React</option>
                                                                                      <option value="python">Python</option>
                                                                                      <option value="cpp">C++</option>
                                                                                    </optgroup>
                                                                                  </select>
                                                                                  {/* 7. MÀU THẺ & HIỆU ỨNG NỀN (APPEARANCE & EFFECTS) */}
                                                                                  <div className={`editor-tile ${pinnedTile === 'effects' ? 'is-pinned' : ''}`}>
                                                                                    <div className="tile-head" onClick={() => toggleTile('effects')}>
                                                                                      <div className="tile-icon">
                                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                                                                                        </svg>
                                                                                      </div>
                                                                                      <div className="tile-meta">
                                                                                        <h3>{language === 'vi' ? 'Màu sắc & Hiệu ứng' : 'Theme & Effects'}</h3>
                                                                                        <span className="tile-summary">
                                                                                          {formData.effect !== 'none' ? `Effect: ${formData.effect}` : 'No effect'} • {formData.cardColor || '#C71585'}
                                                                                        </span>
                                                                                      </div>
                                                                                      <span className="tile-chevron">⌄</span>
                                                                                    </div>
                                                                                  </div>
                                                                                  {/* Profile Opacity */}
                                                                                  {/* <div className="form-group slider-group">
              <label>Profile Opacity</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profileOpacity}
                  onChange={(e) => setProfileOpacity(e.target.value)}
                  className="slider"
                />
                <div className="slider-markers">
                  <span>20%</span>
                  <span>50%</span>
                  <span>80%</span>

              <div className="tile-body">
                <div className="tile-field">
                  <label>Card Accent Color</label>
                  <div className="color-picker-container">
                    <input
                      type="color"
                      name="cardColor"
                      value={formData.cardColor || '#C71585'}
                      onChange={handleChange}
                      className="color-picker-input"
                    />
                    <input
                      type="text"
                      name="cardColor"
                      value={formData.cardColor || ''}
                      onChange={handleChange}
                      placeholder="#C71585 (default)"
                      className="color-text-input"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, cardColor: '' }))}
                      className="color-reset-btn"
                      title="Reset"
                    >
                      ↺
                    </button>
                  </div>
                </div>
              </div> */}
                                                                                  {/* </div> */}

                                                                                  {/* Profile Blur */}
                                                                                  {/* <div className="form-group slider-group">
              <label>Profile Blur</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profileBlur}
                  onChange={(e) => setProfileBlur(e.target.value)}
                  className="slider"
                />
                <div className="slider-markers">
                  <span>20px</span>
                  <span>50px</span>
                  <span>80px</span>
                <div className="tile-field">
                  <label>Background Effect</label>
                  <div className="tile-effect-row">
                    <select
                      name="effect"
                      value={formData.effect}
                      onChange={(e) => {
                        handleChange(e);
                        const selected = e.target.value;
                        if (selected !== 'none') {
                          setPreviewEffect(selected);
                        }
                      }}
                      className="custom-select"
                    >
                      <option value="none">None</option>
                      <option value="snow">Snow</option>
                      <option value="particles">Particles</option>
                      <option value="confetti">Confetti</option>
                      <option value="fireworks">Fireworks</option>
                      <option value="rain">Rain (Premium)</option>
                      <option value="stars">Stars (Premium)</option>
                      <option value="leaves">Leaves (Premium)</option>
                      <option value="aurora">Aurora (Premium)</option>
                      <option value="matrix">Matrix (Premium)</option>
                      <option value="nebula">Nebula (Premium)</option>
                    </select>
                    {formData.effect !== 'none' && (
                      <button
                        type="button"
                        className="tile-preview-btn"
                        onClick={() => {
                          setPreviewEffect(formData.effect);
                          setShowPreview(true);
                        }}
                      >
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div> */}

                                                                                  {/* Background Effects */}
                                                                                  <div className="form-group">
                                                                                    <label>
                                                                                      <span>Background Effects</span>

                                                                                    </label>
                                                                                    <div className="effect-select-wrapper">
                                                                                      <select
                                                                                        name="effect"
                                                                                        value={formData.effect}
                                                                                        onChange={(e) => {
                                                                                          handleChange(e);
                                                                                          const selectedEffect = e.target.value;
                                                                                          if (selectedEffect !== 'none') {
                                                                                            setPreviewEffect(selectedEffect);
                                                                                            setShowPreview(true);
                                                                                          } else {
                                                                                            setShowPreview(false);
                                                                                          }
                                                                                        }}
                                                                                        onFocus={(e) => {
                                                                                          if (e.target.value !== 'none') {
                                                                                            setPreviewEffect(e.target.value);
                                                                                            setShowPreview(true);
                                                                                          }
                                                                                        }}
                                                                                        className="custom-select"
                                                                                      >
                                                                                        <option value="none">Choose an option</option>
                                                                                        <option value="snow">Snow</option>
                                                                                        <option value="particles">Particles</option>
                                                                                        <option value="confetti">Confetti</option>
                                                                                        <option value="fireworks">Fireworks</option>
                                                                                        <option value="rain">Rain (Premium)</option>
                                                                                        <option value="stars">Stars (Premium)</option>
                                                                                        <option value="leaves">Leaves (Premium)</option>
                                                                                        <option value="aurora">Aurora (Premium)</option>
                                                                                        <option value="matrix">Matrix (Premium)</option>
                                                                                        <option value="nebula">Nebula (Premium)</option>
                                                                                      </select>
                                                                                      {showPreview && previewEffect && previewEffect !== 'none' && (
                                                                                        <div className="effect-preview-modal" onClick={() => setShowPreview(false)}>
                                                                                          <div className="effect-preview-content" onClick={(e) => e.stopPropagation()}>
                                                                                            <div className="preview-header">
                                                                                              <h3>Effect Preview</h3>
                                                                                              <button
                                                                                                className="close-preview-btn"
                                                                                                onClick={() => setShowPreview(false)}
                                                                                              >
                                                                                                ✕
                                                                                              </button>
                                                                                            </div>
                                                                                            <div className="preview-container">
                                                                                              {previewEffect === 'snow' && <SnowEffect />}
                                                                                              {previewEffect === 'rain' && <RainEffect />}
                                                                                              {previewEffect === 'stars' && <StarsEffect />}
                                                                                              {previewEffect === 'particles' && <ParticlesEffect />}
                                                                                              {previewEffect === 'leaves' && <LeavesEffect />}
                                                                                              {previewEffect === 'aurora' && <AuroraEffect />}
                                                                                              {previewEffect === 'fireworks' && <FireworksEffect />}
                                                                                              {previewEffect === 'matrix' && <MatrixEffect />}
                                                                                              {previewEffect === 'confetti' && <ConfettiEffect />}
                                                                                              {previewEffect === 'nebula' && <NebulaEffect />}
                                                                                              {previewEffect && ['rain', 'stars', 'leaves', 'aurora', 'matrix', 'nebula'].includes(previewEffect) && !isPremium && (
                                                                                                <div className="preview-locked-overlay">
                                                                                                  <div className="locked-icon"></div>
                                                                                                  <p>Premium Effect</p>
                                                                                                  <p className="preview-note">Bạn có thể xem preview nhưng cần Premium để sử dụng</p>
                                                                                                  <button
                                                                                                    className="unlock-preview-btn"
                                                                                                    onClick={() => {
                                                                                                      setShowPreview(false);
                                                                                                      navigate('/premium');
                                                                                                    }}
                                                                                                  >
                                                                                                    Unlock Premium
                                                                                                  </button>
                                                                                                </div>
                                                                                              )}
                                                                                            </div>
                                                                                            {isPremium && (
                                                                                              <div className="tile-field-row" style={{ marginTop: 8 }}>
                                                                                                <div className="tile-field">
                                                                                                  <label>Font Family <span className="tile-pro-tag">PRO</span></label>
                                                                                                  <select
                                                                                                    value={textFontFamily}
                                                                                                    onChange={(e) => setTextFontFamily(e.target.value)}
                                                                                                    className="custom-select"
                                                                                                  >
                                                                                                    <option value="Arial">Arial</option>
                                                                                                    <option value="Georgia">Georgia</option>
                                                                                                    <option value="Times New Roman">Times New Roman</option>
                                                                                                    <option value="Courier New">Courier New</option>
                                                                                                    <option value="Verdana">Verdana</option>
                                                                                                    <option value="Impact">Impact</option>
                                                                                                    <option value="Trebuchet MS">Trebuchet MS</option>
                                                                                                    <option value="Monaco">Monaco</option>
                                                                                                  </select>
                                                                                                </div>
                                                                                                <div className="tile-field" style={{ justifyContent: 'flex-end' }}>
                                                                                                  <label className="checkbox-label" style={{ marginTop: 18 }}>
                                                                                                    <input
                                                                                                      type="checkbox"
                                                                                                      checked={text3DEffect}
                                                                                                      onChange={(e) => setText3DEffect(e.target.checked)}
                                                                                                    />
                                                                                                    <span>3D Text Effect</span>
                                                                                                  </label>
                                                                                                </div>
                                                                                              </div>
                                                                                            )}
                                                                                          </div>
                                                                                          {!isPremium && (
                                                                                            <div className="premium-lock-message">
                                                                                              Premium users get 6 exclusive effects: Rain, Stars, Leaves, Aurora, Matrix, Nebula! <button type="button" onClick={() => navigate('/premium')} className="premium-link">Unlock Premium</button>
                                                                                            </div>
                                                                                          )}
                                                                                        </div>

            {/* Premium Text Styling */}
                                                                                      {isPremium && (
              <>
                                                                                          {/* Font Family */}
                                                                                          <div className="form-group">
                                                                                            <label>
                                                                                              <span>Font Family</span>
                                                                                              <span className="premium-badge">
                                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                                                                                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                                                                </svg>
                                                                                                Premium
                                                                                              </span>
                                                                                            </label>
                                                                                            <select
                                                                                              value={textFontFamily}
                                                                                              onChange={(e) => setTextFontFamily(e.target.value)}
                                                                                              className="custom-select"
                                                                                            >
                                                                                              <option value="Arial">Arial</option>
                                                                                              <option value="Georgia">Georgia</option>
                                                                                              <option value="Times New Roman">Times New Roman</option>
                                                                                              <option value="Courier New">Courier New</option>
                                                                                              <option value="Verdana">Verdana</option>
                                                                                              <option value="Impact">Impact</option>
                                                                                              <option value="Comic Sans MS">Comic Sans MS</option>
                                                                                              <option value="Trebuchet MS">Trebuchet MS</option>
                                                                                              <option value="Lucida Console">Lucida Console</option>
                                                                                              <option value="Palatino">Palatino</option>
                                                                                              <option value="Garamond">Garamond</option>
                                                                                              <option value="Bookman">Bookman</option>
                                                                                              <option value="Courier">Courier</option>
                                                                                              <option value="Monaco">Monaco</option>
                                                                                              <option value="Helvetica">Helvetica</option>
                                                                                            </select>
                                                                                            {/* 8. THẺ HOẠT ĐỘNG DISCORD-STYLE (PRESENCE CARD) */}
                                                                                            <div className={`editor-tile ${pinnedTile === 'presence' ? 'is-pinned' : ''}`}>
                                                                                              <div className="tile-head" onClick={() => toggleTile('presence')}>
                                                                                                <div className="tile-icon">
                                                                                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                                    <rect x="2" y="6" width="20" height="12" rx="3" />
                                                                                                    <line x1="6" y1="12" x2="10" y2="12" />
                                                                                                    <line x1="8" y1="10" x2="8" y2="14" />
                                                                                                    <circle cx="15" cy="11" r="1" />
                                                                                                    <circle cx="17" cy="13" r="1" />
                                                                                                  </svg>
                                                                                                </div>
                                                                                                <div className="tile-meta">
                                                                                                  <h3>{t(language, 'profileEditor.presenceCard')}</h3>
                                                                                                  <span className="tile-summary">
                                                                                                    {formData.presenceTitle
                                                                                                      ? `${formData.presenceType}: ${formData.presenceTitle}`
                                                                                                      : language === 'vi' ? 'Trạng thái kiểu Discord' : 'Discord-style activity'}
                                                                                                  </span>
                                                                                                </div>
                                                                                                <span className="tile-chevron">⌄</span>
                                                                                              </div>

                                                                                              {/* 3D Text Effect */}
                                                                                              <div className="form-group">
                                                                                                <label>
                                                                                                  <span>3D Text Effect</span>
                                                                                                  <span className="premium-badge">
                                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                                                                                                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                                                                    </svg>
                                                                                                    Premium
                                                                                                  </span>
                                                                                                </label>
                                                                                                <div className="checkbox-group">
                                                                                                  <label className="checkbox-label">
                                                                                                    <input
                                                                                                      type="checkbox"
                                                                                                      checked={text3DEffect}
                                                                                                      onChange={(e) => setText3DEffect(e.target.checked)}
                                                                                                    />
                                                                                                    <span>Enable 3D Effect</span>
                                                                                                  </label>
                                                                                                  <div className="tile-body">
                                                                                                    <div className="tile-field-row">
                                                                                                      <div className="tile-field">
                                                                                                        <label>{t(language, 'profileEditor.presenceType')}</label>
                                                                                                        <select
                                                                                                          name="presenceType"
                                                                                                          value={formData.presenceType}
                                                                                                          onChange={handleChange}
                                                                                                          className="custom-select"
                                                                                                        >
                                                                                                          <option value="playing">{t(language, 'profileEditor.activityPlaying')}</option>
                                                                                                          <option value="listening">{t(language, 'profileEditor.activityListening')}</option>
                                                                                                          <option value="watching">{t(language, 'profileEditor.activityWatching')}</option>
                                                                                                          <option value="streaming">{t(language, 'profileEditor.activityStreaming')}</option>
                                                                                                          <option value="competing">{t(language, 'profileEditor.activityCompeting')}</option>
                                                                                                        </select>
                                                                                                      </div>
                                                                                                      <div className="tile-field">
                                                                                                        <label>Icon (Game / Code)</label>
                                                                                                        <select
                                                                                                          name="presenceIcon"
                                                                                                          value={formData.presenceIcon}
                                                                                                          onChange={handleChange}
                                                                                                          className="custom-select"
                                                                                                        >
                                                                                                          <option value="">None (Use Avatar)</option>
                                                                                                          <optgroup label="Games">
                                                                                                            <option value="fivem">FiveM</option>
                                                                                                            <option value="pubg">PUBG</option>
                                                                                                            <option value="lol">League of Legends</option>
                                                                                                            <option value="valorant">Valorant</option>
                                                                                                            <option value="csgo">CS:GO</option>
                                                                                                            <option value="minecraft">Minecraft</option>
                                                                                                            <option value="roblox">Roblox</option>
                                                                                                          </optgroup>
                                                                                                          <optgroup label="Coding">
                                                                                                            <option value="lua">Lua</option>
                                                                                                            <option value="html">HTML</option>
                                                                                                            <option value="css">CSS</option>
                                                                                                            <option value="js">JavaScript</option>
                                                                                                            <option value="react">React</option>
                                                                                                            <option value="python">Python</option>
                                                                                                            <option value="cpp">C++</option>
                                                                                                          </optgroup>
                                                                                                        </select>
                                                                                                      </div>
                                                                                                    </div>



                                                                                                  </>
            )}

                                                                                                  {/* Custom Cursor */}
                                                                                                  {/* <div className="form-group">
              <label>
                <span>Custom Cursor</span>
                <span className="premium-badge">💎 Premium</span>
              </label>
              <select
                value={formData.cursorIcon}
                onChange={(e) => setFormData(prev => ({ ...prev, cursorIcon: e.target.value }))}
                className="custom-select"
                disabled={!isPremium}
              >
                <option value="">Default Cursor</option>
                <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/icon_1.png">Icon 1</option>
              </select>
              {!isPremium && (
                <div className="premium-lock-message">
                  Unlock Premium to customize cursor! <Link to="/premium" className="premium-link">Unlock Premium</Link>
                <div className="tile-field-row">
                  <div className="tile-field">
                    <label>{t(language, 'profileEditor.presenceTitle')}</label>
                    <input
                      type="text"
                      name="presenceTitle"
                      value={formData.presenceTitle}
                      onChange={handleChange}
                      placeholder="Visual Studio Code / Valorant"
                    />
                  </div>
                  <div className="tile-field">
                    <label>{t(language, 'profileEditor.presenceSubtitle')}</label>
                    <input
                      type="text"
                      name="presenceSubtitle"
                      value={formData.presenceSubtitle}
                      onChange={handleChange}
                      placeholder="Editing globals.css"
                    />
                  </div>
                </div>
              )}
            </div> */}

                                                                                                  {/* Username and Display Name */}
                                                                                                  <div className="form-row">
                                                                                                    <div className="form-group">
                                                                                                      <label>Username *</label>
                                                                                                      <input
                                                                                                        type="text"
                                                                                                        name="username"
                                                                                                        value={formData.username}
                                                                                                        onChange={handleChange}
                                                                                                        required
                                                                                                        placeholder="username"
                                                                                                        pattern="[a-z0-9]+"
                                                                                                      />
                                                                                                    </div>
                                                                                                    <div className="form-group">
                                                                                                      <label>Display Name *</label>
                                                                                                      <input
                                                                                                        type="text"
                                                                                                        name="displayName"
                                                                                                        value={formData.displayName}
                                                                                                        onChange={handleChange}
                                                                                                        required
                                                                                                        placeholder="Display Name"
                                                                                                      />
                                                                                                    </div>
                                                                                                  </div>

                                                                                                  {/* Social Links */}
                                                                                                  <div className="form-group">
                                                                                                    <label>Social Links</label>
                                                                                                    <select
                                                                                                      value={selectedSocialLink}
                                                                                                      onChange={(e) => setSelectedSocialLink(e.target.value)}
                                                                                                      className="custom-select"
                                                                                                    >
                                                                                                      <option value="">Choose an option</option>
                                                                                                      <option value="facebook">Facebook</option>
                                                                                                      <option value="instagram">Instagram</option>
                                                                                                      <option value="twitter">Twitter</option>
                                                                                                      <option value="linkedin">LinkedIn</option>
                                                                                                      <option value="tiktok">TikTok</option>
                                                                                                    </select>
                                                                                                    {selectedSocialLink && (
                                                                                                      <div className="form-group" style={{ marginTop: '10px' }}>
                                                                                                        <label>
                                                                                                          {selectedSocialLink.charAt(0).toUpperCase() + selectedSocialLink.slice(1)} URL
                                                                                                          <button
                                                                                                            type="button"
                                                                                                            onClick={() => setSelectedSocialLink('')}
                                                                                                            style={{
                                                                                                              marginLeft: '10px',
                                                                                                              background: 'transparent',
                                                                                                              border: 'none',
                                                                                                              color: '#999',
                                                                                                              cursor: 'pointer',
                                                                                                              fontSize: '14px'
                                                                                                            }}
                                                                                                            title="Đóng"
                                                                                                          >
                                                                                                            ✕
                                                                                                          </button>
                                                                                                        </label>
                                                                                                        <input
                                                                                                          type="url"
                                                                                                          name={`social.${selectedSocialLink}`}
                                                                                                          value={formData.socialLinks[selectedSocialLink] || ''}
                                                                                                          onChange={handleChange}
                                                                                                          placeholder={
                                                                                                            selectedSocialLink === 'facebook' ? 'https://facebook.com/...' :
                                                                                                              selectedSocialLink === 'instagram' ? 'https://instagram.com/...' :
                                                                                                                selectedSocialLink === 'twitter' ? 'https://twitter.com/...' :
                                                                                                                  selectedSocialLink === 'linkedin' ? 'https://linkedin.com/in/...' :
                                                                                                                    'https://tiktok.com/@...'
                                                                                                          }
                                                                                                        />
                                                                                                        {/* 9. LIÊN KẾT MẠNG XÃ HỘI (SOCIAL LINKS) */}
                                                                                                        <div className={`editor-tile ${pinnedTile === 'socials' ? 'is-pinned' : ''}`}>
                                                                                                          <div className="tile-head" onClick={() => toggleTile('socials')}>
                                                                                                            <div className="tile-icon">
                                                                                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                                                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                                                                              </svg>
                                                                                                            </div>
              )}
                                                                                                            <div className="tile-meta">
                                                                                                              <h3>Social Links</h3>
                                                                                                              <span className="tile-summary">
                                                                                                                {activeSocialCount > 0
                                                                                                                  ? `${activeSocialCount} ${language === 'vi' ? 'liên kết đã thêm' : 'links connected'}`
                                                                                                                  : language === 'vi' ? 'Chưa thêm mạng xã hội' : 'No social links yet'}
                                                                                                              </span>
                                                                                                            </div>
                                                                                                            <span className="tile-chevron">⌄</span>
                                                                                                          </div>

                                                                                                          <div className="tile-body">
                                                                                                            <div className="tile-socials-list">
                                                                                                              {SOCIAL_FIELDS.map((s) => (
                                                                                                                <div key={s.key} className="tile-social-item">
                                                                                                                  <span>{s.label}</span>
                                                                                                                  <input
                                                                                                                    type="url"
                                                                                                                    name={`social.${s.key}`}
                                                                                                                    value={formData.socialLinks[s.key] || ''}
                                                                                                                    onChange={handleChange}
                                                                                                                    placeholder={s.placeholder}
                                                                                                                  />
                                                                                                                </div>
                                                                                                              ))}
                                                                                                            </div>
                                                                                                          </div>
                                                                                                        </div>
                                                                                                      </div>
        </form>

                                                                                                  {/* Form Actions */}
                                                                                                  <div className="form-actions">
                                                                                                    <button type="button" onClick={() => navigate('/dashboard')} className="cancel-btn">
                                                                                                      {t(language, 'profileEditor.cancel')}
                                                                                                    </button>
                                                                                                    <button type="submit" disabled={loading || uploading} className="save-btn">
                                                                                                      {uploading ? (language === 'vi' ? 'Đang tải lên...' : 'Uploading...') : loading ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : t(language, 'profileEditor.save')}
                                                                                                    </button>
                                                                                                    {/* Modal xem thử hiệu ứng */}
                                                                                                    {showPreview && previewEffect && previewEffect !== 'none' && (
                                                                                                      <div className="effect-preview-modal" onClick={() => setShowPreview(false)}>
                                                                                                        <div className="effect-preview-content" onClick={(e) => e.stopPropagation()}>
                                                                                                          <div className="preview-header">
                                                                                                            <h3>Effect Preview: {previewEffect}</h3>
                                                                                                            <button
                                                                                                              type="button"
                                                                                                              className="close-preview-btn"
                                                                                                              onClick={() => setShowPreview(false)}
                                                                                                            >
                                                                                                              ✕
                                                                                                            </button>
                                                                                                          </div>
                                                                                                          <div className="preview-container">
                                                                                                            {previewEffect === 'snow' && <SnowEffect />}
                                                                                                            {previewEffect === 'rain' && <RainEffect />}
                                                                                                            {previewEffect === 'stars' && <StarsEffect />}
                                                                                                            {previewEffect === 'particles' && <ParticlesEffect />}
                                                                                                            {previewEffect === 'leaves' && <LeavesEffect />}
                                                                                                            {previewEffect === 'aurora' && <AuroraEffect />}
                                                                                                            {previewEffect === 'fireworks' && <FireworksEffect />}
                                                                                                            {previewEffect === 'matrix' && <MatrixEffect />}
                                                                                                            {previewEffect === 'confetti' && <ConfettiEffect />}
                                                                                                            {previewEffect === 'nebula' && <NebulaEffect />}
                                                                                                          </div>
                                                                                                        </div>
                                                                                                      </div>
        </form>
        )}
                                                                                                </main>
                                                                                              </div>
                                                                                              );
}

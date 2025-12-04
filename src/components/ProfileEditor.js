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
  const [activeSection, setActiveSection] = useState('customize');
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
  const [selectedSocialLink, setSelectedSocialLink] = useState('');
  const [viewCount, setViewCount] = useState(0);
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    avatar: '',
    avatarFrame: '', // Khung avatar
    coverImage: '',
    backgroundImage: '',
    backgroundVideo: '', // Premium: YouTube video as background
    musicUrl: '',
    effect: 'none',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      tiktok: ''
    },
    // Card customization fields
    jobTitle: '',
    status: '',
    turma: '',
    hashtags: [],
    cardColor: '', // Màu thẻ, để trống sẽ dùng màu mặc định
    cursorIcon: '' // Custom cursor icon
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
          
          // Check premium status
          const premiumExpiresAt = profileData.premiumExpiresAt?.toDate ? 
            profileData.premiumExpiresAt.toDate() : 
            (profileData.premiumExpiresAt ? new Date(profileData.premiumExpiresAt) : null);
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
            cursorIcon: profileData.cursorIcon || ''
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
        );
        if (confirmUpgrade) {
          navigate('/premium');
        }
        setLoading(false);
        return;
      }

      // Check if user selected background video without Premium
      if (formData.backgroundVideo && !isPremium) {
        const confirmUpgrade = window.confirm(
          ' Tính năng Premium!\n\n' +
          'Background Video chỉ dành cho tài khoản Premium.\n\n' +
          'Bạn có muốn nâng cấp lên Premium để sử dụng tính năng này không?'
        );
        if (confirmUpgrade) {
          navigate('/premium');
        }
        setLoading(false);
        return;
      }

      const normalizedUsername = formData.username.toLowerCase().trim();
      
      // Clean hashtags - remove empty strings and ensure valid array
      const cleanHashtags = Array.isArray(formData.hashtags) 
        ? formData.hashtags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
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
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      const processedValue = name === 'username' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : value;
      setFormData(prev => ({
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
          ...prev,
          [type]: url
        }));
      }
    }
  }

  function handleRemoveImage(type) {
    setFormData(prev => ({
      ...prev,
      [type]: ''
    }));
  }

  const profileLink = formData.username 
    ? `${window.location.origin}/${formData.username}`
    : null;

  return (
    <div className="profile-editor-layout">
      {/* Sidebar */}
      <aside className="editor-sidebar">
        <div className="sidebar-header">
          <div className="logo-icon"></div>
          <span className="logo-text">KonOne</span>
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
          </div>
          <div className={`nav-item ${activeSection === 'customize' ? 'active' : ''}`} onClick={() => setActiveSection('customize')}>
            <span className="nav-icon"></span> {t(language, 'profileEditor.customize')}
          </div>
       
        </nav>

        <div className="sidebar-footer">
      
          <button 
            className="footer-btn my-page-btn"
            onClick={() => profileLink && window.open(profileLink, '_blank')}
            disabled={!profileLink}
          >
            <span className="btn-icon"></span> My Page
          </button>
          <button 
            className="footer-btn share-btn"
            onClick={() => profileLink && navigator.share?.({ url: profileLink })}
            disabled={!profileLink}
          >
            <span className="btn-icon"></span> Share Your Profile
          </button>
          <div className="user-info">
            <div className="user-name">{formData.username || 'No username'}</div>
            <div className="user-uid">UID {currentUser?.uid?.slice(0, 8) || 'N/A'}</div>
            <div className="user-views" style={{ fontSize: '12px', color: '#999', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              {viewCount.toLocaleString()} views
            </div>
            <span className="user-menu">⋯</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
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
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span className="placeholder-text">Click to upload a file</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio */}
              <div className="media-card">
                <div className="media-card-header">
                  <span className="media-label">Audio</span>
                </div>
                <div className="media-preview">
                  <div className="media-placeholder">
                    <input
                      type="url"
                      name="musicUrl"
                      value={formData.musicUrl}
                      onChange={handleChange}
                      placeholder="YouTube URL"
                      className="audio-input"
                    />
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon" style={{ width: '32px', height: '32px', opacity: 0.5 }}>
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                    <span className="placeholder-text">Only enter the YouTube URL here</span>
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
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      Premium
                    </span>
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
                      
                      <span className="video-text">YouTube Video Background</span>
                      <span className="file-format">VIDEO</span>
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
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'avatar')}
                        disabled={uploadingAvatar}
                        className="media-input"
                      />
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon" style={{ width: '32px', height: '32px', opacity: 0.5 }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span className="placeholder-text">Click to upload a file</span>
                    </div>
                  )}
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
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
                    </div>
                  )}
                  {formData.coverImage ? (
                    <>
                      <img src={formData.coverImage} alt="Cover" />
                      <span className="file-format">UPLOAD</span>
                    </>
                  ) : (
                    <div className="media-placeholder">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'coverImage')}
                        disabled={uploadingCover}
                        className="media-input"
                      />
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="placeholder-icon" style={{ width: '32px', height: '32px', opacity: 0.5 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span className="placeholder-text">
                        Click to upload cover image
                      </span>
                    </div>
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
                </div>
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
              </div>
            </div>

            {/* Discord Presence */}
           

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
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
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
                </div>

                {/* 3D Text Effect */}
                <div className="form-group">
                  <label>
                    <span>3D Text Effect</span>
                    <span className="premium-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
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
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/dashboard')} className="cancel-btn">
              {t(language, 'profileEditor.cancel')}
            </button>
            <button type="submit" disabled={loading || uploading} className="save-btn">
              {uploading ? (language === 'vi' ? 'Đang tải lên...' : 'Uploading...') : loading ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : t(language, 'profileEditor.save')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

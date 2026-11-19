import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import LanyardCard from './LanyardCard';
import './LayoutEditor.css';

const LayoutEditor = () => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [strapColor, setStrapColor] = useState('#dc2626');
  const [cardBgColor, setCardBgColor] = useState('#18161c');
  const [badgeLabel, setBadgeLabel] = useState('KONONE PASS');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          const data = profileDoc.data();
          setProfile({ id: profileDoc.id, ...data });
          if (data.lanyardStrapColor) setStrapColor(data.lanyardStrapColor);
          if (data.lanyardCardColor || data.cardColor) setCardBgColor(data.lanyardCardColor || data.cardColor);
          if (data.lanyardBadgeLabel) setBadgeLabel(data.lanyardBadgeLabel);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleLayoutSelect = async (layoutType, extraFields = {}) => {
    if (!currentUser || !profile?.id || saving) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'profiles', profile.id);
      const updatePayload = {
        layout: layoutType,
        lanyardStrapColor: strapColor,
        lanyardCardColor: cardBgColor,
        cardColor: cardBgColor,
        lanyardBadgeLabel: badgeLabel,
        ...extraFields
      };
      await updateDoc(docRef, updatePayload);
      setProfile((prev) => ({ ...prev, ...updatePayload }));
      setMessage({
        type: 'success',
        text: language === 'vi' ? 'Đã cập nhật bố cục!' : 'Layout updated!'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating layout:', error);
      setMessage({
        type: 'error',
        text: language === 'vi' ? 'Lỗi khi cập nhật bố cục' : 'Error updating layout'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="layout-editor-loading">
        <div className="spinner"></div>
        <p>{t(language, 'dashboard.loading') || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="layout-editor-page">
      <div className="layout-editor-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {language === 'vi' ? 'Quay lại Dashboard' : 'Back to Dashboard'}
        </button>
        <h1>{t(language, 'dashboard.layout')}</h1>
      </div>

      <div className="layout-editor-container">
        <div className="layout-intro">
          <h2>{language === 'vi' ? 'Chọn bố cục hồ sơ' : 'Choose Profile Layout'}</h2>
          <p>{language === 'vi' ? 'Chọn cách hiển thị thông tin trên trang hồ sơ công khai của bạn.' : 'Select how your information is displayed on your public profile page.'}</p>
        </div>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="layout-options-grid">
          {/* 1. Card Layout */}
          <div
            className={`layout-option-card ${(!profile?.layout || profile?.layout === 'card') ? 'active' : ''}`}
            onClick={() => handleLayoutSelect('card')}
          >
            <div className="layout-preview classic-preview">
              <div className="preview-content">
                <div className="preview-banner"></div>
                <div className="preview-avatar"></div>
                <div className="preview-lines">
                  <div className="line long"></div>
                  <div className="line medium"></div>
                  <div className="line short"></div>
                </div>
              </div>
            </div>
            <div className="layout-info">
              <h3>{language === 'vi' ? 'Bố cục Thẻ (Mặc định)' : 'Card Layout (Default)'}</h3>
              <p>{language === 'vi' ? 'Giao diện truyền thống với thẻ thông tin nằm trên nền banner.' : 'Traditional interface with info card over a banner background.'}</p>
              <div className="select-badge">
                {(!profile?.layout || profile?.layout === 'card')
                  ? (language === 'vi' ? 'Đang chọn' : 'Selected')
                  : (language === 'vi' ? 'Chọn' : 'Select')}
              </div>
            </div>
          </div>

          {/* 2. Modern Layout */}
          <div
            className={`layout-option-card ${profile?.layout === 'modern' ? 'active' : ''}`}
            onClick={() => handleLayoutSelect('modern')}
          >
            <div className="layout-preview modern-preview">
              <div className="preview-content">
                <div className="preview-avatar-centered"></div>
                <div className="preview-lines centered">
                  <div className="line long"></div>
                  <div className="line medium"></div>
                </div>
                <div className="preview-presence"></div>
              </div>
            </div>
            <div className="layout-info">
              <h3>{language === 'vi' ? 'Bố cục Hiện đại' : 'Modern Layout'}</h3>
              <p>{language === 'vi' ? 'Giao diện tập trung, hiện đại với Avatar ở giữa và Presence Card.' : 'Focused, modern interface with centered Avatar and Presence Card.'}</p>
              <div className="select-badge">
                {profile?.layout === 'modern'
                  ? (language === 'vi' ? 'Đang chọn' : 'Selected')
                  : (language === 'vi' ? 'Chọn' : 'Select')}
              </div>
            </div>
          </div>

          {/* 3. ReactBits 3D Hanging Lanyard Card Layout */}
          <div
            className={`layout-option-card lanyard-option-card ${profile?.layout === 'lanyard' ? 'active' : ''}`}
            onClick={() => handleLayoutSelect('lanyard')}
          >
            <div className="layout-preview lanyard-mini-preview">
              <div className="mini-lanyard-rope" />
              <div className="mini-lanyard-clip" />
              <div className="mini-lanyard-pass">
                <div className="mini-pass-slot" />
                <div className="mini-pass-avatar" />
                <div className="mini-pass-line long" />
                <div className="mini-pass-line short" />
                <div className="mini-pass-barcode" />
              </div>
              <span className="lanyard-3d-tag">3D PHYSICS</span>
            </div>
            <div className="layout-info">
              <h3>{language === 'vi' ? 'Thẻ 3D Treo Lơ Lửng (ReactBits)' : '3D Hanging Lanyard Card'}</h3>
              <p>
                {language === 'vi'
                  ? 'Tấm thẻ ID 3D treo trên dây đeo có mô phỏng vật lý con lắc, hỗ trợ kéo thả đung đưa và hiệu ứng ánh sáng Hologram.'
                  : 'Interactive 3D hanging ID card with spring pendulum physics, drag-and-release swing, and holographic glare.'}
              </p>
              <div className="select-badge">
                {profile?.layout === 'lanyard'
                  ? (language === 'vi' ? 'Đang chọn' : 'Selected')
                  : (language === 'vi' ? 'Chọn' : 'Select')}
              </div>
            </div>
          </div>

          {/* 4. Bố cục WEB (Scrollable Web Portfolio with Left Vertical Poster & Right Intro) */}
          <div
            className={`layout-option-card ${profile?.layout === 'web' ? 'active' : ''}`}
            onClick={() => handleLayoutSelect('web')}
          >
            <div className="layout-preview modern-preview">
              <div className="preview-content" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 7, background: '#f65c5c', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div className="line long" />
                    <div className="line medium" />
                  </div>
                </div>
                <div style={{ height: 2, width: '100%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 46, borderRadius: 5, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div className="line long" />
                    <div className="line medium" />
                    <div className="line short" />
                  </div>
                </div>
              </div>
              <span className="lanyard-3d-tag" style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: '#22c55e', color: '#86efac' }}>
                WEB SCROLL
              </span>
            </div>
            <div className="layout-info">
              <h3>{language === 'vi' ? 'Bố cục WEB' : 'WEB Layout'}</h3>
              <p>
                {language === 'vi'
                  ? 'Giao diện Web chuyên nghiệp có cuộn trang xuống: phần đầu hiển thị Avatar vuông & Tên phát sáng, bên dưới là Poster đứng bên trái và chữ giới thiệu bên phải.'
                  : 'Scrollable Web layout: top hero with square avatar & glowing title, scrolling down to a vertical poster on the left and introduction text on the right.'}
              </p>
              <div className="select-badge">
                {profile?.layout === 'web'
                  ? (language === 'vi' ? 'Đang chọn' : 'Selected')
                  : (language === 'vi' ? 'Chọn' : 'Select')}
              </div>
            </div>
          </div>
        </div>

        {/* Khu vực Tùy chỉnh & Tương tác thử trực tiếp với Thẻ 3D Lanyard */}
        <div className="lanyard-playground-section">
          <div className="lanyard-playground-info">
            <span className="playground-eyebrow">REACTBITS 3D LANYARD</span>
            <h3>
              {language === 'vi'
                ? 'Tùy chỉnh & Kéo thử Thẻ 3D Treo Lơ Lửng'
                : 'Customize & Test Your 3D Hanging Card'}
            </h3>
            <p>
              {language === 'vi'
                ? 'Nắm kéo tấm thẻ ở khung bên phải ra bất kỳ hướng nào rồi thả chuột để cảm nhận chuyển động đung đưa 3D.'
                : 'Grab and drag the card on the right in any direction, then release to experience the 3D pendulum swing.'}
            </p>

            <div className="lanyard-custom-controls">
              <div className="lanyard-ctrl-field">
                <label>{language === 'vi' ? 'Nhãn trên thẻ (Badge Title)' : 'Card Badge Title'}</label>
                <input
                  type="text"
                  maxLength={18}
                  value={badgeLabel}
                  onChange={(e) => setBadgeLabel(e.target.value)}
                  placeholder="KONONE PASS"
                />
              </div>

              <div className="lanyard-ctrl-field">
                <label>{language === 'vi' ? 'Màu nền tấm thẻ (Card Color)' : 'Card Body Color'}</label>
                <div className="lanyard-color-swatches">
                  {['#18161c', '#261419', '#1e1b2e', '#0f172a', '#14261c', '#291d12'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`strap-swatch ${cardBgColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setCardBgColor(c)}
                      aria-label={`Card Color ${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="strap-color-input"
                  />
                </div>
              </div>

              <div className="lanyard-ctrl-field">
                <label>{language === 'vi' ? 'Màu dây đeo thẻ (Strap Color)' : 'Lanyard Strap Color'}</label>
                <div className="lanyard-color-swatches">
                  {['#f65c5c', '#dc2626', '#a21caf', '#3b82f6', '#10b981', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`strap-swatch ${strapColor === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setStrapColor(c)}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={strapColor}
                    onChange={(e) => setStrapColor(e.target.value)}
                    className="strap-color-input"
                  />
                </div>
              </div>

              <button
                type="button"
                className="apply-lanyard-btn"
                disabled={saving}
                onClick={() =>
                  handleLayoutSelect('lanyard', {
                    lanyardStrapColor: strapColor,
                    lanyardCardColor: cardBgColor,
                    cardColor: cardBgColor,
                    lanyardBadgeLabel: badgeLabel
                  })
                }
              >
                {saving
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                  : (language === 'vi' ? 'Áp dụng Thẻ 3D Lanyard cho Hồ sơ' : 'Apply 3D Lanyard Layout')}
              </button>
            </div>
          </div>

          <div className="lanyard-playground-stage">
            <LanyardCard
              profile={profile || {}}
              interactive={true}
              compact={false}
              strapColor={strapColor}
              cardBgColor={cardBgColor}
              badgeLabel={badgeLabel || 'KONONE PASS'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutEditor;

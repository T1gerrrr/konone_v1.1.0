import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import './LayoutEditor.css';

const LayoutEditor = () => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return;
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const profileDoc = querySnapshot.docs[0];
          setProfile({ id: profileDoc.id, ...profileDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleLayoutSelect = async (layoutType) => {
    if (!currentUser || !profile?.id || saving) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'profiles', profile.id);
      await updateDoc(docRef, {
        layout: layoutType
      });
      setProfile(prev => ({ ...prev, layout: layoutType }));
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
          {/* Card Layout */}
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
                {(!profile?.layout || profile?.layout === 'card') ?
                  (language === 'vi' ? 'Đang chọn' : 'Selected') :
                  (language === 'vi' ? 'Chọn' : 'Select')}
              </div>
            </div>
          </div>

          {/* Modern Layout */}
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
                {profile?.layout === 'modern' ?
                  (language === 'vi' ? 'Đang chọn' : 'Selected') :
                  (language === 'vi' ? 'Chọn' : 'Select')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutEditor;

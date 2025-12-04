import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '../config/cloudinary';
import './ProfileTemplate.css';

export default function ProfileTemplate() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadingSection, setUploadingSection] = useState(null);
  
  // Template data
  const [templateData, setTemplateData] = useState({
    background: '',
    avatar: '',
    section1: '',
    section2: '',
    section3: '',
    section4: ''
  });

  const fileInputRefs = {
    background: useRef(null),
    avatar: useRef(null),
    section1: useRef(null),
    section2: useRef(null),
    section3: useRef(null),
    section4: useRef(null)
  };

  async function handleImageUpload(file, section) {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 10MB');
      return;
    }
    
    setUploading(true);
    setUploadingSection(section);
    try {
      const folder = `profiles/${currentUser.uid}/template/${section}`;
      const url = await uploadToCloudinary(file, folder);
      setTemplateData(prev => ({
        ...prev,
        [section]: url
      }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi khi tải ảnh lên: ' + error.message);
    } finally {
      setUploading(false);
      setUploadingSection(null);
    }
  }

  function handleSectionClick(section) {
    fileInputRefs[section]?.current?.click();
  }

  function handleFileChange(e, section) {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file, section);
    }
    // Reset input để có thể chọn lại file cùng tên
    e.target.value = '';
  }

  function handleRemoveImage(section) {
    setTemplateData(prev => ({
      ...prev,
      [section]: ''
    }));
  }

  function handleSaveTemplate() {
    // Lưu template vào localStorage hoặc Firestore
    localStorage.setItem('profileTemplate', JSON.stringify(templateData));
    alert('Template đã được lưu thành công!');
  }

  function handleApplyToProfile() {
    // Áp dụng template vào profile
    navigate('/edit-profile', { state: { templateData } });
  }

  return (
    <div className="profile-template-page">
      {/* Header */}
      <header className="template-header">
        <div className="template-header-content">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Quay lại
          </button>
          <h1 className="template-title">Profile Template</h1>
          <div className="template-actions">
            <button onClick={handleSaveTemplate} className="save-btn">
              💾 Lưu Template
            </button>
            <button onClick={handleApplyToProfile} className="apply-btn">
              ✨ Áp dụng vào Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="template-main">
        <div className="template-container">
          {/* Instructions */}
          <div className="template-instructions">
            <p>📌 Nhấn vào các vùng để upload ảnh tương ứng</p>
            <p>🖼️ Background: Nhấn vào nền để upload ảnh nền</p>
            <p>👤 Avatar: Nhấn vào avatar để upload ảnh đại diện</p>
            <p>📸 Sections: Nhấn vào các phần để upload ảnh</p>
          </div>

          {/* Template Preview */}
          <div className="template-preview-container">
            <div className="template-preview">
              {/* Background - Clickable */}
              <div 
                className={`template-background ${templateData.background ? 'has-image' : ''}`}
                onClick={() => handleSectionClick('background')}
                style={{
                  backgroundImage: templateData.background ? `url(${templateData.background})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {uploadingSection === 'background' && (
                  <div className="uploading-overlay">
                    <div className="upload-spinner"></div>
                    <p>Đang tải lên...</p>
                  </div>
                )}
                {!templateData.background && !uploadingSection && (
                  <div className="upload-hint">
                    <span className="hint-icon">🖼️</span>
                    <span className="hint-text">Nhấn để upload Background</span>
                  </div>
                )}
                {templateData.background && (
                  <button 
                    className="remove-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage('background');
                    }}
                  >
                    ✕
                  </button>
                )}
                <input
                  ref={fileInputRefs.background}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'background')}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Content Area */}
              <div className="template-content">
                {/* Avatar Section - Clickable */}
                <div 
                  className={`template-avatar-section ${templateData.avatar ? 'has-image' : ''}`}
                  onClick={() => handleSectionClick('avatar')}
                >
                  {uploadingSection === 'avatar' ? (
                    <div className="uploading-overlay">
                      <div className="upload-spinner"></div>
                    </div>
                  ) : templateData.avatar ? (
                    <>
                      <img src={templateData.avatar} alt="Avatar" />
                      <button 
                        className="remove-image-btn small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage('avatar');
                        }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="upload-hint">
                      <span className="hint-icon">👤</span>
                      <span className="hint-text">Avatar</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRefs.avatar}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Name Section */}
                <div className="template-name-section">
                  <h2 className="template-name">Your Name</h2>
                  <p className="template-username">@username</p>
                </div>

                {/* Sections Grid */}
                <div className="template-sections-grid">
                  {/* Section 1 */}
                  <div 
                    className={`template-section ${templateData.section1 ? 'has-image' : ''}`}
                    onClick={() => handleSectionClick('section1')}
                  >
                    {uploadingSection === 'section1' ? (
                      <div className="uploading-overlay">
                        <div className="upload-spinner"></div>
                      </div>
                    ) : templateData.section1 ? (
                      <>
                        <img src={templateData.section1} alt="Section 1" />
                        <button 
                          className="remove-image-btn small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage('section1');
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="upload-hint">
                        <span className="hint-icon">📸</span>
                        <span className="hint-text">Section 1</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRefs.section1}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'section1')}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Section 2 */}
                  <div 
                    className={`template-section ${templateData.section2 ? 'has-image' : ''}`}
                    onClick={() => handleSectionClick('section2')}
                  >
                    {uploadingSection === 'section2' ? (
                      <div className="uploading-overlay">
                        <div className="upload-spinner"></div>
                      </div>
                    ) : templateData.section2 ? (
                      <>
                        <img src={templateData.section2} alt="Section 2" />
                        <button 
                          className="remove-image-btn small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage('section2');
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="upload-hint">
                        <span className="hint-icon">📸</span>
                        <span className="hint-text">Section 2</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRefs.section2}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'section2')}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Section 3 */}
                  <div 
                    className={`template-section ${templateData.section3 ? 'has-image' : ''}`}
                    onClick={() => handleSectionClick('section3')}
                  >
                    {uploadingSection === 'section3' ? (
                      <div className="uploading-overlay">
                        <div className="upload-spinner"></div>
                      </div>
                    ) : templateData.section3 ? (
                      <>
                        <img src={templateData.section3} alt="Section 3" />
                        <button 
                          className="remove-image-btn small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage('section3');
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="upload-hint">
                        <span className="hint-icon">📸</span>
                        <span className="hint-text">Section 3</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRefs.section3}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'section3')}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Section 4 */}
                  <div 
                    className={`template-section ${templateData.section4 ? 'has-image' : ''}`}
                    onClick={() => handleSectionClick('section4')}
                  >
                    {uploadingSection === 'section4' ? (
                      <div className="uploading-overlay">
                        <div className="upload-spinner"></div>
                      </div>
                    ) : templateData.section4 ? (
                      <>
                        <img src={templateData.section4} alt="Section 4" />
                        <button 
                          className="remove-image-btn small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage('section4');
                          }}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="upload-hint">
                        <span className="hint-icon">📸</span>
                        <span className="hint-text">Section 4</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRefs.section4}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'section4')}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


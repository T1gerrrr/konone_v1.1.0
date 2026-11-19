import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { notifyError, notifySuccess } from '../notify/notify';
import { uploadToCloudinary } from '../config/cloudinary';
import './ProfileTemplate.css';

export default function ProfileTemplate() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();
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
      notifyError(L("Vui lòng chọn file ảnh", "Please choose an image file"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notifyError(L("Kích thước ảnh không được vượt quá 10MB", "Image size must not exceed 10MB"));
      return;
    }

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
      notifyError(L('Lỗi khi tải ảnh lên: ', 'Image upload failed: ') + error.message);
    } finally {
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
    notifySuccess(L("Template đã được lưu thành công!", "Template saved successfully!"));
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
            {L("← Quay lại", "← Back")}
          </button>
          <h1 className="template-title">{L("Mẫu hồ sơ", "Profile Template")}</h1>
          <div className="template-actions">
            <button onClick={handleSaveTemplate} className="save-btn">
              {L("💾 Lưu mẫu", "💾 Save Template")}
            </button>
            <button onClick={handleApplyToProfile} className="apply-btn">
              {L("✨ Áp dụng vào hồ sơ", "✨ Apply to Profile")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="template-main">
        <div className="template-container">
          {/* Instructions */}
          <div className="template-instructions">
            <p>{L("📌 Nhấn vào các vùng để tải ảnh tương ứng", "📌 Click each area to upload its image")}</p>
            <p>{L("🖼️ Nền: nhấn vào nền để tải ảnh nền", "🖼️ Background: click the background to upload")}</p>
            <p>{L("👤 Ảnh đại diện: nhấn vào avatar để tải ảnh", "👤 Avatar: click the avatar to upload")}</p>
            <p>{L("📸 Các phần: nhấn vào từng phần để tải ảnh", "📸 Sections: click a section to upload")}</p>
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
                    <p>{L("Đang tải lên...", "Uploading...")}</p>
                  </div>
                )}
                {!templateData.background && !uploadingSection && (
                  <div className="upload-hint">
                    <span className="hint-icon">🖼️</span>
                    <span className="hint-text">{L("Nhấn để tải ảnh nền", "Click to upload background")}</span>
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
                      <img src={templateData.avatar} alt={L("Ảnh đại diện", "Avatar")} />
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
                      <span className="hint-text">{L("Ảnh đại diện", "Avatar")}</span>
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
                  <h2 className="template-name">{L("Tên của bạn", "Your Name")}</h2>
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
                        <img src={templateData.section1} alt={L("Phần 1", "Section 1")} />
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
                        <span className="hint-text">{L("Phần 1", "Section 1")}</span>
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
                        <img src={templateData.section2} alt={L("Phần 2", "Section 2")} />
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
                        <span className="hint-text">{L("Phần 2", "Section 2")}</span>
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
                        <img src={templateData.section3} alt={L("Phần 3", "Section 3")} />
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
                        <span className="hint-text">{L("Phần 3", "Section 3")}</span>
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
                        <img src={templateData.section4} alt={L("Phần 4", "Section 4")} />
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
                        <span className="hint-text">{L("Phần 4", "Section 4")}</span>
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


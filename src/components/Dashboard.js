import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { t } from '../translations';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser, logout, sendVerificationEmail } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          setProfile({ id: querySnapshot.docs[0].id, ...profileData });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async function handleResendVerificationEmail() {
    if (!currentUser) return;

    try {
      setEmailStatus({ type: 'loading', message: t(language, 'dashboard.sendingEmail') });
      console.log('Resending verification email to:', currentUser.email);

      await sendVerificationEmail(currentUser, {
        url: window.location.origin + '/dashboard',
        handleCodeInApp: false
      });

      console.log('Verification email resent successfully');
      setEmailStatus({
        type: 'success',
        message: t(language, 'dashboard.emailSent', { email: currentUser.email })
      });

      // Clear message after 5 seconds
      setTimeout(() => setEmailStatus(null), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
      setEmailStatus({
        type: 'error',
        message: t(language, 'dashboard.emailError', { message: error.message, code: error.code })
      });
    }
  }

  const profileLink = profile
    ? `${window.location.origin}/${profile.username}`
    : null;

  if (loading) {
    return <div className="dashboard-loading">{t(language, 'dashboard.loading')}</div>;
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon"></span>
            <span className="logo-text">KONONE</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            <span className="nav-text">{t(language, 'dashboard.overview')}</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigate('/edit-layout')}
          >
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </span>
            <span className="nav-text">{t(language, 'dashboard.layout')}</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/premium')}>
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </span>
            <span className="nav-text">{t(language, 'dashboard.premium')}</span>
          </div>

          <div className="nav-item">
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span className="nav-text">{t(language, 'dashboard.templates')}</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-btn help-btn">
            <span className="btn-icon"></span>
            {t(language, 'dashboard.helpCenter')}
          </button>
          <button
            className="sidebar-btn page-btn"
            onClick={() => profileLink && window.open(profileLink, '_blank')}
          >
            <span className="btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </span>
            {t(language, 'dashboard.myPage')}
          </button>
          <button
            className="sidebar-btn share-btn"
            onClick={() => {
              if (profileLink) {
                navigator.clipboard.writeText(profileLink);
                alert(language === 'vi' ? 'Đã sao chép link!' : 'Link copied!');
              }
            }}
          >
            <span className="btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </span>
            {t(language, 'dashboard.shareProfile')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>{t(language, 'dashboard.title')}</h1>
          <div className="header-actions">
            <div className="language-selector">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="language-select"
              >
                <option value="vi">{t(language, 'dashboard.vietnamese')}</option>
                <option value="en">{t(language, 'dashboard.english')}</option>
              </select>
            </div>
            <span className="user-email">{currentUser.email}</span>
            <button onClick={handleLogout} className="logout-btn">{t(language, 'dashboard.logout')}</button>
          </div>
        </div>

        <div className="dashboard-content">
          {activeSection === 'overview' && (
            <section className="account-overview">
              <h2>{t(language, 'dashboard.accountOverview')}</h2>
              <div className="overview-cards">
                {profile?.username && (
                  <div className="overview-card">
                    <div className="card-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="card-content">
                      <div className="card-value">{profile.username}</div>
                      <div className="card-label">{t(language, 'dashboard.username')}</div>
                    </div>
                  </div>
                )}

                {profile?.displayName && (
                  <div className="overview-card">
                    <div className="card-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>
                    <div className="card-content">
                      <div className="card-value">{profile.displayName}</div>
                      <div className="card-label">{t(language, 'dashboard.displayName')}</div>
                    </div>
                  </div>
                )}

                <div className="overview-card">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <div className="card-content">
                    <div className="card-value">{currentUser.uid.slice(0, 8)}</div>
                    <div className="card-label">{t(language, 'dashboard.uid')}</div>
                  </div>
                </div>

                {profile?.email && (
                  <div className="overview-card">
                    <div className="card-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                    <div className="card-content">
                      <div className="card-value">{profile.email}</div>
                      <div className="card-label">{t(language, 'dashboard.email')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Card Preview */}
              {profile?.username && (
                <div className="profile-card-preview-section">
                  <h3>{t(language, 'dashboard.profilePreview') || 'Profile Preview'}</h3>
                  <div
                    className="profile-card-3d-preview"
                    style={{
                      borderColor: profile.cardColor ? `${profile.cardColor}66` : 'rgba(128, 128, 128, 0.11)'
                    }}
                  >
                    {profile.coverImage && (
                      <div
                        className="preview-cover"
                        style={{
                          backgroundImage: `url(${profile.coverImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          height: '150px'
                        }}
                      />
                    )}
                    <div className="preview-content">
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.displayName || profile.username}
                          className="preview-avatar"
                        />
                      ) : (
                        <div className="preview-avatar-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                      <h4 className="preview-name">{profile.displayName || profile.username}</h4>
                      {profile.bio && (
                        <p className="preview-bio">{profile.bio.substring(0, 100)}...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="quick-actions">
                <button
                  className="action-btn primary"
                  onClick={() => navigate('/edit-profile')}
                >
                  <span className="btn-icon"></span>
                  {t(language, 'dashboard.editProfile')}
                </button>
                {!profile?.username && (
                  <button
                    className="action-btn primary"
                    onClick={() => navigate('/edit-profile')}
                  >
                    <span className="btn-icon"></span>
                    {t(language, 'dashboard.createProfile')}
                  </button>
                )}
                {profile?.username && (
                  <button
                    className="action-btn"
                    onClick={() => window.open(`${window.location.origin}/${profile.username}`, '_blank')}
                  >
                    <span className="btn-icon"></span>
                    {t(language, 'dashboard.viewPublicProfile')}
                  </button>
                )}
              </div>

              {/* Email Verification Status */}
              {currentUser && !currentUser.emailVerified && (
                <section className="email-verification-alert">
                  <div className="alert-content">
                    <span className="alert-icon">📧</span>
                    <div className="alert-text">
                      <strong>{t(language, 'dashboard.emailNotVerified')}</strong>
                      <p>{t(language, 'dashboard.checkEmail', { email: currentUser.email })}</p>
                      <p className="alert-note">{t(language, 'dashboard.checkSpam')}</p>
                    </div>
                  </div>
                  {emailStatus && (
                    <div className={`email-status ${emailStatus.type}`}>
                      {emailStatus.message}
                    </div>
                  )}
                  <button
                    onClick={handleResendVerificationEmail}
                    className="resend-verification-btn"
                    disabled={emailStatus?.type === 'loading' || emailStatus?.type === 'error'}
                  >
                    {emailStatus?.type === 'loading'
                      ? t(language, 'dashboard.sendingEmail')
                      : emailStatus?.type === 'error' && emailStatus.message.includes('too-many-requests')
                        ? t(language, 'dashboard.waiting')
                        : t(language, 'dashboard.resendEmail')}
                  </button>
                  {emailStatus?.type === 'error' && emailStatus.message.includes('too-many-requests') && (
                    <p className="rate-limit-note">
                      {t(language, 'dashboard.rateLimitNote')}
                    </p>
                  )}
                </section>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

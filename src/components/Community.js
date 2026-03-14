import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import './Community.css';

export default function Community() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true);
        const profilesRef = collection(db, 'profiles');
        // Get profiles ordered by updatedAt descending
        const q = query(
          profilesRef,
          orderBy('updatedAt', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);

        const profilesList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Only show profiles that have a username
          if (data.username) {
            profilesList.push({
              id: doc.id,
              ...data
            });
          }
        });

        setProfiles(profilesList);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError(t(language, 'community.error', { error: error.message }));
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [language]);

  // Filter profiles based on search term
  const filteredProfiles = profiles.filter(profile => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.username?.toLowerCase().includes(searchLower) ||
      profile.displayName?.toLowerCase().includes(searchLower) ||
      profile.bio?.toLowerCase().includes(searchLower) ||
      profile.jobTitle?.toLowerCase().includes(searchLower)
    );
  });

  // Card color - default to magenta if not set
  const getCardColor = (profile) => profile.cardColor || '#C71585';

  return (
    <div className="community-page">
      {/* Header */}
      <header className="community-header">
        <div className="community-header-content">
          <Link to="/" className="community-logo">
            <img
              src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png"
              alt="KonOne Logo"
              className="logo-icon"
            />
            <span className="logo-text">KonOne</span>
          </Link>

          <div className="community-header-actions">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="header-btn">
                  {t(language, 'community.dashboard')}
                </Link>
                <Link to="/edit-profile" className="header-btn primary">
                  {t(language, 'community.editProfile')}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="header-btn">
                  {t(language, 'community.login')}
                </Link>
                <Link to="/register" className="header-btn primary">
                  {t(language, 'community.signUp')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="community-main">
        <div className="community-container">
          {/* Page Title */}
          <div className="community-title-section">
            <h1 className="community-title">{t(language, 'community.title')}</h1>
            <p className="community-subtitle">{t(language, 'community.subtitle')}</p>
          </div>

          {/* Search Bar */}
          <div className="community-search">
            <input
              type="text"
              placeholder={t(language, 'community.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="community-loading">
              <div className="loading-spinner"></div>
              <p>{t(language, 'community.loading')}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="community-error">
              <p>{error}</p>
            </div>
          )}

          {/* Profiles Grid */}
          {!loading && !error && (
            <>

              {filteredProfiles.length === 0 ? (
                <div className="community-empty">
                  <p>{t(language, 'community.noProfiles')}</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="clear-search-btn"
                    >
                      {t(language, 'community.clearSearch')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="profiles-grid">
                  {filteredProfiles.map((profile) => {
                    const cardColor = getCardColor(profile);
                    const hasCustomCard = profile.jobTitle || profile.status || profile.turma || (profile.hashtags && profile.hashtags.length > 0);

                    return (
                      <Link
                        key={profile.id}
                        to={`/${profile.username}`}
                        className="profile-card-item"
                      >
                        <div className="profile-card-item-wrapper">
                          {/* Cover/Banner */}
                          <div
                            className="profile-card-cover-small"
                            style={{
                              backgroundImage: profile.coverImage
                                ? `url(${profile.coverImage})`
                                : (profile.backgroundImage
                                  ? `url(${profile.backgroundImage})`
                                  : `linear-gradient(135deg, #DC2626 0%, #C71585 100%)`)
                            }}
                          >
                            {hasCustomCard && (
                              <div className="profile-card-overlay-small">
                                {profile.avatar ? (
                                  <div className="profile-avatar-small">
                                    <img src={profile.avatar} alt={profile.displayName} />
                                  </div>
                                ) : (
                                  <div className="profile-avatar-small placeholder">
                                    <span>👤</span>
                                  </div>
                                )}
                                <h3 className="profile-name-small">
                                  {profile.displayName || profile.username || t(language, 'community.noName')}
                                </h3>
                                {profile.jobTitle && (
                                  <div className="profile-job-small" style={{ color: cardColor }}>
                                    {profile.jobTitle}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Info Section */}
                          <div className="profile-card-info-small">
                            {!hasCustomCard && (
                              <>
                                {profile.avatar ? (
                                  <div className="profile-avatar-small">
                                    <img src={profile.avatar} alt={profile.displayName} />
                                  </div>
                                ) : (
                                  <div className="profile-avatar-small placeholder">
                                    <span>👤</span>
                                  </div>
                                )}
                                <h3 className="profile-name-small">
                                  {profile.displayName || profile.username || t(language, 'community.noName')}
                                </h3>
                                {profile.jobTitle && (
                                  <div className="profile-job-small" style={{ color: cardColor }}>
                                    {profile.jobTitle}
                                  </div>
                                )}
                              </>
                            )}

                            {profile.username && (
                              <div className="profile-username-small">
                                @{profile.username}
                              </div>
                            )}

                            {profile.bio && (
                              <p className="profile-bio-small">
                                {profile.bio.length > 80 ? profile.bio.substring(0, 80) + '...' : profile.bio}
                              </p>
                            )}

                            {profile.hashtags && profile.hashtags.length > 0 && (
                              <div className="profile-hashtags-small">
                                {profile.hashtags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="hashtag-tag-small"
                                    style={{
                                      background: `${cardColor}33`,
                                      borderColor: `${cardColor}66`
                                    }}
                                  >
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                  </span>
                                ))}
                                {profile.hashtags.length > 2 && (
                                  <span className="hashtag-more">+{profile.hashtags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}


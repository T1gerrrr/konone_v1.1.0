import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
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
import { getYouTubeEmbedUrl, getYouTubeVideoId } from '../utils/youtube';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import './PublicProfile.css';

export default function PublicProfile() {
  const { username } = useParams();
  const { language } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); // Start with false, will play after Enter
  const [volume, setVolume] = useState(50);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [profileDocId, setProfileDocId] = useState(null);
  const [showEnterOverlay, setShowEnterOverlay] = useState(true);
  const viewCountUpdated = useRef(false);

  // Get YouTube video ID (before early returns)
  const youtubeVideoId = profile?.musicUrl ? getYouTubeVideoId(profile.musicUrl) : null;

  useEffect(() => {
    // Reset view count flag khi username thay đổi
    viewCountUpdated.current = false;

    async function fetchProfile() {
      try {
        // Normalize username to lowercase for query
        const normalizedUsername = username.toLowerCase().trim();
        console.log('Fetching profile for username:', normalizedUsername);

        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('username', '==', normalizedUsername));
        const querySnapshot = await getDocs(q);

        console.log('Query result:', querySnapshot.empty ? 'Empty' : `Found ${querySnapshot.size} profiles`);

        if (querySnapshot.empty) {
          setError('Không tìm thấy hồ sơ này');
        } else {
          const profileDoc = querySnapshot.docs[0];
          const profileData = profileDoc.data();
          console.log('Profile data found:', profileData);
          setProfileDocId(profileDoc.id);

          // Tăng view count chỉ 1 lần
          if (!viewCountUpdated.current) {
            viewCountUpdated.current = true;
            try {
              const profileRef = doc(db, 'profiles', profileDoc.id);
              await updateDoc(profileRef, {
                viewCount: increment(1)
              });
              // Cập nhật view count trong profile data để hiển thị ngay
              const currentViewCount = profileData.viewCount || 0;
              setProfile({
                ...profileData,
                viewCount: currentViewCount + 1
              });
            } catch (viewError) {
              console.error('Error updating view count:', viewError);
              // Nếu lỗi, vẫn hiển thị profile với view count cũ
              setProfile(profileData);
            }
          } else {
            // Nếu đã tăng rồi, chỉ set profile data
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Lỗi khi tải hồ sơ: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchProfile();
    } else {
      setError('Username không hợp lệ');
      setLoading(false);
    }
  }, [username]);

  // Load YouTube IFrame API - Only initialize once
  useEffect(() => {
    if (!youtubeVideoId) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    let player;
    let checkYT;

    const initPlayer = () => {
      if (window.YT && window.YT.Player && !window.youtubePlayer) {
        clearInterval(checkYT);
        player = new window.YT.Player('youtube-player', {
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 0, // Don't autoplay, wait for Enter button
            loop: 1,
            playlist: youtubeVideoId,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            mute: 0
          },
          events: {
            onReady: (event) => {
              event.target.setVolume(volume);
              setIsPlaying(false); // Don't auto play
              window.youtubePlayer = event.target;
            }
          }
        });
      }
    };

    // Check if YT API is ready
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkYT = setInterval(initPlayer, 100);
    }

    return () => {
      if (checkYT) {
        clearInterval(checkYT);
      }
      if (player && window.youtubePlayer === player) {
        try {
          player.destroy();
          window.youtubePlayer = null;
        } catch (e) { }
      }
    };
  }, [youtubeVideoId]); // Removed volume from dependencies

  // Update volume when changed - Separate effect to avoid reinitializing player
  useEffect(() => {
    if (window.youtubePlayer) {
      try {
        window.youtubePlayer.setVolume(volume);
        if (volume === 0) {
          window.youtubePlayer.mute();
        } else {
          window.youtubePlayer.unMute();
        }
      } catch (e) {
        console.error('Error setting volume:', e);
      }
    }
  }, [volume]);

  // Handle visibility change to prevent YouTube player from showing other videos
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When tab is hidden, pause the player if playing
        if (window.youtubePlayer && isPlaying) {
          try {
            window.youtubePlayer.pauseVideo();
          } catch (e) {
            console.error('Error pausing video:', e);
          }
        }
        // Hide player element completely when tab is hidden
        const playerElement = document.getElementById('youtube-player');
        if (playerElement) {
          playerElement.style.display = 'none';
          playerElement.style.visibility = 'hidden';
        }
      } else {
        // When tab is visible again, ensure player is hidden and resume if needed
        const playerElement = document.getElementById('youtube-player');
        if (playerElement) {
          playerElement.style.display = 'none';
          playerElement.style.visibility = 'hidden';
        }
        // Resume if it was playing before
        if (window.youtubePlayer && isPlaying && !showEnterOverlay) {
          try {
            // Small delay to ensure player is ready
            setTimeout(() => {
              if (window.youtubePlayer) {
                window.youtubePlayer.playVideo();
              }
            }, 100);
          } catch (e) {
            console.error('Error resuming video:', e);
          }
        }
      }
    };

    // Also handle window focus/blur
    const handleWindowFocus = () => {
      const playerElement = document.getElementById('youtube-player');
      if (playerElement) {
        playerElement.style.display = 'none';
        playerElement.style.visibility = 'hidden';
      }
    };

    const handleWindowBlur = () => {
      const playerElement = document.getElementById('youtube-player');
      if (playerElement) {
        playerElement.style.display = 'none';
        playerElement.style.visibility = 'hidden';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isPlaying, showEnterOverlay]);

  function toggleMusic() {
    if (!window.youtubePlayer) return;

    try {
      if (isPlaying) {
        window.youtubePlayer.pauseVideo();
        setIsPlaying(false);
      } else {
        window.youtubePlayer.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Error toggling music:', e);
    }
  }

  function handleVolumeChange(e) {
    e.preventDefault();
    e.stopPropagation();
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
  }

  // Apply custom cursor if available
  useEffect(() => {
    if (!profile) return;

    // Check if user has premium
    const isPremium = profile.isPremium && profile.premiumExpiresAt?.toDate ?
      profile.premiumExpiresAt.toDate() > new Date() :
      (profile.isPremium && profile.premiumExpiresAt ? new Date(profile.premiumExpiresAt) > new Date() : false);

    if (profile.cursorIcon && isPremium) {
      console.log('Applying custom cursor:', profile.cursorIcon);
      // Remove existing style if any
      const existingStyle = document.getElementById('custom-cursor-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      // Apply cursor to the entire document body when on this page
      document.body.style.cursor = `url(${profile.cursorIcon}) 16 16, auto`;

      // Also apply to all elements in public-profile with higher specificity
      const style = document.createElement('style');
      style.id = 'custom-cursor-style';
      style.textContent = `
        body {
          cursor: url(${profile.cursorIcon}) 16 16, auto !important;
        }
        .public-profile,
        .public-profile * {
          cursor: url(${profile.cursorIcon}) 16 16, auto !important;
        }
        .public-profile button,
        .public-profile a,
        .public-profile input[type="range"] {
          cursor: url(${profile.cursorIcon}) 16 16, pointer !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.body.style.cursor = '';
        const existingStyle = document.getElementById('custom-cursor-style');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    } else {
      // Reset cursor if no custom cursor
      document.body.style.cursor = '';
      const existingStyle = document.getElementById('custom-cursor-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }, [profile?.cursorIcon, profile?.isPremium, profile?.premiumExpiresAt]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-error">
        <h2>😕 {error || 'Không tìm thấy hồ sơ'}</h2>
        <p>Hồ sơ này không tồn tại hoặc đã bị xóa.</p>
      </div>
    );
  }

  const socialLinks = profile.socialLinks || {};

  // Card color - default to magenta if not set
  const cardColor = profile.cardColor || '#C71585';

  // Handle Enter button click
  const handleEnter = () => {
    setShowEnterOverlay(false);
    // Start music if available
    if (youtubeVideoId) {
      const playMusic = () => {
        if (window.youtubePlayer) {
          try {
            // Check if player is ready
            const playerState = window.youtubePlayer.getPlayerState();
            if (playerState === window.YT.PlayerState.UNSTARTED ||
              playerState === window.YT.PlayerState.PAUSED ||
              playerState === window.YT.PlayerState.CUED) {
              window.youtubePlayer.playVideo();
              setIsPlaying(true);
            }
          } catch (e) {
            console.error('Error playing music:', e);
            // Retry after a short delay
            setTimeout(() => {
              if (window.youtubePlayer) {
                try {
                  window.youtubePlayer.playVideo();
                  setIsPlaying(true);
                } catch (retryError) {
                  console.error('Error retrying music:', retryError);
                }
              }
            }, 500);
          }
        } else {
          // Wait for player to be ready
          const checkPlayer = setInterval(() => {
            if (window.youtubePlayer) {
              clearInterval(checkPlayer);
              try {
                window.youtubePlayer.playVideo();
                setIsPlaying(true);
              } catch (e) {
                console.error('Error playing music after wait:', e);
              }
            }
          }, 100);

          // Stop checking after 5 seconds
          setTimeout(() => clearInterval(checkPlayer), 5000);
        }
      };

      // Small delay to ensure overlay is hidden
      setTimeout(playMusic, 100);
    }
  };

  // Check if user has premium
  const isPremium = profile.isPremium && profile.premiumExpiresAt?.toDate ?
    profile.premiumExpiresAt.toDate() > new Date() :
    (profile.isPremium && profile.premiumExpiresAt ? new Date(profile.premiumExpiresAt) > new Date() : false);

  // Get background video ID
  const backgroundVideoId = profile.backgroundVideo ? getYouTubeVideoId(profile.backgroundVideo) : null;

  // Render effect based on profile.effect
  // Free effects: snow, particles, confetti, fireworks
  // Premium effects: rain, stars, leaves, aurora, matrix, nebula
  const renderEffect = () => {
    switch (profile.effect) {
      case 'snow':
        return <SnowEffect />;
      case 'particles':
        return <ParticlesEffect />;
      case 'confetti':
        return <ConfettiEffect />;
      case 'fireworks':
        return <FireworksEffect />;
      case 'rain':
        return isPremium ? <RainEffect /> : null;
      case 'stars':
        return isPremium ? <StarsEffect /> : null;
      case 'leaves':
        return isPremium ? <LeavesEffect /> : null;
      case 'aurora':
        return isPremium ? <AuroraEffect /> : null;
      case 'matrix':
        return isPremium ? <MatrixEffect /> : null;
      case 'nebula':
        return isPremium ? <NebulaEffect /> : null;
      default:
        return null;
    }
  };

  return (
    <div
      className="public-profile"
      style={{
        backgroundImage: profile.backgroundImage ? `url(${profile.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh'
      }}
    >
      {/* Website Logo */}
      <Link to="/" className="profile-logo">
        <img
          src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png"
          alt="KonOne Logo"
          className="logo-icon"
        />
        <span className="logo-text">KonOne</span>
      </Link>

      {/* Background Video (Premium) */}
      {backgroundVideoId && isPremium && (
        <div className="background-video-container">
          <iframe
            src={`https://www.youtube.com/embed/${backgroundVideoId}?autoplay=1&loop=1&playlist=${backgroundVideoId}&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="background-video"
          />
          <div className="video-overlay"></div>
        </div>
      )}

      {/* Background Overlay */}
      {(profile.backgroundImage || backgroundVideoId) && (
        <div className="background-overlay"></div>
      )}

      {/* Effects */}
      {renderEffect()}

      {/* Enter Overlay */}
      {showEnterOverlay && !loading && profile && (
        <div className="enter-overlay">
          <div className="enter-overlay-content">
            <button
              className="enter-button"
              onClick={handleEnter}
            >
              <span className="enter-text">Click</span>
              {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="enter-icon">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg> */}
            </button>
          </div>
        </div>
      )}

      {/* YouTube Music Player (Hidden) */}
      {youtubeVideoId && (
        <div
          id="youtube-player"
          style={{
            position: 'fixed',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
            visibility: 'hidden',
            display: 'none'
          }}
        ></div>
      )}

      {/* Music Controls */}
      {youtubeVideoId && (
        <div
          className="music-controls"
          onMouseEnter={() => setShowVolumeControl(true)}
          onMouseLeave={() => setShowVolumeControl(false)}
        >
          <div className="music-controls-wrapper">
            <button
              onClick={toggleMusic}
              className="music-toggle-btn"
              title={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              )}
            </button>
            {showVolumeControl && (
              <div className="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  title={`Âm lượng: ${volume}%`}
                />
                <span className="volume-value">{volume}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Content - Centered Card with 3D Effect */}
      <div className="profile-container">
        {/* Hanging String and Hook - Only show when there's a coverImage banner */}
        {(profile.coverImage && (!profile.layout || profile.layout === 'card')) && (
          <div className="card-hanger">
            <div className="hanger-hook"></div>
            <div className="hanger-string"></div>
          </div>
        )}

        {/* Standard Card Layout or Custom Card Layout */}
        {(!profile.layout || profile.layout === 'card') && (
          <div
            className={`profile-card-3d ${(profile.jobTitle || profile.status || profile.turma || (profile.hashtags && profile.hashtags.length > 0)) ? 'custom-card-layout' : ''}`}
            style={{
              borderColor: cardColor ? `${cardColor}66` : undefined
            }}
          >
            {/* Profile Cover Image (Banner) - Only show if coverImage exists */}
            {profile.coverImage && (
              <div
                className="profile-card-cover"
                style={{
                  backgroundImage: `url(${profile.coverImage})`,
                  zIndex: 0,
                  position: 'relative'
                }}
              >
                {/* Text Overlay on Banner for Custom Card */}
                {(profile.jobTitle || profile.status || profile.turma || (profile.hashtags && profile.hashtags.length > 0)) && (
                  <div className="card-overlay-content" style={{ position: 'relative', zIndex: 1 }}>
                    {/* Avatar on Banner */}
                    {profile.avatar ? (
                      <div className="profile-avatar-container-overlay" style={{ position: 'relative', zIndex: 9998 }}>
                        <img src={profile.avatar} alt={profile.displayName} className="profile-avatar-overlay" style={{ position: 'relative', zIndex: 1 }} />
                        {profile.avatarFrame && (
                          <img
                            src={profile.avatarFrame}
                            alt="Avatar Frame"
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '140%',
                              height: '140%',
                              objectFit: 'contain',
                              pointerEvents: 'none',
                              zIndex: 9999
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="profile-avatar-container-overlay">
                        <div className="profile-avatar-placeholder-overlay">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Name and Info Overlay */}
                    <h1
                      className="profile-name-overlay"
                      style={{
                        fontFamily: profile.textFontFamily || 'Arial',
                        textShadow: profile.text3DEffect
                          ? `3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2), 9px 9px 0px rgba(0,0,0,0.1)`
                          : '0 2px 10px rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      {profile.displayName || 'Chưa có tên'}
                    </h1>

                    {profile.jobTitle && (
                      <div className="profile-job-title-overlay" style={{ color: cardColor }}>
                        {profile.jobTitle}
                      </div>
                    )}

                    {profile.status && (
                      <div className="profile-status-overlay">
                        <span className="status-value-overlay" style={{ color: cardColor }}>{profile.status}</span>
                      </div>
                    )}

                    {profile.turma && (
                      <div className="profile-turma-overlay">{profile.turma}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Info Section */}
            {!(profile.jobTitle || profile.status || profile.turma || (profile.hashtags && profile.hashtags.length > 0)) ? (
              <div className="profile-card-info">
                {/* Avatar overlapping cover */}
                {profile.avatar ? (
                  <div className="profile-avatar-container" style={{ position: 'relative', zIndex: 9998 }}>
                    <img src={profile.avatar} alt={profile.displayName} className="profile-avatar" style={{ position: 'relative', zIndex: 1 }} />
                    {profile.avatarFrame && (
                      <img
                        src={profile.avatarFrame}
                        alt="Avatar Frame"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '140%',
                          height: '140%',
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          zIndex: 9999
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="profile-avatar-container">
                    <div className="profile-avatar-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                )}

                <h1
                  className="profile-name"
                  style={{
                    fontFamily: profile.textFontFamily || 'Arial',
                    textShadow: profile.text3DEffect
                      ? `3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2), 9px 9px 0px rgba(0,0,0,0.1)`
                      : 'none',
                    WebkitTextShadow: profile.text3DEffect
                      ? `3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2), 9px 9px 0px rgba(0,0,0,0.1)`
                      : 'none',
                    borderWidth: profile.textBorderWidth ? `${profile.textBorderWidth}px` : '0',
                    borderStyle: profile.textBorderStyle || 'solid',
                    borderColor: profile.textBorderColor || 'transparent',
                    transform: profile.text3DEffect ? 'perspective(500px) rotateX(5deg)' : 'none',
                    transformStyle: profile.text3DEffect ? 'preserve-3d' : 'flat'
                  }}
                >
                  {profile.displayName || 'Chưa có tên'}
                </h1>

                {profile.username && (
                  <div className="profile-username">@{profile.username}</div>
                )}

                {profile.bio && (
                  <p
                    className="profile-bio"
                    style={{
                      fontFamily: profile.textFontFamily || 'Arial',
                      borderWidth: profile.textBorderWidth ? `${profile.textBorderWidth}px` : '0',
                      borderStyle: profile.textBorderStyle || 'solid',
                      borderColor: profile.textBorderColor || 'transparent'
                    }}
                  >
                    {profile.bio}
                  </p>
                )}
              </div>
            ) : (
              <div className="profile-card-info custom-info-layout">
                {/* Only show hashtags at bottom for custom layout */}
                {profile.hashtags && profile.hashtags.length > 0 && (
                  <div className="profile-hashtags">
                    {profile.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="hashtag-tag"
                        style={{
                          background: `${cardColor}33`,
                          borderColor: `${cardColor}66`,
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}
                      >
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modern Layout */}
        {profile.layout === 'modern' && (
          <div className="modern-layout-container">
            <div className="modern-avatar-wrapper">
              <div className="modern-avatar-halo" style={{ background: `radial-gradient(circle, ${cardColor}66 0%, transparent 70%)` }}></div>
              {profile.avatar ? (
                <div className="modern-avatar-container">
                  <img src={profile.avatar} alt={profile.displayName} className="modern-avatar" />
                  {profile.avatarFrame && (
                    <img
                      src={profile.avatarFrame}
                      alt="Avatar Frame"
                      className="modern-avatar-frame"
                    />
                  )}
                </div>
              ) : (
                <div className="modern-avatar-placeholder">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>

            <div className="modern-content">
              <h1
                className="modern-name"
                style={{
                  fontFamily: profile.textFontFamily || 'Arial',
                  color: 'white',
                  textShadow: profile.text3DEffect
                    ? `3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.2), 9px 9px 0px rgba(0,0,0,0.1)`
                    : '0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                {profile.displayName || 'Chưa có tên'}
              </h1>

              {profile.bio && (
                <p className="modern-bio">{profile.bio}</p>
              )}

              {profile.location && (
                <div className="modern-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{profile.location}</span>
                </div>
              )}

              {/* Discord-style Presence Card */}
              {(profile.presenceTitle || profile.presenceSubtitle) && (
                <div className="presence-card">
                  <div className="presence-header">
                    <span className="presence-label">
                      {profile.presenceType === 'playing' ? (language === 'vi' ? 'Đang chơi' : 'Playing') :
                        profile.presenceType === 'streaming' ? (language === 'vi' ? 'Đang stream' : 'Streaming') :
                          profile.presenceType === 'competing' ? (language === 'vi' ? 'Đang thi đấu' : 'Competing') :
                            profile.presenceType === 'watching' ? (language === 'vi' ? 'Đang xem' : 'Watching') :
                              (language === 'vi' ? 'Đang nghe' : 'Listening to')}
                    </span>
                  </div>
                  <div className="presence-content">
                    <div className="presence-icon">
                      {profile.presenceIcon ? (
                        <div className={`presence-icon-wrapper ${profile.presenceIcon}`}>
                          {profile.presenceIcon === 'fivem' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12l10 10 10-10L12 2zm0 18l-8-8 8-8 8 8-8 8z" /></svg>}
                          {profile.presenceIcon === 'pubg' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>}
                          {profile.presenceIcon === 'lol' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
                          {profile.presenceIcon === 'valorant' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.1c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>}
                          {profile.presenceIcon === 'lua' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z" /></svg>}
                          {profile.presenceIcon === 'html' && <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
                          {profile.presenceIcon === 'react' && <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2" /><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.523 10-10 10zm0-18a8 8 0 100 16 8 8 0 000-16z" /></svg>}
                          {/* Add other icons based on name if no specific SVG */}
                          {!['fivem', 'pubg', 'lol', 'valorant', 'lua', 'html', 'react'].includes(profile.presenceIcon) && (
                            <span className="presence-icon-text">{profile.presenceIcon.toUpperCase().charAt(0)}</span>
                          )}
                        </div>
                      ) : (
                        profile.avatar ? (
                          <img src={profile.avatar} alt="Presence" className="presence-avatar-img" />
                        ) : (
                          <div className="presence-avatar-placeholder">
                            {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
                          </div>
                        )
                      )}
                    </div>
                    <div className="presence-info">
                      <div className="presence-title">{profile.presenceTitle || (language === 'vi' ? 'Không có tiêu đề' : 'No title')}</div>
                      <div className="presence-subtitle">{profile.presenceSubtitle || (language === 'vi' ? 'Không có mô tả' : 'No description')}</div>
                      {isPlaying && <div className="presence-status">{language === 'vi' ? 'Đang phát...' : 'Playing...'}</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* View Count at bottom for Modern layout */}
              {profile.viewCount !== undefined && (
                <div className="modern-views">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                  <span>{profile.viewCount.toLocaleString()} lượt xem</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Social Links Icons */}
      {(socialLinks.facebook || socialLinks.instagram || socialLinks.twitter || socialLinks.linkedin || socialLinks.tiktok) && (
        <div className="social-icons-container">
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="social-icon facebook" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          )}
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="social-icon instagram" title="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          )}
          {socialLinks.twitter && (
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-icon twitter" title="Twitter">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          )}
          {socialLinks.linkedin && (
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon linkedin" title="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
          {socialLinks.tiktok && (
            <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="social-icon tiktok" title="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* View Count - Bottom Left */}
      {profile.viewCount !== undefined && (
        <div
          className="profile-views-bottom-left"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '8px 12px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            zIndex: 10,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <span>{profile.viewCount.toLocaleString()} lượt xem</span>
        </div>
      )}
    </div>
  );
}


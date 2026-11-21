import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { getYouTubeVideoId } from '../utils/youtube';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { notifySuccess } from '../notify/notify';
import LanyardCard from './LanyardCard';
import WakeSlider from './WakeSlider';
import SplashCursor from './SplashCursor';
import BlobCursor from './BlobCursor';
import CursorFx from './CursorFx';
import { isDirectVideoUrl, isDirectMediaUrl, trackNameFromUrl } from '../utils/video';
import { RevealText, TypeText } from './ProfileTextFx';
import { dateKey } from '../utils/dateKey';
import { musicBoxSyncStyle } from '../utils/color';
import GamePresence from './GamePresence';
import WebAboutAdvanced from './WebAboutAdvanced';
import { PREMIUM_LAYOUTS, FREE_LINK_LIMIT, isPremiumActive } from '../constants/premium';
import { PLATFORM_BY_KEY } from '../constants/socialPlatforms';
import { resolveProfileBadges } from '../constants/badges';
import './PublicProfile.css';

// Tài khoản miễn phí: tắt các tính năng Premium (kể cả khi dữ liệu cũ còn lưu)
function applyFreePlan(p) {
  if (!p || isPremiumActive(p)) return p;
  let left = FREE_LINK_LIMIT;
  const socialLinks = {};
  Object.entries(p.socialLinks || {}).forEach(([k, v]) => {
    if (left > 0 && v && String(v).trim()) {
      socialLinks[k] = v;
      left -= 1;
    }
  });
  const customLinks = (Array.isArray(p.customLinks) ? p.customLinks : [])
    .filter((c) => c?.url)
    .slice(0, Math.max(0, left));
  return {
    ...p,
    layout: PREMIUM_LAYOUTS.includes(p.layout) ? 'card' : p.layout,
    effect: 'none',
    backgroundVideo: '',
    splashCursor: p.splashCursor ? { ...p.splashCursor, enabled: false } : p.splashCursor,
    blobCursor: p.blobCursor ? { ...p.blobCursor, enabled: false } : p.blobCursor,
    cursorFx: p.cursorFx ? { ...p.cursorFx, id: '' } : p.cursorFx,
    socialLinks,
    customLinks
  };
}

function formatAudioTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

function hexToRgba(hex, alpha = 0.5) {
  if (!hex || typeof hex !== 'string') return `rgba(65, 65, 65, ${alpha})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return `rgba(65, 65, 65, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// applyCursor: trang xem mẫu toàn màn hình muốn dùng con trỏ của mẫu (xem trước thu nhỏ thì không)
export default function PublicProfile({ previewProfile = null, applyCursor = false }) {
  const isPreview = Boolean(previewProfile); // xem trước mẫu: dùng dữ liệu truyền vào, không có tác dụng phụ
  const { username } = useParams();
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); // Start with false, will play after Enter
  const [volume, setVolume] = useState(50);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showEnterOverlay, setShowEnterOverlay] = useState(!previewProfile);
  const [audioTrackTitle, setAudioTrackTitle] = useState('');
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const viewCountUpdated = useRef(false);

  // Ẩn toàn bộ thanh cuộn khi đang ở trang hồ sơ public
  useEffect(() => {
    if (isPreview) return undefined;
    const root = document.documentElement;
    root.classList.add('pp-hide-scrollbar');
    document.body.classList.add('pp-hide-scrollbar');
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.classList.remove('pp-hide-scrollbar');
      document.body.classList.remove('pp-hide-scrollbar');
      window.removeEventListener('scroll', onScroll);
    };
  }, [isPreview]);

  // Get YouTube video ID (before early returns)
  // Nhạc: link YouTube, hoặc link tệp trực tiếp (mp3/mp4...) — tệp trực tiếp dùng mã giả "direct:<url>"
  const ytMusicId = profile?.musicUrl ? getYouTubeVideoId(profile.musicUrl) : null;
  const directMusicUrl = !ytMusicId && isDirectMediaUrl(profile?.musicUrl) ? profile.musicUrl.trim() : null;
  const youtubeVideoId = ytMusicId || (directMusicUrl ? `direct:${directMusicUrl}` : null);
  const isDirectMusic = Boolean(directMusicUrl);

  // Fetch YouTube track title & poll playback progress for the bottom Audio Player Box
  useEffect(() => {
    if (!youtubeVideoId) {
      setAudioTrackTitle('');
      setAudioCurrentTime(0);
      setAudioDuration(0);
      return undefined;
    }

    let cancelled = false;
    if (isDirectMusic) {
      setAudioTrackTitle(trackNameFromUrl(directMusicUrl));
    } else {
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeVideoId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data?.title) {
            setAudioTrackTitle(data.title);
          }
        })
        .catch(() => {});
    }

    const timer = setInterval(() => {
      const p = window.youtubePlayer;
      if (p && typeof p.getCurrentTime === 'function') {
        try {
          const cur = p.getCurrentTime() || 0;
          const dur = (typeof p.getDuration === 'function' ? p.getDuration() : 0) || 0;
          setAudioCurrentTime(cur);
          if (dur > 0) setAudioDuration(dur);
        } catch {
          // ignore
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [youtubeVideoId, isDirectMusic, directMusicUrl]);

  useEffect(() => {
    // Xem trước mẫu: dùng thẳng dữ liệu truyền vào (không truy vấn, không đếm lượt xem)
    if (previewProfile) {
      setProfile(applyFreePlan(previewProfile));
      setLoading(false);
      return;
    }
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
          setError({ code: 'not-found' });
        } else {
          const profileDoc = querySnapshot.docs[0];
          const profileData = profileDoc.data();
          console.log('Profile data found:', profileData);
          // Tăng view count chỉ 1 lần (không đếm khi hồ sơ đang ẩn)
          if (profileData.isHidden) {
            viewCountUpdated.current = true;
            setProfile(applyFreePlan(profileData));
          } else if (!viewCountUpdated.current) {
            viewCountUpdated.current = true;
            try {
              const profileRef = doc(db, 'profiles', profileDoc.id);
              try {
                // Tổng lượt xem + lượt xem theo ngày (cho biểu đồ ở Dashboard)
                await updateDoc(profileRef, {
                  viewCount: increment(1),
                  [`viewsByDay.${dateKey()}`]: increment(1)
                });
              } catch (dayErr) {
                // Rules cũ chỉ cho phép sửa viewCount -> vẫn đếm tổng
                await updateDoc(profileRef, { viewCount: increment(1) });
              }
              // Cập nhật view count trong profile data để hiển thị ngay
              const currentViewCount = profileData.viewCount || 0;
              setProfile(applyFreePlan({
                ...profileData,
                viewCount: currentViewCount + 1
              }));
            } catch (viewError) {
              console.error('Error updating view count:', viewError);
              // Nếu lỗi, vẫn hiển thị profile với view count cũ
              setProfile(applyFreePlan(profileData));
            }
          } else {
            // Nếu đã tăng rồi, chỉ set profile data
            setProfile(applyFreePlan(profileData));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError({ code: 'load', message: error.message });
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchProfile();
    } else {
      setError({ code: 'invalid' });
      setLoading(false);
    }
  }, [username, previewProfile]);

  // ===== Phát nhạc YouTube =====
  // Trình duyệt chỉ cho phát nhạc có tiếng sau khi người dùng tương tác, nên:
  //  1) Khi player sẵn sàng -> thử tự phát ngay (được thì phát luôn).
  //  2) Nếu bị chặn -> phát ở lần chạm/click/phím đầu tiên (gồm nút Enter), gọi
  //     playVideo() đồng bộ trong chính sự kiện đó để iOS/Android chấp nhận.
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const wantPlayRef = useRef(false); // người dùng đã yêu cầu phát
  const userPausedRef = useRef(false); // người dùng tự bấm tắt nhạc
  const playerHostRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

  // Video nền YouTube: giữ iframe ẩn cho tới khi YouTube báo "đang phát", để giao diện của YouTube
  // (nút Trước / Tạm dừng / Sau lúc đang tải) không bao giờ lộ ra khi tải lại trang.
  const bgFrameRef = useRef(null);
  const [bgPlaying, setBgPlaying] = useState(false);
  const bgVideoUrl = profile?.backgroundVideo || '';
  useEffect(() => {
    setBgPlaying(false);
    if (!bgVideoUrl || !getYouTubeVideoId(bgVideoUrl)) return undefined;
    const ORIGIN = 'https://www.youtube.com';
    const post = (msg) => {
      try {
        const w = bgFrameRef.current && bgFrameRef.current.contentWindow;
        if (w) w.postMessage(JSON.stringify(msg), ORIGIN);
      } catch (e) {
        // ignore
      }
    };
    const onMessage = (e) => {
      if (e.origin !== ORIGIN) return;
      if (!bgFrameRef.current || e.source !== bgFrameRef.current.contentWindow) return;
      let d = e.data;
      if (typeof d === 'string') {
        try {
          d = JSON.parse(d);
        } catch (err) {
          return;
        }
      }
      if (!d) return;
      const state = d.event === 'onStateChange' ? d.info : d.info && d.info.playerState;
      if (state === 1) setBgPlaying(true);
      else if (state === 0) {
        // Tự lặp (không dùng playlist vì nó làm YouTube hiện nút Trước/Sau)
        post({ event: 'command', func: 'seekTo', args: [0, true] });
        post({ event: 'command', func: 'playVideo', args: [] });
      }
    };
    window.addEventListener('message', onMessage);
    // Đăng ký nhận sự kiện từ player; gửi lặp lại tới khi nhận được trạng thái đầu tiên
    const ping = setInterval(() => post({ event: 'listening', id: 1, channel: 'widget' }), 400);
    // Phòng khi không nhận được tín hiệu: vẫn hiện video sau 8 giây
    const fallback = setTimeout(() => setBgPlaying(true), 8000);
    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(ping);
      clearTimeout(fallback);
    };
  }, [bgVideoUrl]);
  const overlayOpenRef = useRef(true);
  overlayOpenRef.current = showEnterOverlay;

  // Điện thoại / máy tính bảng: playVideo() qua API (postMessage) KHÔNG mang theo lần chạm
  // của người dùng vào iframe YouTube, nên iOS/Android chặn tiếng. Cách chắc chắn: cho chính
  // iframe YouTube phủ lên màn "Nhấn để vào" (gần như trong suốt) -> lần chạm rơi vào YouTube.
  const isTouch = useMemo(
    () =>
      typeof window !== 'undefined' &&
      ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window),
    []
  );
  const tapToPlay = isTouch && showEnterOverlay && Boolean(youtubeVideoId) && playerReady;

  // Chạm vào iframe làm cửa sổ mất focus -> nếu sau 1.5s nhạc vẫn chưa phát thì vẫn mở trang
  useEffect(() => {
    if (!tapToPlay) return undefined;
    let timer = null;
    const onBlur = () => {
      wantPlayRef.current = true;
      timer = setTimeout(() => {
        if (overlayOpenRef.current) setShowEnterOverlay(false);
      }, 1500);
    };
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      clearTimeout(timer);
    };
  }, [tapToPlay]);

  const startMusic = () => {
    wantPlayRef.current = true;
    const p = window.youtubePlayer;
    if (!p || typeof p.playVideo !== 'function') return; // onReady sẽ phát tiếp
    try {
      if (volumeRef.current > 0) p.unMute();
      p.setVolume(volumeRef.current);
      p.playVideo();
    } catch (e) {
      // ignore
    }
  };

  // Nhạc từ tệp trực tiếp: bọc <audio> thành đối tượng có cùng giao diện với YouTube player
  useEffect(() => {
    if (!isDirectMusic) return undefined;
    const audio = new Audio();
    audio.src = directMusicUrl;
    audio.loop = true;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audio.volume = Math.min(1, Math.max(0, volumeRef.current / 100));

    const player = {
      playVideo: () => { const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); },
      pauseVideo: () => audio.pause(),
      setVolume: (v) => { audio.volume = Math.min(1, Math.max(0, v / 100)); },
      mute: () => { audio.muted = true; },
      unMute: () => { audio.muted = false; },
      isMuted: () => audio.muted,
      seekTo: (t) => { audio.currentTime = t; },
      getCurrentTime: () => audio.currentTime || 0,
      getDuration: () => (Number.isFinite(audio.duration) ? audio.duration : 0)
    };
    const onPlay = () => {
      setIsPlaying(true);
      if (overlayOpenRef.current) setShowEnterOverlay(false);
    };
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    window.youtubePlayer = player;
    setPlayerReady(true);
    if (!userPausedRef.current && wantPlayRef.current) player.playVideo();

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.src = '';
      if (window.youtubePlayer === player) window.youtubePlayer = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directMusicUrl]);

  useEffect(() => {
    if (!youtubeVideoId || isDirectMusic || !playerHostRef.current) return undefined;

    // Div con do mình tạo để YouTube thay bằng iframe, tránh đụng DOM của React
    const mount = document.createElement('div');
    playerHostRef.current.appendChild(mount);

    if (!window.YT || !window.YT.Player) {
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    let player = null;
    let disposed = false;
    let checkYT = null;

    const initPlayer = () => {
      if (disposed || !window.YT || !window.YT.Player) return;
      clearInterval(checkYT);
      player = new window.YT.Player(mount, {
        width: '200',
        height: '200',
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          cc_load_policy: 0
        },
        events: {
          onReady: (event) => {
            if (disposed) return;
            window.youtubePlayer = event.target;
            // Không cho focus bằng phím Tab (Space/K sẽ tạm dừng và hiện giao diện YouTube)
            try {
              const frame = event.target.getIframe && event.target.getIframe();
              if (frame) {
                frame.setAttribute('tabindex', '-1');
                frame.setAttribute('aria-hidden', 'true');
              }
            } catch (e) {
              // ignore
            }
            setPlayerReady(true);
            event.target.setVolume(volumeRef.current);
            // Thử tự phát ngay khi vào trang
            if (!userPausedRef.current) {
              try {
                event.target.playVideo();
              } catch (e) {
                // ignore
              }
            }
          },
          onStateChange: (event) => {
            const YTS = window.YT && window.YT.PlayerState;
            if (!YTS) return;
            if (event.data === YTS.PLAYING) {
              setIsPlaying(true);
              // Người dùng chạm trúng YouTube trên mobile -> nhạc đã phát, đóng màn chờ
              if (overlayOpenRef.current) setShowEnterOverlay(false);
              try {
                if (volumeRef.current > 0 && event.target.isMuted && event.target.isMuted()) event.target.unMute();
              } catch (e) {
                // ignore
              }
            } else if (event.data === YTS.ENDED) {
              // Tự lặp bằng lệnh (không dùng tham số playlist vì nó làm YouTube hiện nút Trước/Sau)
              if (!userPausedRef.current) {
                try {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                } catch (e) {
                  setIsPlaying(false);
                }
              } else setIsPlaying(false);
            } else if (event.data === YTS.PAUSED) setIsPlaying(false);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) initPlayer();
    else checkYT = setInterval(initPlayer, 100);

    return () => {
      disposed = true;
      clearInterval(checkYT);
      try {
        if (player && player.destroy) player.destroy();
      } catch (e) {
        // ignore
      }
      if (window.youtubePlayer === player) window.youtubePlayer = null;
      mount.remove();
    };
  }, [youtubeVideoId, isDirectMusic]);

  // Nếu tự phát bị chặn: phát ở lần tương tác đầu tiên (desktop + mobile)
  useEffect(() => {
    if (!youtubeVideoId || isPlaying) return undefined;
    const onFirstGesture = () => {
      if (userPausedRef.current) return;
      startMusic();
    };
    const opts = { capture: true, passive: true };
    const events = ['pointerdown', 'touchend', 'click', 'keydown'];
    events.forEach((ev) => document.addEventListener(ev, onFirstGesture, opts));
    return () => events.forEach((ev) => document.removeEventListener(ev, onFirstGesture, opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeVideoId, isPlaying]);

  // Đổi âm lượng (không khởi tạo lại player)
  useEffect(() => {
    const p = window.youtubePlayer;
    if (!p || typeof p.setVolume !== 'function') return;
    try {
      p.setVolume(volume);
      if (volume === 0) p.mute();
      else p.unMute();
    } catch (e) {
      // ignore
    }
  }, [volume]);

  // Rời tab thì tạm dừng, quay lại thì phát tiếp
  useEffect(() => {
    const onVisibility = () => {
      const p = window.youtubePlayer;
      if (!p || typeof p.pauseVideo !== 'function') return;
      try {
        if (document.hidden) {
          if (isPlaying) p.pauseVideo();
        } else if (wantPlayRef.current && !userPausedRef.current) {
          p.playVideo();
        }
      } catch (e) {
        // ignore
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isPlaying]);

  // Desktop: nhấn phím Enter/Space để vào trang (như bấm nút Click)
  useEffect(() => {
    if (!showEnterOverlay) return undefined;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        userPausedRef.current = false;
        startMusic();
        setShowEnterOverlay(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEnterOverlay]);

  function toggleMusic() {
    const p = window.youtubePlayer;
    if (!p) return;
    try {
      if (isPlaying) {
        userPausedRef.current = true;
        p.pauseVideo();
        setIsPlaying(false);
      } else {
        userPausedRef.current = false;
        startMusic();
      }
    } catch (e) {
      console.error('Error toggling music:', e);
    }
  }

  // Tiêu đề tab trình duyệt = tên người dùng (có hiệu ứng gõ chữ nếu bật "Tiêu đề chuyển động")
  const tabName = profile?.username || '';
  const tabDisplay = profile?.displayName || '';
  const tabHidden = Boolean(profile?.isHidden) && !(currentUser && currentUser.uid === profile?.userId);
  const tabAnimated = Boolean(profile?.otherSettings?.animatedTitle);
  useEffect(() => {
    if (isPreview) return undefined;
    const original = document.title;
    if (!tabName || tabHidden) {
      document.title = 'KonOne';
      return () => {
        document.title = original;
      };
    }
    const full = tabDisplay && tabDisplay.toLowerCase() !== tabName ? `${tabDisplay} (@${tabName})` : `@${tabName}`;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!tabAnimated || reduce) {
      document.title = `${full} | KonOne`;
      return () => {
        document.title = original;
      };
    }
    // Gõ từng ký tự, giữ một lúc, xoá rồi lặp lại
    let i = 0;
    let dir = 1;
    let hold = 0;
    const timer = setInterval(() => {
      if (hold > 0) {
        hold -= 1;
        return;
      }
      i += dir;
      if (i >= full.length) {
        i = full.length;
        dir = -1;
        hold = 12;
      } else if (i <= 1) {
        i = 1;
        dir = 1;
        hold = 3;
      }
      document.title = full.slice(0, i);
    }, 180);
    return () => {
      clearInterval(timer);
      document.title = original;
    };
  }, [tabName, tabDisplay, tabHidden, tabAnimated, isPreview]);

  // Apply custom cursor if available
  useEffect(() => {
    if (!profile || (isPreview && !applyCursor)) return;

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
  }, [profile?.cursorIcon, profile?.isPremium, profile?.premiumExpiresAt, profile, isPreview, applyCursor]);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>{L("Đang tải hồ sơ...", "Loading profile...")}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-error">
        <h2>
          😕{' '}
          {error?.code === 'load'
            ? L('Lỗi khi tải hồ sơ: ', 'Error loading profile: ') + error.message
            : error?.code === 'invalid'
              ? L('Tên người dùng không hợp lệ', 'Invalid username')
              : L('Không tìm thấy hồ sơ', 'Profile not found')}
        </h2>
        <p>{L("Hồ sơ này không tồn tại hoặc đã bị xóa.", "This profile does not exist or has been removed.")}</p>
      </div>
    );
  }

  // Hồ sơ bị chủ tạm ẩn: người khác chỉ thấy màn hình đen "TẠM ẨN"
  const isOwner = Boolean(currentUser && currentUser.uid === profile.userId);
  if (profile.isHidden && !isOwner) {
    return (
      <div className="profile-hidden-screen">
        <span>{L('TẠM ẨN', 'TEMPORARILY HIDDEN')}</span>
      </div>
    );
  }

  const socialLinks = profile.socialLinks || {};

  // Card color - default to magenta if not set
  const cardColor = profile.cardColor || '#C71585';

  // Handle Enter button click
  // Nút Enter: gọi phát nhạc NGAY trong sự kiện click/chạm (không setTimeout)
  // để Safari iOS / Chrome Android không chặn.
  const handleEnter = () => {
    userPausedRef.current = false;
    if (youtubeVideoId) startMusic();
    setShowEnterOverlay(false);
  };

  // Check if user has premium
  const isPremium = profile.isPremium && profile.premiumExpiresAt?.toDate ?
    profile.premiumExpiresAt.toDate() > new Date() :
    (profile.isPremium && profile.premiumExpiresAt ? new Date(profile.premiumExpiresAt) > new Date() : false);

  // Get background video ID
  const backgroundVideoId = profile.backgroundVideo ? getYouTubeVideoId(profile.backgroundVideo) : null;
  const backgroundVideoFile = !backgroundVideoId && isDirectVideoUrl(profile.backgroundVideo) ? profile.backgroundVideo.trim() : null;
  const socialModes = profile.socialModes || {};
  const isInsideSocial = (profile.socialPosition || 'inside') === 'inside';
  const hasAnySocialOrCustom =
    Object.values(socialLinks).some((v) => Boolean(v && String(v).trim())) ||
    (Array.isArray(profile.customLinks) && profile.customLinks.length > 0);
  const profileBadges = resolveProfileBadges(profile, isPremium);
  const effectiveTextColor = profile.textColor || '#ffffff';
  const glowOn = profile.glowSettings || { username: true, socials: true, badges: true };

  // Bố cục WEB: trang Giới thiệu (tùy chọn) + Shop dạng danh sách + Poster/chữ cũ ở cuối
  const webAboutText = String(profile.webAboutText || '').trim();
  const webAboutAdvanced = profile.webAboutMode === 'advanced';
  const webAboutOn = Boolean(profile.webAboutEnabled) && (webAboutText.length > 0 || webAboutAdvanced);
  const webShopItems = (Array.isArray(profile.webShopItems) ? profile.webShopItems : [])
    .filter((it) => it && /^https?:\/\//i.test(String(it.url || '').trim()))
    .slice(0, 30);
  const webShopOn = Boolean(profile.webShopEnabled) && webShopItems.length > 0;
  const webNextSectionId = webAboutOn ? 'web-about' : webShopOn ? 'web-shop' : 'web-poster-showcase';
  const webPanelStyle = {
    background:
      (profile.profileOpacity ?? 0) <= 2
        ? 'transparent'
        : hexToRgba(
            profile.lanyardCardColor || profile.cardColor || '#121216',
            Math.max(0.15, (profile.profileOpacity ?? 0) / 100)
          ),
    backdropFilter:
      (profile.profileBlur ?? 0) > 0
        ? `blur(${Math.round(((profile.profileBlur ?? 0) / 100) * 40)}px)`
        : 'none',
    WebkitBackdropFilter:
      (profile.profileBlur ?? 0) > 0
        ? `blur(${Math.round(((profile.profileBlur ?? 0) / 100) * 40)}px)`
        : 'none'
  };

  const renderSocialIconsBlock = (extraClass = '') => {
    if (!hasAnySocialOrCustom || profile.otherSettings?.showLinks === false) return null;
    return (
      <div className={`social-icons-container ${extraClass}`.trim()}>
        {Object.entries(socialLinks)
          .filter(([, val]) => Boolean(val && String(val).trim()))
          .map(([key, val]) => {
            const p = PLATFORM_BY_KEY[key];
            const raw = String(val).trim();
            const isTextMode = socialModes[key] === 'text';
            const href =
              raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:')
                ? raw
                : key === 'email' && raw.includes('@')
                  ? `mailto:${raw}`
                  : `https://${raw}`;
            const iconClr =
              profile.otherSettings?.monochromeIcons !== false && profile.iconColor
                ? profile.iconColor
                : p?.color || '#ffffff';

            const glowStyle =
              glowOn.socials !== false
                ? {
                    color: iconClr,
                    filter: `drop-shadow(0 0 9px ${iconClr}aa)`
                  }
                : { color: iconClr };

            if (isTextMode) {
              return (
                <button
                  key={key}
                  type="button"
                  className={`social-icon ${key}`}
                  title={`${p ? p.name : key}: ${raw} ${L('(bấm để sao chép)', '(click to copy)')}`}
                  style={{ ...glowStyle, cursor: 'pointer' }}
                  onClick={() => {
                    navigator.clipboard?.writeText(raw);
                    notifySuccess(`${L('Đã sao chép', 'Copied')} ${p ? p.name : key}: ${raw}`);
                  }}
                >
                  {p ? (
                    p.icon
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                </button>
              );
            }

            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`social-icon ${key}`}
                title={p ? p.name : key}
                style={glowStyle}
              >
                {p ? (
                  p.icon
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
              </a>
            );
          })}

        {Array.isArray(profile.customLinks) &&
          profile.customLinks.map((item) => {
            if (!item?.url) return null;
            const raw = String(item.url).trim();
            const href = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
            return (
              <a
                key={item.id || item.url}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon custom-url"
                title={item.label || item.url}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
                </svg>
              </a>
            );
          })}
      </div>
    );
  };

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
      className={`public-profile ${profile.layout === 'lanyard' ? 'public-profile-lanyard' : ''} ${profile.layout === 'web' ? 'public-profile-web' : ''}`.trim()}
      style={{
        backgroundImage: profile.backgroundImage ? `url(${profile.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        '--name-scale': (Number(profile.nameScale) || 100) / 100,
        '--bio-scale': (Number(profile.bioScale) || 100) / 100
      }}
    >
      {/* Website Logo */}
      <Link to="/" className="profile-logo">
        <img
          src="/logo-konone-v1.png"
          alt="KonOne Logo"
          className="logo-icon"
        />
        {/* <span className="logo-text">KonOne</span> */}
      </Link>

      {/* Background Video (Premium) */}
      {backgroundVideoId && isPremium && (
        <div className="background-video-container">
          <iframe
            ref={bgFrameRef}
            style={{ opacity: bgPlaying ? 1 : 0, transition: 'opacity 0.6s ease' }}
            src={`https://www.youtube.com/embed/${backgroundVideoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0`}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
            aria-hidden="true"
            className="background-video"
            title={L("Video nền", "Background Video")}
          />
          <div className="video-overlay"></div>
        </div>
      )}

      {backgroundVideoFile && isPremium && (
        <div className="background-video-container">
          <video
            className="background-video-file"
            src={backgroundVideoFile}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div className="video-overlay"></div>
        </div>
      )}

      {/* Background Overlay */}
      {(profile.backgroundImage || backgroundVideoId || (backgroundVideoFile && isPremium)) && (
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
              <span className="enter-text">{L("Nhấn để vào", "Click to enter")}</span>
              {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="enter-icon">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg> */}
            </button>
          </div>
        </div>
      )}

      {/* YouTube Music Player (Hidden) */}
      {youtubeVideoId && (
        // Không dùng display:none — iOS/Safari sẽ không phát iframe bị ẩn hẳn.
        <div
          ref={playerHostRef}
          aria-hidden="true"
          className={`yt-audio-host ${tapToPlay ? 'is-tap-target' : ''}`}
          style={
            tapToPlay
              ? {
                  // Mobile: phủ lên màn "Nhấn để vào" để lần chạm rơi vào YouTube
                  position: 'fixed',
                  inset: 0,
                  width: '100vw',
                  height: '100vh',
                  opacity: 0.01,
                  zIndex: 10001,
                  pointerEvents: 'auto',
                  overflow: 'hidden'
                }
              : {
                  // Ẩn nhưng vẫn "hiển thị" (không display:none) để trình duyệt không dừng nhạc
                  position: 'fixed',
                  left: 0,
                  bottom: 0,
                  width: '200px',
                  height: '200px',
                  opacity: 0.01,
                  zIndex: -1,
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  // Cắt hết phần hiển thị (vẫn giữ kích thước 200x200 để nhạc không bị dừng): giao diện YouTube không thể lộ ra
                  clipPath: 'inset(100%)'
                }
          }
        ></div>
      )}

      {/* Music Controls with ReactBits WakeSlider */}
      {profile.splashCursor?.enabled && (
        <SplashCursor
          colors={
            Array.isArray(profile.splashCursor.colors) && profile.splashCursor.colors.length
              ? profile.splashCursor.colors
              : ['#f65c5c', '#dc2626', '#a21caf']
          }
          rainbow={Boolean(profile.splashCursor.rainbow)}
          size={Number(profile.splashCursor.size ?? 1)}
          force={Number(profile.splashCursor.force ?? 1)}
          swirl={Number(profile.splashCursor.swirl ?? 3)}
          trail={Number(profile.splashCursor.trail ?? 1)}
          clickSplash={profile.splashCursor.clickSplash !== false}
          colorSpeed={Number(profile.splashCursor.colorSpeed ?? 1)}
          intensity={Number(profile.splashCursor.intensity ?? 1)}
          momentum={Number(profile.splashCursor.momentum ?? 1)}
          shading={Number(profile.splashCursor.shading ?? 1)}
          glow={Number(profile.splashCursor.glow ?? 0)}
          quality={profile.splashCursor.quality || 'high'}
          intro
          contained={false}
        />
      )}

      {profile.blobCursor?.enabled && !profile.splashCursor?.enabled && (
        <BlobCursor
          material={profile.blobCursor.material || 'chrome'}
          color={profile.blobCursor.color || '#3B82F6'}
          blend={profile.blobCursor.blend || 'normal'}
          size={Number(profile.blobCursor.size ?? 140)}
          morph={Number(profile.blobCursor.morph ?? 0)}
          morphSpeed={Number(profile.blobCursor.morphSpeed ?? 0.4)}
          depth={Number(profile.blobCursor.depth ?? 1)}
          trail={Number(profile.blobCursor.trail ?? 16)}
          lag={Number(profile.blobCursor.lag ?? 0.55)}
          goo={Number(profile.blobCursor.goo ?? 1)}
          stretch={Number(profile.blobCursor.stretch ?? 0.6)}
          wobble={Number(profile.blobCursor.wobble ?? 1)}
          drip={Number(profile.blobCursor.drip ?? 0)}
          shine={Number(profile.blobCursor.shine ?? 1)}
          splash={profile.blobCursor.splash !== false}
          splashCount={Number(profile.blobCursor.splashCount ?? 6)}
          splashSpeed={Number(profile.blobCursor.splashSpeed ?? 0.5)}
          splashSize={Number(profile.blobCursor.splashSize ?? 0.5)}
          splashGravity={Number(profile.blobCursor.splashGravity ?? 0)}
          regrow={Number(profile.blobCursor.regrow ?? 0.5)}
          shadow={Boolean(profile.blobCursor.shadow)}
          hideCursor={profile.blobCursor.hideCursor !== false}
          style={{ position: 'fixed', inset: 0, zIndex: 48 }}
        />
      )}

      {profile.cursorFx?.id && !profile.splashCursor?.enabled && !profile.blobCursor?.enabled && (
        <CursorFx
          id={profile.cursorFx.id}
          length={Number(profile.cursorFx.length ?? 20)}
          size={Number(profile.cursorFx.size ?? 3)}
          trailSpeed={Number(profile.cursorFx.trailSpeed ?? 0.4)}
          particles={Number(profile.cursorFx.particles ?? 15)}
          rate={Number(profile.cursorFx.rate ?? 0.4)}
          zIndex={48}
        />
      )}

      {youtubeVideoId && profile.otherSettings?.volumeControl !== false && (
        <div
          className="music-controls"
          onMouseEnter={() => setShowVolumeControl(true)}
          onMouseLeave={() => setShowVolumeControl(false)}
        >
          <div className="music-controls-wrapper">
            <div
              className={`wake-volume-popover ${showVolumeControl ? 'is-open' : ''}`}
              aria-hidden={!showVolumeControl}
            >
              <WakeSlider
                value={volume}
                defaultValue={50}
                min={0}
                max={100}
                step={1}
                bars={32}
                height={44}
                restHeight={10}
                gap={4}
                fillColor="#f5f5f5"
                trackColor="#27272a"
                sensitivity={1}
                reach={6}
                skew={0.6}
                glide={0.3}
                smoothing={100}
                showValue
                formatValue={(v) => `${v}%`}
                onChange={(val) => setVolume(val)}
                disabled={!showVolumeControl}
                ariaLabel={L('Âm lượng', 'Volume')}
              />
            </div>
            <button
              onClick={toggleMusic}
              className="music-toggle-btn"
              title={isPlaying ? L('Tắt nhạc', 'Pause music') : L('Bật nhạc', 'Play music')}
            >
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Profile Content - Centered Card */}
      <div className={`profile-container ${profile.layout === 'lanyard' ? 'lanyard-mode' : ''} ${profile.layout === 'web' ? 'web-mode' : ''}`.trim()}>
        {/* Standard Basic Layout (guns.lol style matching user screenshots) */}
        {(!profile.layout || profile.layout === 'card') && (
          <div
            className={`profile-card-3d guns-basic-card${(profile.profileBlur ?? 0) > 0 ? ' guns-glass' : ''}`}
            style={{
              borderColor:
                (profile.profileOpacity ?? 0) <= 5
                  ? 'transparent'
                  : cardColor
                    ? `${cardColor}33`
                    : 'rgba(255, 255, 255, 0.07)',
              background:
                (profile.profileOpacity ?? 0) <= 2
                  ? 'transparent'
                  : profile.profileGradient
                    ? `linear-gradient(145deg, ${hexToRgba(
                        profile.gradientFrom || profile.lanyardCardColor || profile.cardColor || '#141417',
                        Math.max(0, (profile.profileOpacity ?? 0) / 100)
                      )}, ${hexToRgba(
                        profile.gradientTo || profile.lanyardStrapColor || cardColor,
                        Math.max(0, ((profile.profileOpacity ?? 0) / 100) * 0.65)
                      )})`
                    : hexToRgba(
                        profile.lanyardCardColor || profile.cardColor || '#141417',
                        Math.max(0, (profile.profileOpacity ?? 0) / 100)
                      ),
              backdropFilter:
                (profile.profileBlur ?? 0) > 0
                  ? `blur(${Math.round(((profile.profileBlur ?? 0) / 100) * 40)}px)`
                  : 'none',
              WebkitBackdropFilter:
                (profile.profileBlur ?? 0) > 0
                  ? `blur(${Math.round(((profile.profileBlur ?? 0) / 100) * 40)}px)`
                  : 'none',
              boxShadow: (profile.profileOpacity ?? 0) <= 5 ? 'none' : undefined
            }}
          >
            <div className="profile-card-info guns-basic-info">
              {/* 1. Circular Centered Avatar */}
              <div className={`guns-basic-avatar-wrap ${profile.otherSettings?.avatarBorder ? 'avatar-bordered' : 'avatar-plain'}`}>
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.displayName || profile.username}
                    className="guns-basic-avatar"
                  />
                ) : (
                  <div className="guns-basic-avatar guns-basic-avatar-fallback">
                    {(profile.displayName || profile.username || 'K').charAt(0).toUpperCase()}
                  </div>
                )}
                {profile.avatarFrame && (
                  <img
                    src={profile.avatarFrame}
                    alt={L("Khung avatar", "Avatar Frame")}
                    className="guns-basic-avatar-frame"
                  />
                )}
              </div>

              {/* 2. Display Name / Username with Neon Glow */}
              <h1
                className="guns-basic-username"
                style={{
                  color: effectiveTextColor,
                  fontFamily: profile.textFontFamily || 'inherit',
                  textShadow:
                    glowOn.username !== false
                      ? `0 0 16px ${effectiveTextColor}aa, 0 0 30px ${effectiveTextColor}44`
                      : profile.text3DEffect
                        ? '3px 3px 0px rgba(0,0,0,0.35), 6px 6px 0px rgba(0,0,0,0.2)'
                        : 'none'
                }}
              >
                <RevealText
                  text={profile.displayName || profile.username || 'KonOne'}
                  play={!showEnterOverlay}
                  delay={150}
                />
              </h1>

              {/* 3. Badges Pill dưới Avatar & Tên (Icon Kim cương tự hiện khi có Premium + Danh hiệu Admin cấp) */}
              {profileBadges.length > 0 && (
                <div
                  className="guns-badges-pill"
                  style={{
                    color: effectiveTextColor,
                    borderColor: `${effectiveTextColor}1f`
                  }}
                >
                  {profileBadges.map((b) => (
                    <span
                      key={b.key}
                      className={`guns-badge-ico badge-${b.key}`}
                      title={b.label}
                      style={{
                        filter:
                          glowOn.badges !== false
                            ? `drop-shadow(0 0 7px ${effectiveTextColor})`
                            : 'none'
                      }}
                    >
                      {b.icon}
                    </span>
                  ))}
                </div>
              )}

              {/* 4. Bio / Description */}
              {profile.bio && (
                <p
                  className="guns-basic-bio"
                  style={{
                    color: effectiveTextColor,
                    fontFamily: profile.textFontFamily || 'inherit'
                  }}
                >
                  <TypeText text={profile.bio} play={!showEnterOverlay} delay={700} />
                </p>
              )}

              {/* 5. Location (nếu có) */}
              {profile.location && (
                <div className="guns-basic-location" style={{ color: `${effectiveTextColor}aa` }}>
                  <span>📍 {profile.location}</span>
                </div>
              )}

              {/* 5b. Game đang chơi (tùy chọn): avatar + "Đang chơi <game>" + logo game */}
              <GamePresence profile={profile} textColor={effectiveTextColor} />

              {/* 6. Presence / Discord Box (nếu có) */}
              {(profile.presenceTitle || profile.presenceSubtitle) && (
                <div
                  className="guns-discord-presence-card"
                  style={{ borderColor: `${effectiveTextColor}1a` }}
                >
                  <div className="guns-presence-left">
                    <img
                      src={profile.avatar || '/logo-konone-v1.png'}
                      alt=""
                      className="guns-presence-thumb"
                    />
                    <div className="guns-presence-meta">
                      <strong style={{ color: effectiveTextColor }}>
                        {profile.presenceTitle || profile.displayName}
                      </strong>
                      <span>
                        <i className="presence-online-dot" />
                        {profile.presenceSubtitle || L('Đang hoạt động trên KonOne', 'Active on KonOne')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Hàng Icon Mạng xã hội bên trong thẻ */}
              {isInsideSocial && renderSocialIconsBlock('inside-card-socials guns-glow-socials')}
            </div>
          </div>
        )}

        {/* Modern Layout */}
        {profile.layout === 'modern' && (
          <div className="modern-layout-container">
            <div className="modern-avatar-wrapper">
              <div className="modern-avatar-halo" style={{ background: `radial-gradient(circle, ${cardColor}66 0%, transparent 70%)` }}></div>
              {profile.avatar ? (
                <div className={`modern-avatar-container ${profile.otherSettings?.avatarBorder ? 'avatar-bordered' : 'avatar-plain'}`}>
                  <img src={profile.avatar} alt={profile.displayName} className="modern-avatar" />
                  {profile.avatarFrame && (
                    <img
                      src={profile.avatarFrame}
                      alt={L("Khung avatar", "Avatar Frame")}
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
                {profile.displayName || L('Chưa có tên', 'No name yet')}
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

              {/* Premium Music Player Presence Card */}
              {(profile.presenceTitle || profile.presenceSubtitle) && (
                <div className="music-player-card">
                  <div className="player-disc-container">
                    <div className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`}>
                      <div className="vinyl-texture"></div>
                      <div className="disc-avatar-container">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt={L("Ảnh đại diện", "Avatar")} className="disc-avatar" />
                        ) : (
                          <div className="disc-avatar-placeholder">
                            {profile.displayName?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="disc-center-hole"></div>
                    </div>
                  </div>
                  <div className="player-info-container">
                    <div className="song-details">
                      <div className="song-title">{profile.presenceTitle || (language === 'vi' ? 'Không có tiêu đề' : 'No title')}</div>
                      <div className="artist-name">{profile.presenceSubtitle || (language === 'vi' ? 'Không có mô tả' : 'No description')}</div>
                    </div>

                    <div className="playback-controls">
                      <div className="progress-container">
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: isPlaying ? '45%' : '0%' }}></div>
                        </div>
                      </div>

                      <div className="control-icons">
                        <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 6h2v12H6zm3.5 6L18 18V6z" />
                        </svg>
                        <div className="play-pause-btn">
                          {isPlaying ? (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          )}
                        </div>
                        <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 18l8.5-6L6 6zm9-12v12h2V6z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View Count at bottom for Modern layout */}
              {isInsideSocial && renderSocialIconsBlock('inside-card-socials')}
              {profile.viewCount !== undefined && (
                <div className="modern-views">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                  <span>{profile.viewCount.toLocaleString()}{' '}{L("lượt xem", "views")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ReactBits 3D Hanging Lanyard Card Layout */}
        {profile.layout === 'lanyard' && (
          <LanyardCard
            profile={profile}
            interactive={true}
            compact={false}
            fullScreen={true}
            strapColor={profile.lanyardStrapColor || cardColor}
            cardBgColor={profile.lanyardCardColor || profile.cardColor || '#18161c'}
            cardOpacity={profile.profileOpacity ?? 0}
            cardBlur={profile.profileBlur ?? 0}
            badgeLabel={profile.lanyardBadgeLabel || 'KONONE PASS'}
          />
        )}

        {/* Bố cục WEB (MonkeDev Hero + Scroll xuống Poster Đứng bên trái & Chữ Giới thiệu bên phải) */}
        {profile.layout === 'web' && (
          <div className="web-layout-root">
            <div className="web-crt-grid-overlay" aria-hidden="true" />

            {/* PHẦN 1: HERO TRÊN ĐẦU GIỐNG ẢNH MONKEDEV */}
            <section className="web-hero-section">
              <div className="web-hero-inner">
                <div className={`web-hero-avatar-box ${profile.otherSettings?.avatarBorder ? 'avatar-bordered' : 'avatar-plain'}`}>
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.displayName || profile.username}
                      className="web-hero-avatar"
                    />
                  ) : (
                    <div className="web-hero-avatar web-hero-avatar-fallback">
                      {(profile.displayName || profile.username || 'K').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {profile.avatarFrame && (
                    <img
                      src={profile.avatarFrame}
                      alt={L("Khung avatar", "Avatar Frame")}
                      className="web-hero-avatar-frame"
                    />
                  )}
                </div>

                <div className="web-hero-meta">
                  <div className="web-hero-title-row">
                    <h1
                      className="web-hero-name"
                      style={{
                        color: effectiveTextColor,
                        fontFamily:
                          profile.textFontFamily && profile.textFontFamily !== 'Arial'
                            ? profile.textFontFamily
                            : "'Courier New', Consolas, monospace",
                        textShadow:
                          glowOn.username !== false
                            ? `0 0 18px ${effectiveTextColor}cc, 0 0 34px ${effectiveTextColor}55`
                            : 'none'
                      }}
                    >
                      <RevealText
                        text={profile.displayName || profile.username || 'KonOne'}
                        play={!showEnterOverlay}
                        delay={150}
                      />
                    </h1>

                    <span className="web-hero-divider-bar">|</span>

                    {profileBadges.length > 0 && (
                      <div className="web-hero-badges-pill" style={{ color: effectiveTextColor }}>
                        {profileBadges.map((b) => (
                          <span
                            key={b.key}
                            className={`guns-badge-ico badge-${b.key}`}
                            title={b.label}
                            style={{
                              filter:
                                glowOn.badges !== false
                                  ? `drop-shadow(0 0 8px ${effectiveTextColor})`
                                  : 'none'
                            }}
                          >
                            {b.icon}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className="web-hero-tagline"
                    style={{
                      color: effectiveTextColor,
                      fontFamily:
                        profile.textFontFamily && profile.textFontFamily !== 'Arial'
                          ? profile.textFontFamily
                          : "'Courier New', Consolas, monospace"
                    }}
                  >
                    <TypeText
                      text={
                        profile.bio ||
                        (profile.location
                          ? `${profile.location} | ${profile.viewCount || 0} Views`
                          : `KonOne Creator | @${profile.username}`)
                      }
                      play={!showEnterOverlay}
                      delay={800}
                    />
                    <span className="web-hero-blinking-cursor">|</span>
                  </div>

                  {isInsideSocial && renderSocialIconsBlock('web-hero-socials guns-glow-socials')}
                </div>
              </div>

              <a
                href={`#${webNextSectionId}`}
                className={`web-scroll-down-cta ${scrolled ? 'is-hidden' : ''}`}
                aria-label={language === 'vi' ? 'Cuộn xuống' : 'Scroll down'}
              >
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </a>
            </section>

            {/* PHẦN 2 (tùy chọn): TRANG GIỚI THIỆU Ở GIỮA — nhập nhiều chữ */}
            {webAboutOn && (
              <section id="web-about" className="web-showcase-section web-about-section">
                {webAboutAdvanced ? (
                  <WebAboutAdvanced
                    profile={profile}
                    badges={profileBadges}
                    textColor={effectiveTextColor}
                    glowBadges={glowOn.badges !== false}
                  />
                ) : (
                <div className="web-about-container" style={{ color: effectiveTextColor }}>
                  <h2 className="web-about-title" style={{ color: effectiveTextColor }}>
                    {profile.webAboutTitle || L('Về tôi', 'About Me')}
                  </h2>
                  {String(profile.webAboutSubtitle || '').trim() && (
                    <p className="web-about-subtitle" style={{ color: `${effectiveTextColor}88` }}>
                      {profile.webAboutSubtitle}
                    </p>
                  )}
                  <div className="web-about-text" style={{ color: effectiveTextColor }}>
                    {webAboutText}
                  </div>
                </div>
                )}
              </section>
            )}

            {/* PHẦN 3: SHOP — danh sách liên kết */}
            {webShopOn && (
              <section id="web-shop" className="web-showcase-section web-shop-section">
                <div className="web-shop-wrap">
                  <h2
                    className="web-intro-heading web-shop-heading"
                    style={{
                      color: effectiveTextColor,
                      textShadow: glowOn.username !== false ? `0 0 16px ${effectiveTextColor}55` : 'none'
                    }}
                  >
                    {profile.webShopTitle || 'Shop'}
                  </h2>
                  <div className="web-shop-list">
                    {webShopItems.map((it, i) => {
                      const url = String(it.url).trim();
                      return (
                        <a
                          key={`${url}-${i}`}
                          className="web-shop-item"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          style={{
                            backdropFilter: webPanelStyle.backdropFilter,
                            WebkitBackdropFilter: webPanelStyle.WebkitBackdropFilter,
                            color: effectiveTextColor
                          }}
                        >
                          <span className="web-shop-item-title">{it.title || url}</span>
                          <span className="web-shop-item-url" style={{ color: `${effectiveTextColor}99` }}>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            {url}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* PHẦN CUỐI TRANG: POSTER ĐỨNG BÊN TRÁI, CHỮ GIỚI THIỆU BÊN PHẢI */}
            <section id="web-poster-showcase" className="web-showcase-section">
              <div
                className="web-showcase-container"
                style={webPanelStyle}
              >
                {/* Cột trái: Poster đứng */}
                <div className="web-poster-column">
                  <div
                    className="web-vertical-poster-frame"
                    style={{
                      borderColor: `${profile.lanyardStrapColor || '#22c55e'}44`
                    }}
                  >
                    {profile.webPosterImage || profile.coverImage || profile.avatar ? (
                      <img
                        src={profile.webPosterImage || profile.coverImage || profile.avatar}
                        alt={profile.displayName || profile.username}
                        className="web-vertical-poster-img"
                      />
                    ) : (
                      <div className="web-vertical-poster-fallback">
                        <span>{(profile.displayName || profile.username || 'K').charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cột phải: Chữ giới thiệu */}
                <div className="web-intro-column" style={{ color: effectiveTextColor }}>
                  <span
                    className="web-intro-eyebrow"
                    style={{ color: profile.lanyardStrapColor || '#22c55e' }}
                  >
                    {L("GIỚI THIỆU", "ABOUT / INTRODUCTION")}
                  </span>

                  <h2
                    className="web-intro-heading"
                    style={{
                      color: effectiveTextColor,
                      textShadow:
                        glowOn.username !== false
                          ? `0 0 16px ${effectiveTextColor}55`
                          : 'none'
                    }}
                  >
                    {profile.webIntroTitle ||
                      L(
                        `Giới thiệu về ${profile.displayName || profile.username}`,
                        `About ${profile.displayName || profile.username}`
                      )}
                  </h2>

                  <div
                    className="web-intro-body-text"
                    style={{ color: `${effectiveTextColor}dd` }}
                  >
                    {profile.webIntroText ||
                      profile.bio ||
                      L(
                        `Xin chào! Tôi là ${profile.displayName || profile.username}. Cảm ơn bạn đã ghé thăm trang hồ sơ cá nhân của tôi trên KonOne.`,
                        `Hi! I'm ${profile.displayName || profile.username}. Thanks for visiting my profile on KonOne.`
                      )}
                  </div>

                  {profile.location && (
                    <div className="web-intro-meta-tags">
                      <span className="web-meta-chip">📍 {profile.location}</span>
                      <span className="web-meta-chip">@{profile.username}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Social Links Icons Outside Card */}
      {!isInsideSocial && renderSocialIconsBlock('outside-card-socials guns-glow-socials')}

      {/* Khung Âm Thanh ở dưới — chỉ hiện ở bố cục Basic */}
      {youtubeVideoId && (!profile.layout || profile.layout === 'card') && (
        <div
          className={`guns-audio-player-card${(profile.profileBlur ?? 0) > 0 ? ' guns-glass' : ''}`}
          style={{
            color: effectiveTextColor,
            ...musicBoxSyncStyle({
              cardColor: profile.lanyardCardColor || profile.cardColor,
              musicBoxColor: profile.musicBoxColor,
              opacity: profile.profileOpacity ?? 0,
              blur: profile.profileBlur ?? 0,
              gradient: profile.profileGradient,
              gradientFrom: profile.gradientFrom || profile.lanyardCardColor || profile.cardColor,
              gradientTo: profile.gradientTo || profile.lanyardStrapColor || cardColor
            })
          }}
        >
          <img
            src={`https://img.youtube.com/vi/${ytMusicId}/hqdefault.jpg`}
            alt={L("Ảnh bìa nhạc", "Audio Thumbnail")}
            className="guns-audio-thumb"
          />

          <div className="guns-audio-main">
            <div className="guns-audio-title" style={{ color: effectiveTextColor }}>
              {audioTrackTitle || profile.musicTitle || `${profile.displayName || profile.username} — Audio`}
            </div>
            <div className="guns-audio-timeline-row">
              <span className="guns-audio-time" style={{ color: `${effectiveTextColor}b3` }}>
                {formatAudioTime(audioCurrentTime)}
              </span>
              <div
                className="guns-audio-progress-track"
                onClick={(e) => {
                  const p = window.youtubePlayer;
                  if (!p || !audioDuration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                  const nextSec = ratio * audioDuration;
                  try {
                    p.seekTo(nextSec, true);
                    setAudioCurrentTime(nextSec);
                  } catch {
                    // ignore
                  }
                }}
              >
                <div
                  className="guns-audio-progress-fill"
                  style={{
                    width: `${audioDuration > 0 ? Math.min(100, (audioCurrentTime / audioDuration) * 100) : 12}%`,
                    background: profile.musicAccentColor || effectiveTextColor
                  }}
                />
              </div>
              <span className="guns-audio-time" style={{ color: `${effectiveTextColor}b3` }}>
                {formatAudioTime(audioDuration || 198)}
              </span>
            </div>
          </div>

          <div className="guns-audio-controls" style={{ color: profile.musicAccentColor || effectiveTextColor }}>
            <button
              type="button"
              className="guns-audio-ctrl-btn"
              title={L("Phát lại", "Restart")}
              onClick={() => {
                try {
                  window.youtubePlayer?.seekTo(0, true);
                  setAudioCurrentTime(0);
                } catch {}
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              type="button"
              className="guns-audio-ctrl-btn play"
              title={isPlaying ? 'Pause' : 'Play'}
              onClick={toggleMusic}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="guns-audio-ctrl-btn"
              title={L("Bài tiếp", "Next")}
              onClick={() => {
                try {
                  window.youtubePlayer?.seekTo(0, true);
                  setAudioCurrentTime(0);
                } catch {}
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
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
          <span>{profile.viewCount.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}


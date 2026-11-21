import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToCloudinary } from '../config/cloudinary';
import { t } from '../translations';
import LanyardCard from './LanyardCard';
import SplashCursor from './SplashCursor';
import BlobCursor from './BlobCursor';
import CursorFx from './CursorFx';
import { CURSOR_EFFECTS, CURSOR_FX_IDS } from '../constants/cursorEffects';
import { PLATFORM_BY_KEY } from '../constants/socialPlatforms';
import { resolveProfileBadges } from '../constants/badges';
import { PREMIUM_LAYOUTS, countLinks, premiumViolations } from '../constants/premium';
import { getYouTubeVideoId } from '../utils/youtube';
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
import DiamondIcon from './DiamondIcon';
import { BackgroundEffectModal, UsernameEffectModal, BACKGROUND_EFFECTS } from './EditorEffectModals';
import SlideCommit from './SlideCommit';
import { musicBoxBg } from '../utils/color';
import { notifyError, notifySuccess, confirmDialog } from '../notify/notify';
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

function hexToRgba(hex, alpha = 0.8) {
  if (!hex || typeof hex !== 'string') return `rgba(18, 17, 23, ${alpha})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return `rgba(18, 17, 23, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const SHOW_DEMO_PROFILE = false;

export default function ProfileEditor() {
  const { currentUser } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false); // trạng thái lưu (thanh trượt Lưu tự hiển thị đang xử lý)
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isStubProfile, setIsStubProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [bgMode, setBgMode] = useState('image'); // 'image' | 'video'
  const [uploadingCursor, setUploadingCursor] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [isHidden, setIsHidden] = useState(false); // Ẩn hồ sơ với người khác
  const [savedUsername, setSavedUsername] = useState(''); // username đã lưu (để mở đúng link)
  const [saveToast, setSaveToast] = useState(null); // { ok, text } — thanh báo dưới màn hình sau khi lưu
  const toastTimer = useRef(null);

  function showSaveToast(ok, text) {
    clearTimeout(toastTimer.current);
    setSaveToast({ ok, text });
    toastTimer.current = setTimeout(() => setSaveToast(null), 9000);
  }

  async function toggleHidden() {
    const next = !isHidden;
    setIsHidden(next);
    if (profileId) {
      try {
        await updateDoc(doc(db, 'profiles', profileId), { isHidden: next });
        showSaveToast(true, next ? L('Hồ sơ đã được ẩn', 'Profile hidden') : L('Hồ sơ đã hiện lại', 'Profile is visible again'));
      } catch (err) {
        setIsHidden(!next);
        notifyError(L('Không đổi được trạng thái ẩn: ', 'Could not change visibility: ') + err.message);
      }
    }
  }
  const [profileOpacity, setProfileOpacity] = useState(0);
  const [profileBlur, setProfileBlur] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  // Premium text styling
  const [textFontFamily, setTextFontFamily] = useState('Arial');
  const [text3DEffect, setText3DEffect] = useState(false);
  const [textBorderWidth, setTextBorderWidth] = useState(0);
  const [textBorderColor, setTextBorderColor] = useState('#ffffff');
  const [textBorderStyle, setTextBorderStyle] = useState('solid');
  const [viewCount, setViewCount] = useState(0);

  // Modals / Popovers cho các ô trong giao diện Custom kiểu guns.lol
  const [showCursorManager, setShowCursorManager] = useState(false); // bảng Con trỏ tùy chỉnh
  const [cursorModalTab, setCursorModalTab] = useState('cursor'); // 'cursor' | 'frame'
  const [showWidgetManager, setShowWidgetManager] = useState(false);
  const [showUsernameEffects, setShowUsernameEffects] = useState(false);
  const [showBgEffects, setShowBgEffects] = useState(false);

  // Glow & Color & Toggle states
  const [glowSettings, setGlowSettings] = useState({
    username: true,
    socials: true,
    badges: true
  });
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const [iconColor, setIconColor] = useState('#ffffff');
  const [profileGradient, setProfileGradient] = useState(false);
  const [socialPosition, setSocialPosition] = useState('inside');
  const [customLinks, setCustomLinks] = useState([]);
  const [adminBadgeData, setAdminBadgeData] = useState({});
  const [demoAudioTitle, setDemoAudioTitle] = useState('');
  const [otherSettings, setOtherSettings] = useState({
    monochromeIcons: true,
    animatedTitle: false,
    swapBoxColors: false,
    volumeControl: true,
    useDiscordAvatar: false,
    discordAvatarDecoration: true,
    avatarBorder: false, // Viền avatar — mặc định tắt
    showLinks: true // Hiển thị liên kết (mạng xã hội & link riêng) trên hồ sơ
  });

  // ReactBits SplashCursor customization state
  const [splashCursor, setSplashCursor] = useState({
    enabled: false,
    rainbow: false,
    colors: ['#f65c5c', '#dc2626', '#a21caf'],
    size: 1,
    force: 1,
    swirl: 3,
    trail: 1,
    clickSplash: true,
    colorSpeed: 1,
    intensity: 1,
    momentum: 1,
    shading: 1,
    glow: 0,
    quality: 'high'
  });

  // ReactBits BlobCursor customization state
  const [blobCursor, setBlobCursor] = useState({
    enabled: false,
    material: 'chrome',
    color: '#3B82F6',
    blend: 'normal',
    size: 140,
    morph: 0,
    morphSpeed: 0.4,
    depth: 1,
    trail: 16,
    lag: 0.55,
    goo: 1,
    stretch: 0.6,
    wobble: 1,
    drip: 0,
    shine: 1,
    splash: true,
    splashCount: 6,
    splashSpeed: 0.5,
    splashSize: 0.5,
    splashGravity: 0,
    regrow: 0.5,
    shadow: false,
    hideCursor: true
  });

  // Tab đang mở trong bảng chỉnh hiệu ứng chuột ('splash' | 'blob')
  const [cursorTab, setCursorTab] = useState('splash');
  const [showCursorTuning, setShowCursorTuning] = useState(false);

  // Hiệu ứng chuột dạng canvas: id = '' | 'bubble' | 'rainbow' | 'trail3d'
  const [cursorFx, setCursorFx] = useState({
    id: '',
    length: 20, size: 3, trailSpeed: 0.4, // rainbow
    particles: 15, rate: 0.4              // trail3d
  });

  // Chỉ 1 loại chuột được bật: bật loại này thì tắt các loại kia
  useEffect(() => {
    if (splashCursor.enabled) {
      setBlobCursor((prev) => (prev.enabled ? { ...prev, enabled: false } : prev));
      setCursorFx((prev) => (prev.id ? { ...prev, id: '' } : prev));
    }
  }, [splashCursor.enabled]);
  useEffect(() => {
    if (blobCursor.enabled) {
      setSplashCursor((prev) => (prev.enabled ? { ...prev, enabled: false } : prev));
      setCursorFx((prev) => (prev.id ? { ...prev, id: '' } : prev));
    }
  }, [blobCursor.enabled]);
  useEffect(() => {
    if (cursorFx.id) {
      setSplashCursor((prev) => (prev.enabled ? { ...prev, enabled: false } : prev));
      setBlobCursor((prev) => (prev.enabled ? { ...prev, enabled: false } : prev));
    }
  }, [cursorFx.id]);

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
    layout: 'card',
    lanyardStrapColor: '#f65c5c',
    lanyardCardColor: '#18161c',
    lanyardBadgeLabel: 'KONONE PASS',
    musicBoxColor: '',
    musicAccentColor: '',
    gradientFrom: '',
    gradientTo: '',
    nameScale: 100, // cỡ chữ tiêu đề (%)
    bioScale: 100, // cỡ chữ mô tả (%)
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
    cardColor: '#1b1b1b',
    cursorIcon: '',
    presenceType: 'playing',
    presenceTitle: '',
    presenceSubtitle: '',
    presenceIcon: '',
    webPosterImage: '',
    webIntroTitle: '',
    webIntroText: ''
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
          setIsHidden(Boolean(profileData.isHidden));
          setSavedUsername(profileData.username || '');
          setIsStubProfile(Boolean(profileData.isStub) || !profileData.username);

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
            layout: ['lanyard', 'web'].includes(profileData.layout) ? profileData.layout : 'card',
            lanyardStrapColor: profileData.lanyardStrapColor || '#f65c5c',
            lanyardCardColor: profileData.lanyardCardColor || profileData.cardColor || '#18161c',
            lanyardBadgeLabel: profileData.lanyardBadgeLabel || 'KONONE PASS',
            musicBoxColor: profileData.musicBoxColor || '',
            musicAccentColor: profileData.musicAccentColor || '',
            gradientFrom: profileData.gradientFrom || '',
            gradientTo: profileData.gradientTo || '',
            nameScale: Number(profileData.nameScale) || 100,
            bioScale: Number(profileData.bioScale) || 100,
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
            cardColor: profileData.cardColor || '#1b1b1b',
            cursorIcon: profileData.cursorIcon || '',
            presenceType: profileData.presenceType || 'playing',
            presenceTitle: profileData.presenceTitle || '',
            presenceSubtitle: profileData.presenceSubtitle || '',
            presenceIcon: profileData.presenceIcon || '',
            webPosterImage: profileData.webPosterImage || '',
            webIntroTitle: profileData.webIntroTitle || '',
            webIntroText: profileData.webIntroText || ''
          });

          setProfileOpacity(profileData.profileOpacity ?? 0);
          setProfileBlur(profileData.profileBlur ?? 0);
          setTextFontFamily(profileData.textFontFamily || 'Arial');
          setText3DEffect(Boolean(profileData.text3DEffect));
          setTextBorderWidth(profileData.textBorderWidth || 0);
          setTextBorderColor(profileData.textBorderColor || '#ffffff');
          setTextBorderStyle(profileData.textBorderStyle || 'solid');
          setViewCount(profileData.viewCount || 0);

          if (profileData.glowSettings) setGlowSettings(profileData.glowSettings);
          if (profileData.textColor) setTextColor(profileData.textColor);
          if (profileData.bgColor) setBgColor(profileData.bgColor);
          if (profileData.iconColor) setIconColor(profileData.iconColor);
          if (profileData.profileGradient !== undefined) setProfileGradient(Boolean(profileData.profileGradient));
          if (profileData.socialPosition) {
            setSocialPosition(profileData.socialPosition === 'outside' ? 'outside' : 'inside');
          }
          if (Array.isArray(profileData.customLinks)) {
            setCustomLinks(profileData.customLinks);
          }
          setAdminBadgeData({
            badges: profileData.badges,
            isAdmin: profileData.isAdmin,
            isStaff: profileData.isStaff,
            isBugHunter: profileData.isBugHunter,
            isVerified: profileData.isVerified,
            isSupporter: profileData.isSupporter,
            isMedal: profileData.isMedal,
            isBooster: profileData.isBooster,
            isOg: profileData.isOg
          });
          if (profileData.otherSettings) {
            setOtherSettings((prev) => ({
              ...prev,
              ...profileData.otherSettings,
              discordAvatarDecoration: Boolean(profileData.avatarFrame)
            }));
          }
          if (profileData.splashCursor && typeof profileData.splashCursor === 'object') {
            setSplashCursor((prev) => ({
              ...prev,
              ...profileData.splashCursor,
              colors:
                Array.isArray(profileData.splashCursor.colors) && profileData.splashCursor.colors.length === 3
                  ? profileData.splashCursor.colors
                  : prev.colors
            }));
          }
          if (profileData.blobCursor && typeof profileData.blobCursor === 'object') {
            setBlobCursor((prev) => ({
              ...prev,
              ...profileData.blobCursor,
              // Dữ liệu cũ có thể bật cả 2 — ưu tiên Splash
              enabled: Boolean(profileData.blobCursor.enabled && !profileData.splashCursor?.enabled)
            }));
            if (profileData.blobCursor.enabled && !profileData.splashCursor?.enabled) {
              setCursorTab('blob');
            }
          }
          if (profileData.cursorFx && typeof profileData.cursorFx === 'object') {
            const fxId = CURSOR_FX_IDS.includes(profileData.cursorFx.id) ? profileData.cursorFx.id : '';
            setCursorFx((prev) => ({ ...prev, ...profileData.cursorFx, id: fxId }));
            if (fxId) setCursorTab(fxId);
          }
        } else {
          setIsStubProfile(true);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoaded(true);
      }
    }

    if (currentUser) {
      loadProfile();
    }
  }, [currentUser]);

  async function handleImageUpload(file, type) {
    if (!file) return null;

    if (!file.type.startsWith('image/')) {
      notifyError(L("Vui lòng chọn file ảnh", "Please choose an image file"));
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      notifyError(L("Kích thước ảnh không được vượt quá 10MB", "Image size must not exceed 10MB"));
      return null;
    }

    if (type === 'avatar') setUploadingAvatar(true);
    else if (type === 'coverImage') setUploadingCover(true);
    else if (type === 'backgroundImage') setUploadingBackground(true);
    else if (type === 'cursorIcon') setUploadingCursor(true);
    else if (type === 'webPosterImage') setUploadingPoster(true);
    setUploading(true);

    try {
      const folder = `profiles/${currentUser.uid}/${type}`;
      const url = await uploadToCloudinary(file, folder);
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      notifyError(L('Lỗi khi tải ảnh lên: ', 'Image upload failed: ') + error.message);
      return null;
    } finally {
      setUploading(false);
      if (type === 'avatar') setUploadingAvatar(false);
      else if (type === 'coverImage') setUploadingCover(false);
      else if (type === 'backgroundImage') setUploadingBackground(false);
      else if (type === 'cursorIcon') setUploadingCursor(false);
      else if (type === 'webPosterImage') setUploadingPoster(false);
    }
  }

  async function handleLayoutSwitch(nextLayout) {
    // Cho xem demo mọi bố cục; bố cục Premium chỉ được lưu khi có Premium (kiểm tra lúc bấm Lưu)
    setFormData((prev) => ({ ...prev, layout: nextLayout }));
    if (profileId && (isPremium || !PREMIUM_LAYOUTS.includes(nextLayout))) {
      try {
        await updateDoc(doc(db, 'profiles', profileId), { layout: nextLayout });
      } catch (err) {
        console.error('Error auto-saving layout:', err);
      }
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setLoading(true);

    try {
      if (!isPremium) {
        const violations = premiumViolations(
          {
            layout: formData.layout,
            effect: formData.effect,
            splashEnabled: splashCursor.enabled || Boolean(cursorFx.id),
            blobEnabled: blobCursor.enabled,
            backgroundVideo: formData.backgroundVideo,
            linkCount: countLinks(formData.socialLinks, customLinks)
          },
          language
        );
        if (violations.length) {
          setLoading(false);
          const ok = await confirmDialog({
            title: L('Cần Premium để lưu', 'Premium required to save'),
            message:
              L('Các mục sau chỉ dành cho Premium:', 'These items require Premium:') +
              `\n• ${violations.join('\n• ')}\n\n` +
              L('Hãy tắt chúng để lưu, hoặc nâng cấp Premium.', 'Turn them off to save, or upgrade to Premium.'),
            confirmText: L('Nâng cấp Premium', 'Upgrade to Premium'),
            cancelText: L('Để sau', 'Not now')
          });
          if (ok) navigate('/premium');
          return false;
        }
      }

      const normalizedUsername = formData.username.toLowerCase().trim();
      if (!normalizedUsername || !formData.displayName.trim()) {
        notifyError(L('Vui lòng nhập tên người dùng và tên hiển thị!', 'Please enter a username and display name!'));
        setLoading(false);
        return false;
      }

      const cleanHashtags = Array.isArray(formData.hashtags)
        ? formData.hashtags.filter((tag) => tag && typeof tag === 'string' && tag.trim() !== '')
        : [];

      const cleanSocialLinks = {};
      if (formData.socialLinks && typeof formData.socialLinks === 'object') {
        Object.entries(formData.socialLinks).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            cleanSocialLinks[k] = String(v);
          }
        });
      }

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
        avatarFrame: otherSettings.discordAvatarDecoration ? String(formData.avatarFrame || '') : '',
        coverImage: String(formData.coverImage || ''),
        backgroundImage: String(formData.backgroundImage || ''),
        backgroundVideo: String(formData.backgroundVideo || ''),
        musicUrl: String(formData.musicUrl || ''),
        effect: String(formData.effect || 'none'),
        layout: String(formData.layout || 'card'),
        lanyardStrapColor: String(formData.lanyardStrapColor || '#f65c5c'),
        lanyardCardColor: String(formData.lanyardCardColor || formData.cardColor || '#18161c'),
        lanyardBadgeLabel: String(formData.lanyardBadgeLabel || 'KONONE PASS'),
        musicBoxColor: String(formData.musicBoxColor || ''),
        musicAccentColor: String(formData.musicAccentColor || ''),
        gradientFrom: String(formData.gradientFrom || ''),
        gradientTo: String(formData.gradientTo || ''),
        nameScale: Number(formData.nameScale) || 100,
        bioScale: Number(formData.bioScale) || 100,
        socialLinks: cleanSocialLinks,
        jobTitle: String(formData.jobTitle || ''),
        status: String(formData.status || ''),
        turma: String(formData.turma || ''),
        hashtags: cleanHashtags,
        cardColor: String(formData.cardColor || '#1b1b1b'),
        cursorIcon: String(formData.cursorIcon || ''),
        presenceType: String(formData.presenceType || 'playing'),
        presenceTitle: String(formData.presenceTitle || ''),
        presenceSubtitle: String(formData.presenceSubtitle || ''),
        presenceIcon: String(formData.presenceIcon || ''),
        webPosterImage: String(formData.webPosterImage || ''),
        webIntroTitle: String(formData.webIntroTitle || ''),
        webIntroText: String(formData.webIntroText || ''),
        profileOpacity: Number(profileOpacity) || 0,
        profileBlur: Number(profileBlur) || 0,
        textFontFamily: String(textFontFamily || 'Arial'),
        text3DEffect: Boolean(text3DEffect),
        textBorderWidth: Number(textBorderWidth) || 0,
        textBorderColor: String(textBorderColor || '#ffffff'),
        textBorderStyle: String(textBorderStyle || 'solid'),
        glowSettings,
        textColor,
        bgColor,
        iconColor,
        profileGradient,
        socialPosition,
        otherSettings,
        splashCursor: {
          enabled: Boolean(splashCursor.enabled),
          rainbow: Boolean(splashCursor.rainbow),
          colors: Array.isArray(splashCursor.colors) && splashCursor.colors.length === 3
            ? splashCursor.colors.map((c) => String(c || '#f65c5c'))
            : ['#f65c5c', '#dc2626', '#a21caf'],
          size: Number(splashCursor.size ?? 1),
          force: Number(splashCursor.force ?? 1),
          swirl: Number(splashCursor.swirl ?? 3),
          trail: Number(splashCursor.trail ?? 1),
          clickSplash: Boolean(splashCursor.clickSplash),
          colorSpeed: Number(splashCursor.colorSpeed ?? 1),
          intensity: Number(splashCursor.intensity ?? 1),
          momentum: Number(splashCursor.momentum ?? 1),
          shading: Number(splashCursor.shading ?? 1),
          glow: Number(splashCursor.glow ?? 0),
          quality: String(splashCursor.quality || 'high')
        },
        blobCursor: {
          enabled: Boolean(blobCursor.enabled),
          material: String(blobCursor.material || 'chrome'),
          color: String(blobCursor.color || '#3B82F6'),
          blend: String(blobCursor.blend || 'normal'),
          size: Number(blobCursor.size ?? 140),
          morph: Number(blobCursor.morph ?? 0),
          morphSpeed: Number(blobCursor.morphSpeed ?? 0.4),
          depth: Number(blobCursor.depth ?? 1),
          trail: Number(blobCursor.trail ?? 16),
          lag: Number(blobCursor.lag ?? 0.55),
          goo: Number(blobCursor.goo ?? 1),
          stretch: Number(blobCursor.stretch ?? 0.6),
          wobble: Number(blobCursor.wobble ?? 1),
          drip: Number(blobCursor.drip ?? 0),
          shine: Number(blobCursor.shine ?? 1),
          splash: Boolean(blobCursor.splash),
          splashCount: Number(blobCursor.splashCount ?? 6),
          splashSpeed: Number(blobCursor.splashSpeed ?? 0.5),
          splashSize: Number(blobCursor.splashSize ?? 0.5),
          splashGravity: Number(blobCursor.splashGravity ?? 0),
          regrow: Number(blobCursor.regrow ?? 0.5),
          shadow: Boolean(blobCursor.shadow),
          hideCursor: Boolean(blobCursor.hideCursor)
        },
        cursorFx: {
          id: CURSOR_FX_IDS.includes(cursorFx.id) ? cursorFx.id : '',
          length: Number(cursorFx.length ?? 20),
          size: Number(cursorFx.size ?? 3),
          trailSpeed: Number(cursorFx.trailSpeed ?? 0.4),
          particles: Number(cursorFx.particles ?? 15),
          rate: Number(cursorFx.rate ?? 0.4)
        },
        isHidden: Boolean(isHidden),
        isStub: false,
        updatedAt: new Date()
      };

      if (profileId) {
        await updateDoc(doc(db, 'profiles', profileId), profileData);
        setIsStubProfile(false);
        setSavedUsername(normalizedUsername);
        showSaveToast(true, L('Cập nhật hồ sơ thành công!', 'Profile updated successfully!'));
      } else {
        const usernameCheck = query(collection(db, 'profiles'), where('username', '==', normalizedUsername));
        const usernameSnapshot = await getDocs(usernameCheck);

        if (!usernameSnapshot.empty) {
          notifyError(L("Tên người dùng đã tồn tại. Vui lòng chọn tên khác.", "This username is already taken. Please choose another one."));
          setLoading(false);
          return false;
        }

        profileData.createdAt = new Date();
        const ref = await addDoc(collection(db, 'profiles'), profileData);
        setProfileId(ref.id);
        setIsStubProfile(false);
        setSavedUsername(normalizedUsername);
        showSaveToast(true, L('Tạo hồ sơ thành công!', 'Profile created successfully!'));
      }
      // Ở lại trang chỉnh sửa (không chuyển về Dashboard)
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      notifyError(L('Lỗi khi lưu hồ sơ: ', 'Error saving profile: ') + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else {
      const processedValue = name === 'username' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : value;
      setFormData((prev) => ({
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
        setFormData((prev) => ({
          ...prev,
          [type]: url
        }));
      }
    }
  }

  function handleRemoveImage(type) {
    setFormData((prev) => ({
      ...prev,
      [type]: ''
    }));
  }

  function toggleGlow(key) {
    setGlowSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleOther(key) {
    setOtherSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const profileLink = formData.username ? `${window.location.origin}/${formData.username}` : null;
  const linkedSocialEntries = Object.entries(formData.socialLinks || {}).filter(([, val]) =>
    Boolean(val && String(val).trim())
  );
  const activeSocialCount = linkedSocialEntries.length + customLinks.length;
  const accentColor = formData.cardColor && formData.cardColor !== '#1b1b1b' ? formData.cardColor : '#f65c5c';
  const hasPresence = Boolean(formData.presenceTitle || formData.presenceSubtitle);
  const demoBadges = resolveProfileBadges(adminBadgeData, isPremium);
  const demoYoutubeId = formData.musicUrl ? getYouTubeVideoId(formData.musicUrl) : null;

  useEffect(() => {
    if (!demoYoutubeId) {
      setDemoAudioTitle('');
      return undefined;
    }
    let cancelled = false;
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${demoYoutubeId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.title) setDemoAudioTitle(d.title);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [demoYoutubeId]);

  const renderDemoSocialsRow = (extraClass = '') => {
    if (activeSocialCount === 0 || otherSettings.showLinks === false) return null;
    return (
      <div className={`demo-basic-socials ${extraClass}`.trim()}>
        {linkedSocialEntries.map(([key, url]) => {
          const p = PLATFORM_BY_KEY[key];
          const colorToUse = otherSettings.monochromeIcons ? iconColor : p?.color || iconColor;
          return (
            <span
              key={key}
              className="demo-social-dot"
              title={`${p ? p.name : key}: ${url}`}
              style={{
                color: colorToUse,
                filter: glowSettings.socials ? `drop-shadow(0 0 8px ${colorToUse})` : 'none'
              }}
            >
              {p ? p.icon : key.slice(0, 2).toUpperCase()}
            </span>
          );
        })}
        {customLinks.map((item) =>
          item?.url ? (
            <span
              key={item.id || item.url}
              className="demo-social-dot"
              title={`${item.label || 'URL'}: ${item.url}`}
              style={{
                color: iconColor,
                filter: glowSettings.socials ? `drop-shadow(0 0 8px ${iconColor})` : 'none'
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
              </svg>
            </span>
          ) : null
        )}
      </div>
    );
  };

  const renderLiveEffect = () => {
    switch (formData.effect) {
      case 'snow': return <SnowEffect />;
      case 'particles': return <ParticlesEffect />;
      case 'confetti': return <ConfettiEffect />;
      case 'fireworks': return <FireworksEffect />;
      case 'rain': return <RainEffect />;
      case 'stars': return <StarsEffect />;
      case 'leaves': return <LeavesEffect />;
      case 'aurora': return <AuroraEffect />;
      case 'matrix': return <MatrixEffect />;
      case 'nebula': return <NebulaEffect />;
      default: return null;
    }
  };

  const isNewAccount = profileLoaded && (!profileId || isStubProfile || !savedUsername);

  const renderAssetsUploaderSection = () => (
    <section className="guns-section">
      <div className="section-head-2d">
        <h2 className="guns-section-title">{L('Assets Uploader · Hình ảnh & Media', 'Assets Uploader')}</h2>
      </div>
      <div className="guns-panel">
        <div className="assets-uploader-grid">
          {/* 1. Background */}
          <div className="asset-col">
            <div className="asset-col-head">
              <span className="asset-label">{L('Hình nền', 'Background')}</span>
              {(formData.backgroundImage || formData.backgroundVideo) && (
                <button
                  type="button"
                  className="asset-clear-x"
                  aria-label={L('Xóa hình nền', 'Remove background')}
                  onClick={() => {
                    handleRemoveImage('backgroundImage');
                    setFormData((prev) => ({ ...prev, backgroundVideo: '' }));
                  }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div
              className="asset-drop-box"
              role="button"
              tabIndex={0}
              onClick={() => {
                setBgMode(formData.backgroundVideo && !formData.backgroundImage ? 'video' : 'image');
                setBgModalOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setBgModalOpen(true);
                }
              }}
            >
              {uploadingBackground && (
                <div className="uploading-overlay"><div className="spinner" /></div>
              )}
              {formData.backgroundImage ? (
                <img src={formData.backgroundImage} alt={L('Hình nền', 'Background')} className="asset-filled-img" />
              ) : formData.backgroundVideo ? (
                <>
                  <svg className="asset-svg-ico asset-svg-2d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="14" height="14" rx="2.5" />
                    <polygon points="22 8 16 12 22 16 22 8" />
                  </svg>
                  <span className="asset-hint">{L('Video nền đã được thiết lập', 'Background video is set')}</span>
                </>
              ) : (
                <>
                  <svg className="asset-svg-ico asset-svg-2d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2.5" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="asset-hint">{L('Bấm để chọn hình nền', 'Click to choose a background')}</span>
                </>
              )}
            </div>
            {bgModalOpen && createPortal(
              <div className="bg-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setBgModalOpen(false); }}>
                <div className="bg-modal" role="dialog" aria-modal="true" aria-label={L('Hình nền', 'Background')}>
                  <div className="bg-modal-head">
                    <strong>{L('Hình nền', 'Background')}</strong>
                    <button type="button" className="bg-modal-x" aria-label={L('Đóng', 'Close')} onClick={() => setBgModalOpen(false)}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-modal-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={bgMode === 'image'} className={bgMode === 'image' ? 'active' : ''} onClick={() => setBgMode('image')}>
                      {L('Hình ảnh', 'Image')}
                    </button>
                    <button type="button" role="tab" aria-selected={bgMode === 'video'} className={bgMode === 'video' ? 'active' : ''} onClick={() => setBgMode('video')}>
                      {L('Link Video', 'Video link')}
                    </button>
                  </div>

                  {bgMode === 'image' ? (
                    <div className="bg-modal-body">
                      <div className="bg-modal-drop">
                        {uploadingBackground && (
                          <div className="uploading-overlay"><div className="spinner" /></div>
                        )}
                        {formData.backgroundImage ? (
                          <img src={formData.backgroundImage} alt="" className="asset-filled-img" />
                        ) : (
                          <>
                            <svg className="asset-svg-ico asset-svg-2d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="asset-hint">{L('Bấm để tải ảnh lên (tối đa 10MB)', 'Click to upload an image (max 10MB)')}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="asset-file-input"
                          disabled={uploadingBackground}
                          onChange={async (e) => {
                            const input = e.target;
                            await handleImageChange(e, 'backgroundImage');
                            input.value = '';
                          }}
                        />
                      </div>
                      {formData.backgroundImage && (
                        <p className="bg-modal-note">{L('Bấm vào ảnh để thay ảnh khác.', 'Click the image to replace it.')}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-modal-body">
                      <label className="bg-modal-label">
                        {L('Video nền (YouTube hoặc link .mp4)', 'Background video (YouTube or .mp4 link)')}{' '}<DiamondIcon className="pro-diamond" />
                      </label>
                      <div className="dark-input-box">
                        <input
                          type="url"
                          name="backgroundVideo"
                          value={formData.backgroundVideo}
                          onChange={handleChange}
                          placeholder={isPremium ? 'https://youtube.com/watch?v=... hoặc https://.../video.mp4' : 'Link YouTube / .mp4 (Premium để lưu)'}
                          autoFocus
                        />
                      </div>
                      {!isPremium && (
                        <p className="bg-modal-note">{L('Video nền chỉ lưu được với gói Premium.', 'Background video can only be saved with Premium.')}</p>
                      )}
                    </div>
                  )}

                  <div className="bg-modal-foot">
                    {(formData.backgroundImage || formData.backgroundVideo) && (
                      <button
                        type="button"
                        className="bg-modal-btn danger"
                        onClick={() => {
                          handleRemoveImage('backgroundImage');
                          setFormData((prev) => ({ ...prev, backgroundVideo: '' }));
                        }}
                      >
                        {L('Xóa hình nền', 'Remove')}
                      </button>
                    )}
                    <button type="button" className="bg-modal-btn primary" onClick={() => setBgModalOpen(false)}>
                      {L('Xong', 'Done')}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* 2. Audio */}
          <div className="asset-col">
            <div className="asset-col-head">
              <span className="asset-label">{L('Âm thanh', 'Audio')}</span>
              {formData.musicUrl && <span className="asset-active-dot" title={L('Đã liên kết âm thanh', 'Audio linked')} />}
            </div>
            <div
              className={`asset-drop-box ${formData.musicUrl ? 'active-box' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setAudioModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setAudioModalOpen(true);
                }
              }}
            >
              <svg className="asset-svg-ico asset-svg-2d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span className="asset-hint">
                {formData.musicUrl
                  ? L('Đã liên kết nhạc (bấm để sửa)', 'Audio linked (click to edit)')
                  : L('Bấm để thêm nhạc', 'Click to add audio')}
              </span>
            </div>
            {audioModalOpen && createPortal(
              <div className="bg-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setAudioModalOpen(false); }}>
                <div className="bg-modal" role="dialog" aria-modal="true" aria-label={L('Âm thanh', 'Audio')}>
                  <div className="bg-modal-head">
                    <strong>{L('Âm thanh', 'Audio')}</strong>
                    <button type="button" className="bg-modal-x" aria-label={L('Đóng', 'Close')} onClick={() => setAudioModalOpen(false)}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-modal-body">
                    <label className="bg-modal-label">{L('Link nhạc (YouTube hoặc .mp3/.mp4)', 'Music link (YouTube or .mp3/.mp4)')}</label>
                    <div className="dark-input-box">
                      <input
                        id="music-url-input"
                        type="url"
                        name="musicUrl"
                        value={formData.musicUrl}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=... hoặc https://.../nhac.mp4"
                        autoFocus
                      />
                    </div>
                    <p className="bg-modal-note">{L('Dán link YouTube hoặc link tệp trực tiếp (.mp3, .mp4...) để làm nhạc nền.', 'Paste a YouTube link or a direct file link (.mp3, .mp4...) as your music.')}</p>
                  </div>

                  <div className="bg-modal-foot">
                    {formData.musicUrl && (
                      <button
                        type="button"
                        className="bg-modal-btn danger"
                        onClick={() => setFormData((prev) => ({ ...prev, musicUrl: '' }))}
                      >
                        {L('Xóa âm thanh', 'Remove')}
                      </button>
                    )}
                    <button type="button" className="bg-modal-btn primary" onClick={() => setAudioModalOpen(false)}>
                      {L('Xong', 'Done')}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* 3. Profile Avatar */}
          <div className="asset-col">
            <div className="asset-col-head">
              <span className="asset-label">{L('Ảnh đại diện', 'Profile Avatar')}</span>
              {formData.avatar && (
                <button
                  type="button"
                  className="asset-clear-x"
                  aria-label={L('Xóa ảnh đại diện', 'Remove avatar')}
                  onClick={() => handleRemoveImage('avatar')}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div className="asset-drop-box">
              {uploadingAvatar && (
                <div className="uploading-overlay"><div className="spinner" /></div>
              )}
              {formData.avatar ? (
                <img src={formData.avatar} alt={L('Ảnh đại diện', 'Avatar')} className="asset-filled-img" />
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, 'avatar')}
                    disabled={uploadingAvatar}
                    className="asset-file-input"
                  />
                  <svg className="asset-svg-ico asset-svg-2d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="asset-hint">{L('Bấm để tải tệp lên', 'Click to upload a file')}</span>
                </>
              )}
            </div>
          </div>

          {/* 4. Custom Cursor */}
          <div className="asset-col">
            <div className="asset-col-head">
              <span className="asset-label">{L('Con trỏ tùy chỉnh', 'Custom Cursor')}</span>
              {splashCursor.enabled && <span className="asset-active-dot" title={L('Đang bật Splash Cursor', 'Splash Cursor Enabled')} />}
              {formData.cursorIcon && (
                <button
                  type="button"
                  className="asset-clear-x"
                  aria-label={L('Xóa con trỏ', 'Remove cursor')}
                  onClick={() => handleRemoveImage('cursorIcon')}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div
              className={`asset-drop-box ${showCursorManager || splashCursor.enabled ? 'active-box' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setShowCursorManager(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowCursorManager(true);
                }
              }}
            >
              {uploadingCursor && (
                <div className="uploading-overlay"><div className="spinner" /></div>
              )}
              {formData.cursorIcon ? (
                <img src={formData.cursorIcon} alt={L('Con trỏ', 'Cursor')} className="asset-filled-img contain" />
              ) : (
                <>
                  <svg className="asset-svg-ico asset-svg-2d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4l7.07 17 2.51-7.39L21 11.07 4 4z" />
                    <path d="M13 13l6 6" />
                  </svg>
                  <span className="asset-hint">
                    {splashCursor.enabled
                      ? L('Đang bật Splash Cursor (bấm để sửa)', 'Splash Cursor active (click to edit)')
                      : L('Bấm để tùy chỉnh con trỏ', 'Click to customize cursor')}
                  </span>
                </>
              )}
            </div>
            {showCursorManager && createPortal(
              <div className="bg-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCursorManager(false); }}>
                <div className="bg-modal" role="dialog" aria-modal="true" aria-label={L('Con trỏ tùy chỉnh', 'Custom Cursor')}>
                  <div className="bg-modal-head">
                    <strong>{L('Con trỏ tùy chỉnh', 'Custom Cursor')}</strong>
                    <button type="button" className="bg-modal-x" aria-label={L('Đóng', 'Close')} onClick={() => setShowCursorManager(false)}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-modal-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={cursorModalTab === 'cursor'} className={cursorModalTab === 'cursor' ? 'active' : ''} onClick={() => setCursorModalTab('cursor')}>
                      {L('Con trỏ', 'Cursor')}
                    </button>
                    <button type="button" role="tab" aria-selected={cursorModalTab === 'frame'} className={cursorModalTab === 'frame' ? 'active' : ''} onClick={() => setCursorModalTab('frame')}>
                      {L('Khung & ảnh bìa', 'Frame & cover')}
                    </button>
                  </div>

                  {cursorModalTab === 'cursor' ? (
                    <div className="bg-modal-body">
                      <label className="bg-modal-label">{L('Chọn mẫu có sẵn', 'Choose a preset')}</label>
                      <div className="dark-input-box">
                        <select
                          value={formData.cursorIcon}
                          onChange={(e) => setFormData((prev) => ({ ...prev, cursorIcon: e.target.value }))}
                        >
                          <option value="">{L('Con trỏ mặc định', 'Default Cursor')}</option>
                          <option value="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/icon_1.png">KonOne Cursor 1</option>
                          <option value="/cursor.svg">{L('Con thỏ', 'Bunny')}</option>
                        </select>
                      </div>

                      <label className="bg-modal-label bg-modal-label--gap">{L('Hoặc tải ảnh con trỏ riêng', 'Or upload your own cursor')}</label>
                      <div className="bg-modal-drop bg-modal-drop--short">
                        {uploadingCursor && (
                          <div className="uploading-overlay"><div className="spinner" /></div>
                        )}
                        {formData.cursorIcon ? (
                          <img src={formData.cursorIcon} alt="" className="asset-filled-img contain" />
                        ) : (
                          <span className="asset-hint">{L('Bấm để tải ảnh lên (tối đa 10MB)', 'Click to upload an image (max 10MB)')}</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="asset-file-input"
                          disabled={uploadingCursor}
                          onChange={async (e) => {
                            const input = e.target;
                            await handleImageChange(e, 'cursorIcon');
                            input.value = '';
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-modal-body">
                      <label className="bg-modal-label">{L('Khung trang trí avatar', 'Avatar Frame Decoration')}</label>
                      <div className="dark-input-box">
                        <select
                          value={formData.avatarFrame}
                          onChange={(e) => setFormData((prev) => ({ ...prev, avatarFrame: e.target.value }))}
                        >
                          {AVATAR_FRAMES.map((f) => (
                            <option key={f.label} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      <label className="bg-modal-label bg-modal-label--gap">{L('Ảnh bìa thẻ', 'Card Cover Banner')}</label>
                      <div className="dark-upload-inline">
                        <label className="inline-upload-trigger">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'coverImage')}
                            disabled={uploadingCover}
                          />
                          {uploadingCover
                            ? L('Đang tải lên...', 'Uploading...')
                            : formData.coverImage
                              ? L('Đổi ảnh bìa', 'Change Cover')
                              : L('Tải ảnh bìa', 'Upload Cover')}
                        </label>
                        {formData.coverImage && (
                          <button type="button" className="inline-clear-btn" onClick={() => handleRemoveImage('coverImage')}>
                            {L('Xóa', 'Remove')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-modal-foot">
                    {cursorModalTab === 'cursor' && formData.cursorIcon && (
                      <button type="button" className="bg-modal-btn danger" onClick={() => handleRemoveImage('cursorIcon')}>
                        {L('Xóa con trỏ', 'Remove')}
                      </button>
                    )}
                    <button type="button" className="bg-modal-btn primary" onClick={() => setShowCursorManager(false)}>
                      {L('Xong', 'Done')}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

      </div>
    </section>
  );

  return (
    <div className="profile-editor-layout">
      {/* MENU BÊN TRÁI: Thu gọn thành 1 thanh mảnh, khi để chuột vào mới trượt mở ra */}
      <aside className="editor-sidebar" aria-label={L("Menu bên", "Sidebar Menu")}>
        <div className="sidebar-header">
          <Link to="/" className="editor-brand-link" title={L("Trang chủ KonOne", "KonOne Home")}>
            <img src="/logo-konone-v1.png" alt="KonOne Logo" className="logo-icon" />
            <span className="logo-text sidebar-reveal">KonOne</span>
          </Link>

          <div className="language-selector-editor sidebar-reveal">
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
          <div className="nav-item" onClick={() => navigate('/dashboard')} title={L("Bảng điều khiển", "Dashboard")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className="sidebar-reveal">{L("Bảng điều khiển", "Dashboard")}</span>
          </div>

          <div className="nav-item active" title={t(language, 'profileEditor.customize')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span className="sidebar-reveal">{t(language, 'profileEditor.customize')}</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/links')} title={L("Liên kết", "Links")}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span className="sidebar-reveal">{L("Liên kết", "Links")}</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/profile-template')} title={language === 'vi' ? 'Mẫu' : 'Templates'}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span className="sidebar-reveal">{language === 'vi' ? 'Mẫu' : 'Templates'}</span>
          </div>

          <div className="nav-item" onClick={() => navigate('/premium')} title="Premium">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="sidebar-reveal">Premium</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="footer-btn my-page-btn"
            onClick={() => profileLink && window.open(profileLink, '_blank')}
            disabled={!profileLink}
            title={L("Trang của tôi", "My Page")}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span className="sidebar-reveal">{L("Trang của tôi", "My Page")}</span>
          </button>

          <button
            type="button"
            className="footer-btn share-btn"
            onClick={() => {
              if (profileLink) {
                navigator.clipboard.writeText(profileLink);
                notifySuccess(L('Đã sao chép liên kết hồ sơ!', 'Profile link copied!'));
              }
            }}
            disabled={!profileLink}
            title={L("Chia sẻ hồ sơ", "Share Profile")}
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="sidebar-reveal">{L("Chia sẻ hồ sơ", "Share Profile")}</span>
          </button>

          <div className="user-info sidebar-reveal">
            <div className="user-name">{formData.username ? `@${formData.username}` : L('Chưa có tên người dùng', 'No username')}</div>
            <div className="user-uid">UID {currentUser?.uid?.slice(0, 8) || 'N/A'}</div>
            <div className="user-views">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{viewCount.toLocaleString()}{' '}{L("lượt xem", "views")}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="editor-main">
        <form onSubmit={handleSubmit} className={`editor-form ${isNewAccount ? 'is-onboarding' : ''}`}>
          {!profileLoaded ? (
            <div className="editor-loading-state">
              <div className="spinner" />
              <span>{L('Đang tải không gian hồ sơ...', 'Loading profile studio...')}</span>
            </div>
          ) : isNewAccount ? (
            <div className="onboarding-studio">
              <div className="onboarding-head">
                <div className="onboarding-badge-2d">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{L('Khởi tạo hồ sơ mới', 'New Profile Setup')}</span>
                </div>
                <h1>{L('Tạo hồ sơ KonOne của bạn', 'Create your KonOne profile')}</h1>
                <p>
                  {L(
                    'Nhập tên người dùng, tên hiển thị và tải lên hình ảnh cơ bản. Sau khi lưu, toàn bộ công cụ tùy chỉnh nâng cao sẽ được mở khóa.',
                    'Enter your username, display name, and upload your basic assets. Once saved, all advanced customization tools will unlock.'
                  )}
                </p>
              </div>

              {/* Card 1: Username & Display Name */}
              <section className="guns-section">
                <div className="section-head-2d">
                  <h2 className="guns-section-title">{L('Định danh hồ sơ', 'Profile Identity')}</h2>
                </div>
                <div className="guns-panel">
                  <div className="onboarding-identity-grid">
                    <div className="custom-dark-field">
                      <label htmlFor="onboard-username">
                        {L('Tên người dùng (Username)', 'Username')} <span className="req-dot">*</span>
                      </label>
                      <div className="dark-input-box onboarding-url-input">
                        <span className="url-prefix-2d">konone.fun/</span>
                        <input
                          id="onboard-username"
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          required
                          placeholder="yourname"
                          pattern="[a-z0-9]+"
                          autoComplete="off"
                        />
                      </div>
                      <span className="field-helper-2d">
                        {L('Chỉ dùng chữ thường (a-z) và số (0-9), không dấu cách.', 'Lowercase letters (a-z) and numbers (0-9) only.')}
                      </span>
                    </div>

                    <div className="custom-dark-field">
                      <label htmlFor="onboard-displayname">
                        {L('Tên hiển thị (Display Name)', 'Display Name')} <span className="req-dot">*</span>
                      </label>
                      <div className="dark-input-box">
                        <span className="input-lead-icon">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        <input
                          id="onboard-displayname"
                          type="text"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleChange}
                          required
                          placeholder={L('VD: Minh Khôi', 'e.g. Alex Rivera')}
                        />
                      </div>
                      <span className="field-helper-2d">
                        {L('Tên nổi bật hiển thị trên trang cá nhân của bạn.', 'The main name displayed on your public profile.')}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 2: Assets Uploader */}
              {renderAssetsUploaderSection()}

              {/* Thanh hành động khởi tạo hồ sơ */}
              <div className="onboarding-footer-bar">
                <button
                  type="button"
                  className="topbar-btn"
                  onClick={() => navigate('/dashboard')}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>{L('Quay lại Dashboard', 'Back to Dashboard')}</span>
                </button>

                <div className="onboarding-footer-right">
                  <SlideCommit
                    label={uploading ? L('Đang tải lên...', 'Uploading...') : L('Trượt để tạo hồ sơ', 'Slide to create')}
                    doneLabel={L('Đã tạo hồ sơ', 'Created')}
                    errorLabel={L('Thiếu thông tin', 'Incomplete')}
                    onConfirm={async () => {
                      const ok = await handleSubmit();
                      if (!ok) throw new Error('not-saved');
                    }}
                    trackColor="#0d0d10"
                    handleColor="#f65c5c"
                    successColor="#22c55e"
                    dangerColor="#e5484d"
                    width={210}
                    height={42}
                    radius={11}
                    holdMs={1200}
                    disabled={uploading}
                    className="topbar-slide"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* Menu header: Hủy, Premium, Ẩn hồ sơ, Lưu */}
          <div className="editor-topbar">
            <nav className="editor-menu" aria-label={L('Menu chỉnh sửa', 'Editor menu')}>
              <button type="button" className="editor-menu-item" onClick={() => navigate('/dashboard')}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                <span>{t(language, 'profileEditor.cancel')}</span>
              </button>
              {!isPremium && (
                <button type="button" className="editor-menu-item" onClick={() => navigate('/premium')}>
                  <DiamondIcon size={14} />
                  <span>Premium</span>
                </button>
              )}
              <button
                type="button"
                className={`editor-menu-item${isHidden ? ' is-on' : ''}`}
                onClick={toggleHidden}
                title={isHidden
                  ? L('Hồ sơ đang ẩn — bấm để hiện lại', 'Profile is hidden — click to show')
                  : L('Ẩn hồ sơ với người khác', 'Hide profile from others')}
              >
                {isHidden ? (
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
                <span>{isHidden ? L('Đang ẩn', 'Hidden') : L('Ẩn hồ sơ', 'Hide')}</span>
              </button>
              <span className="editor-menu-sep" aria-hidden="true" />
              <button
                type="button"
                className="editor-menu-item editor-menu-save"
                onClick={handleSubmit}
                disabled={uploading || loading}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                <span>
                  {uploading
                    ? L('Đang tải lên...', 'Uploading...')
                    : loading
                      ? L('Đang lưu...', 'Saving...')
                      : L('Lưu', 'Save')}
                </span>
              </button>
            </nav>
          </div>

          {/* WORKSPACE: Tạm ẩn Demo Profile để tập trung vào không gian chỉnh sửa đồng bộ */}
          <div className={`editor-workspace ${SHOW_DEMO_PROFILE ? '' : 'demo-hidden'}`}>
            <div className="editor-left-pane">
              {/* ================= SECTION 1: ASSETS UPLOADER ================= */}
              {renderAssetsUploaderSection()}

              {/* ================= SECTION 2: GENERAL CUSTOMIZATION ================= */}
              <section className="guns-section">
                <h2 className="guns-section-title">{L("Tùy chỉnh chung", "General Customization")}</h2>
                <div className="guns-panel">
                  <div className="general-custom-grid">
                    {/* Mô tả: một thanh nhập dài ngang */}
                    <div className="custom-dark-field general-span-all">
                      <label>{L("Mô tả", "Description")}</label>
                      <div className="dark-input-box">
                        <span className="input-lead-icon text-a">A</span>
                        <input
                          type="text"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          placeholder={L("đây là mô tả của tôi", "this is my description")}
                        />
                      </div>
                    </div>

                    {/* Hai thanh kéo dưới Mô tả */}
                    <div className="custom-dark-field general-span-half">
                      <label>
                        {L("Độ trong suốt thẻ", "Profile Opacity")}{' '}<span className="help-q-ico" title={L("Độ trong suốt nền thẻ", "Card background transparency")}>?</span>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={profileOpacity}
                          onChange={(e) => setProfileOpacity(Number(e.target.value))}
                          className="guns-range-slider"
                          style={{ '--val': `${profileOpacity}%` }}
                        />
                        <div className="guns-slider-marks">
                          <span>20%</span>
                          <span>50%</span>
                          <span>80%</span>
                        </div>
                      </div>
                    </div>

                    <div className="custom-dark-field general-span-half">
                      <label>
                        {L("Độ mờ thẻ", "Profile Blur")}{' '}<span className="help-q-ico" title={L("Mức làm mờ phía sau thẻ", "Card backdrop blur amount")}>?</span>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={profileBlur}
                          onChange={(e) => setProfileBlur(Number(e.target.value))}
                          className="guns-range-slider"
                          style={{ '--val': `${profileBlur}%` }}
                        />
                        <div className="guns-slider-marks">
                          <span>20px</span>
                          <span>50px</span>
                          <span>80px</span>
                        </div>
                      </div>
                    </div>

                    {/* Hiệu ứng nền: bấm để mở bảng (trái: lựa chọn, phải: demo) */}
                    <div className="custom-dark-field">
                      <label>
                        {L("Hiệu ứng nền", "Background Effects")}{' '}<DiamondIcon className="pro-diamond" />
                      </label>
                      <button
                        type="button"
                        className={`dark-action-box centered ${showBgEffects ? 'active' : ''}`}
                        onClick={() => setShowBgEffects(true)}
                      >
                        <span className="input-lead-icon">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                          </svg>
                        </span>
                        <span className="action-box-text">
                          {(() => {
                            const cur = BACKGROUND_EFFECTS.find((e) => e[0] === (formData.effect || 'none'));
                            return cur && cur[0] !== 'none' ? L(cur[1], cur[2]) : L('Chọn hiệu ứng', 'Choose an option');
                          })()}
                        </span>
                      </button>
                    </div>

                    {/* Row 2, Col 2: Username Effects */}
                    <div className="custom-dark-field">
                      <label>{L("Hiệu ứng tên", "Username Effects")}</label>
                      <button
                        type="button"
                        className={`dark-action-box centered ${showUsernameEffects ? 'active' : ''}`}
                        onClick={() => setShowUsernameEffects(true)}
                      >
                        <span className="input-lead-icon">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 7 4 4 20 4 20 7" />
                            <line x1="9" y1="20" x2="15" y2="20" />
                            <line x1="12" y1="4" x2="12" y2="20" />
                          </svg>
                        </span>
                        <span className="action-box-text">{L("Hiệu ứng tên", "Username Effects")}</span>
                      </button>
                    </div>

                    {/* Row 2, Col 3: Location */}
                    <div className="custom-dark-field">
                      <label>{L("Vị trí", "Location")}</label>
                      <div className="dark-input-box">
                        <span className="input-lead-icon">
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder={L("Vị trí của tôi", "My Location")}
                        />
                      </div>
                    </div>

                    {/* Row 2, Col 4: Glow Settings */}
                    <div className="custom-dark-field">
                      <label>
                        {L("Hiệu ứng phát sáng", "Glow Settings")}{' '}<span className="help-q-ico" title={L("Bật/tắt phát sáng neon cho từng phần", "Toggle neon glow on elements")}>?</span>
                      </label>
                      <div className="glow-chip-row">
                        {[
                          ['username', L('Tên', 'Name')],
                          ['socials', L('Icon', 'Icons')],
                          ['badges', L('Huy hiệu', 'Badges')]
                        ].map(([key, text]) => (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={Boolean(glowSettings[key])}
                            className={`glow-chip ${glowSettings[key] ? 'on' : ''}`}
                            onClick={() => toggleGlow(key)}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Khay mở rộng Discord Presence Widget */}
                  {showWidgetManager && (
                    <div className="guns-subdrawer">
                      <div className="subdrawer-header">
                        <strong>{L("Thẻ hoạt động — Discord Presence", "Profile Widget — Discord Presence")}</strong>
                        <button type="button" onClick={() => setShowWidgetManager(false)}>✕</button>
                      </div>
                      <div className="subdrawer-grid four">
                        <div className="custom-dark-field">
                          <label>{t(language, 'profileEditor.presenceType')}</label>
                          <div className="dark-input-box">
                            <select name="presenceType" value={formData.presenceType} onChange={handleChange}>
                              <option value="playing">{t(language, 'profileEditor.activityPlaying')}</option>
                              <option value="listening">{t(language, 'profileEditor.activityListening')}</option>
                              <option value="watching">{t(language, 'profileEditor.activityWatching')}</option>
                              <option value="streaming">{t(language, 'profileEditor.activityStreaming')}</option>
                              <option value="competing">{t(language, 'profileEditor.activityCompeting')}</option>
                            </select>
                          </div>
                        </div>
                        <div className="custom-dark-field">
                          <label>{t(language, 'profileEditor.presenceTitle')}</label>
                          <div className="dark-input-box">
                            <input
                              type="text"
                              name="presenceTitle"
                              value={formData.presenceTitle}
                              onChange={handleChange}
                              placeholder="Visual Studio Code"
                            />
                          </div>
                        </div>
                        <div className="custom-dark-field">
                          <label>{t(language, 'profileEditor.presenceSubtitle')}</label>
                          <div className="dark-input-box">
                            <input
                              type="text"
                              name="presenceSubtitle"
                              value={formData.presenceSubtitle}
                              onChange={handleChange}
                              placeholder={L("Đang chỉnh globals.css", "Editing globals.css")}
                            />
                          </div>
                        </div>
                        <div className="custom-dark-field">
                          <label>{L("Icon hoạt động", "Activity Icon")}</label>
                          <div className="dark-input-box">
                            <select name="presenceIcon" value={formData.presenceIcon} onChange={handleChange}>
                              <option value="">{L("Ảnh đại diện", "Avatar")}</option>
                              <optgroup label="Games">
                                <option value="valorant">Valorant</option>
                                <option value="lol">League of Legends</option>
                                <option value="csgo">CS:GO</option>
                                <option value="fivem">FiveM</option>
                                <option value="minecraft">Minecraft</option>
                              </optgroup>
                              <optgroup label="Coding">
                                <option value="js">JavaScript</option>
                                <option value="react">React</option>
                                <option value="css">CSS</option>
                                <option value="html">HTML</option>
                                <option value="python">Python</option>
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bảng Hiệu ứng nền & Hiệu ứng tên (trái: lựa chọn, phải: demo) */}
                  <BackgroundEffectModal
                    open={showBgEffects}
                    onClose={() => setShowBgEffects(false)}
                    value={formData.effect}
                    onChange={(key) => setFormData((prev) => ({ ...prev, effect: key }))}
                    isPremium={isPremium}
                    L={L}
                  />
                  <UsernameEffectModal
                    open={showUsernameEffects}
                    onClose={() => setShowUsernameEffects(false)}
                    L={L}
                    name={formData.displayName || formData.username || 'KonOne'}
                    bio={formData.bio || L('đây là mô tả của tôi', 'this is my description')}
                    textColor={textColor}
                    glowOn={Boolean(glowSettings.username)}
                    font={textFontFamily}
                    onFont={setTextFontFamily}
                    text3D={text3DEffect}
                    onText3D={setText3DEffect}
                    nameScale={formData.nameScale}
                    bioScale={formData.bioScale}
                    onScale={(key, val) => setFormData((prev) => ({ ...prev, [key]: val }))}
                  />
                </div>
              </section>

              {/* ================= SECTION 3: COLOR CUSTOMIZATION ================= */}
              <section className="guns-section">
                <h2 className="guns-section-title">{L("Tùy chỉnh màu sắc", "Color Customization")}</h2>
                <div className="guns-panel">
                  <div className="color-custom-layout">
                    <div className="color-fields-grid">
                      {/* 1. Card Color (Màu thẻ) */}
                      <div className="custom-dark-field">
                        <label>{language === 'vi' ? "Màu thẻ" : 'Card Color'}</label>
                        <label className="dark-color-pill">
                          <span
                            className="color-dot-preview"
                            style={{ background: formData.lanyardCardColor || formData.cardColor || '#18161c' }}
                          />
                          <input
                            type="text"
                            value={formData.lanyardCardColor || formData.cardColor || '#18161c'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev) => ({ ...prev, lanyardCardColor: val, cardColor: val }));
                            }}
                          />
                          <input
                            type="color"
                            value={formData.lanyardCardColor || formData.cardColor || '#18161c'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData((prev) => ({ ...prev, lanyardCardColor: val, cardColor: val }));
                            }}
                            className="hidden-native-color"
                          />
                          <span className="color-pencil-ico">✎</span>
                        </label>
                      </div>

                      {/* 2. Strap Color (Màu dây đeo thẻ & Viền điểm nhấn) */}
                      {formData.layout === 'lanyard' && (
                        <div className="custom-dark-field">
                          <label>{language === 'vi' ? "Màu dây đeo thẻ" : 'Lanyard Strap Color'}</label>
                          <label className="dark-color-pill">
                            <span
                              className="color-dot-preview"
                              style={{ background: formData.lanyardStrapColor || '#f65c5c' }}
                            />
                            <input
                              type="text"
                              name="lanyardStrapColor"
                              value={formData.lanyardStrapColor || '#f65c5c'}
                              onChange={handleChange}
                            />
                            <input
                              type="color"
                              name="lanyardStrapColor"
                              value={formData.lanyardStrapColor || '#f65c5c'}
                              onChange={handleChange}
                              className="hidden-native-color"
                            />
                            <span className="color-pencil-ico">✎</span>
                          </label>
                        </div>
                      )}

                      {/* 3. Text Color */}
                      <div className="custom-dark-field">
                        <label>{L("Màu chữ", "Text Color")}</label>
                        <label className="dark-color-pill">
                          <span className="color-dot-preview" style={{ background: textColor }} />
                          <input
                            type="text"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                          />
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="hidden-native-color"
                          />
                          <span className="color-pencil-ico">✎</span>
                        </label>
                      </div>

                      {/* 4. Background Color */}
                      <div className="custom-dark-field">
                        <label>{L("Màu nền", "Background Color")}</label>
                        <label className="dark-color-pill">
                          <span className="color-dot-preview" style={{ background: bgColor }} />
                          <input
                            type="text"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                          />
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="hidden-native-color"
                          />
                          <span className="color-pencil-ico">✎</span>
                        </label>
                      </div>
                    </div>

                    <div className="color-gradient-cta">
                      <button
                        type="button"
                        className={`enable-gradient-btn ${profileGradient ? 'active' : ''}`}
                        onClick={() => setProfileGradient((v) => !v)}
                      >
                        {profileGradient
                          ? L('Đang bật nền chuyển sắc', 'Profile Gradient Enabled')
                          : L('Bật nền chuyển sắc', 'Enable Profile Gradient')}
                      </button>
                    </div>

                    {profileGradient && (
                      <div className="gradient-colors-row">
                        {[
                          ['gradientFrom', L('Màu chuyển 1', 'Gradient color 1'), formData.lanyardCardColor || formData.cardColor || '#18161c'],
                          ['gradientTo', L('Màu chuyển 2', 'Gradient color 2'), formData.lanyardStrapColor || accentColor || '#f65c5c']
                        ].map(([key, text, fallback]) => {
                          const val = formData[key] || fallback;
                          const hex = /^#[0-9a-f]{6}$/i.test(val) ? val : '#18161c';
                          return (
                            <div className="custom-dark-field" key={key}>
                              <label>
                                {text}
                                {formData[key] && (
                                  <button
                                    type="button"
                                    className="color-reset-link"
                                    onClick={() => setFormData((prev) => ({ ...prev, [key]: '' }))}
                                  >
                                    {L('Mặc định', 'Reset')}
                                  </button>
                                )}
                              </label>
                              <label className="dark-color-pill">
                                <span className="color-dot-preview" style={{ background: val }} />
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                                />
                                <input
                                  type="color"
                                  value={hex}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))}
                                  className="hidden-native-color"
                                />
                                <span className="color-pencil-ico">✎</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ================= SECTION 4: OTHER CUSTOMIZATION ================= */}
              <section className="guns-section">
                <h2 className="guns-section-title">{L("Tùy chỉnh khác", "Other Customization")}</h2>
                <div className="guns-panel">
                  <div className="other-toggles-grid">
                    <div className="other-toggle-item">
                      <label>
                        {L("Icon đơn sắc", "Monochrome Icons")}{' '}<span className="help-q-ico">?</span>
                      </label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={otherSettings.monochromeIcons}
                        className={`guns-switch ${otherSettings.monochromeIcons ? 'on' : ''}`}
                        onClick={() => toggleOther('monochromeIcons')}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>

                    <div className="other-toggle-item">
                      <label>
                        {L("Đảo màu khung", "Swap Box Colors")}{' '}<span className="help-q-ico">?</span>
                      </label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={otherSettings.swapBoxColors}
                        className={`guns-switch ${otherSettings.swapBoxColors ? 'on' : ''}`}
                        onClick={() => toggleOther('swapBoxColors')}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>

                    <div className="other-toggle-item">
                      <label>{L("Nút chỉnh âm lượng", "Volume Control")}</label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={otherSettings.volumeControl}
                        className={`guns-switch ${otherSettings.volumeControl ? 'on' : ''}`}
                        onClick={() => toggleOther('volumeControl')}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>

                    <div className="other-toggle-item">
                      <label>{L("Dùng avatar Discord", "Use Discord Avatar")}</label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={otherSettings.useDiscordAvatar}
                        className={`guns-switch ${otherSettings.useDiscordAvatar ? 'on' : ''}`}
                        onClick={() => toggleOther('useDiscordAvatar')}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>

                    <div className="other-toggle-item">
                      <label>{L("Khung trang trí avatar Discord", "Discord Avatar Decoration")}</label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={otherSettings.discordAvatarDecoration}
                        className={`guns-switch ${otherSettings.discordAvatarDecoration ? 'on' : ''}`}
                        onClick={() => toggleOther('discordAvatarDecoration')}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>

                    <div className="other-toggle-item">
                      <label>{L("Hiển thị liên kết", "Show Links")}</label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={otherSettings.showLinks !== false}
                        className={`guns-switch ${otherSettings.showLinks !== false ? 'on' : ''}`}
                        onClick={() => setOtherSettings((prev) => ({ ...prev, showLinks: prev.showLinks === false }))}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>

                  </div>
                </div>
              </section>

              {/* ================= PREMIUM ================= */}
              <div className="premium-banner" role="separator">
                <span>
                  {L('Muốn có tính năng độc quyền? Mở khóa thêm với', 'Want exclusive features? Unlock more with')}
                </span>
                {isPremium ? (
                  <strong className="premium-banner-link">
                    <DiamondIcon size={16} /> Premium
                  </strong>
                ) : (
                  <button type="button" className="premium-banner-link" onClick={() => navigate('/premium')}>
                    <DiamondIcon size={16} /> Premium
                  </button>
                )}
              </div>

              {/* Khung Lựa chọn bố cục */}
              <section className="guns-section premium-frame">
                  <div className="layout-strip-card">
                    <div className="layout-strip-meta">
                      <div>
                        <strong className="layout-strip-title">{L('Bố cục hồ sơ', 'Profile Layout')}</strong>
                        <span className="layout-strip-sub">
                          {L('Chọn kiểu hiển thị cho trang công khai của bạn', 'Choose how your public profile is presented')}
                        </span>
                      </div>
                    </div>

                    <div className="demo-layout-switcher" role="tablist" aria-label={L('Chuyển bố cục', 'Layout Switcher')}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={formData.layout === 'card' || !formData.layout}
                        className={`layout-switch-btn ${formData.layout === 'card' || !formData.layout ? 'active' : ''}`}
                        onClick={() => handleLayoutSwitch('card')}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="16" rx="2" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{L('Basic', 'Basic')}</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={formData.layout === 'lanyard'}
                        className={`layout-switch-btn ${formData.layout === 'lanyard' ? 'active' : ''}`}
                        onClick={() => handleLayoutSwitch('lanyard')}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v5" />
                          <rect x="5" y="7" width="14" height="15" rx="3" />
                          <circle cx="12" cy="13" r="2.5" />
                        </svg>
                        <span>{L('Thẻ treo', 'Lanyard')}</span>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={formData.layout === 'web'}
                        className={`layout-switch-btn ${formData.layout === 'web' ? 'active' : ''}`}
                        onClick={() => handleLayoutSwitch('web')}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="18" rx="2" />
                          <line x1="2" y1="8" x2="22" y2="8" />
                          <line x1="9" y1="13" x2="19" y2="13" />
                        </svg>
                        <span>{L('Bố cục WEB', 'WEB')}</span>
                      </button>
                    </div>
                  </div>
                </section>

              {/* Khung Hiệu ứng nền video */}
              <section className="guns-section premium-frame">
                <div className="splash-section-head">
                  <h2 className="guns-section-title">
                    {L('Hiệu ứng nền video', 'Video Background Effects')}
                    <DiamondIcon className="pro-diamond" size={16} style={{ marginLeft: 8 }} />
                  </h2>
                </div>
                <div className="guns-panel">
                  <div className="video-fx-layout">
                    <div className="video-fx-left">
                      <label className="bg-modal-label">{L('Link video nền', 'Background video link')}</label>
                      <div className="dark-input-box">
                        <input
                          type="url"
                          name="backgroundVideo"
                          value={formData.backgroundVideo}
                          onChange={handleChange}
                          placeholder={isPremium ? 'https://youtube.com/watch?v=... hoặc https://.../video.mp4' : 'Link YouTube / .mp4 (Premium để lưu)'}
                        />
                      </div>
                      <p className="bg-modal-note video-fx-note">
                        {L('Dán link YouTube hoặc link video trực tiếp (.mp4, .webm) để làm video nền.', 'Paste a YouTube link or a direct video link (.mp4, .webm) as your background video.')}
                      </p>
                    </div>

                    <div className="video-fx-right">
                      <label className="bg-modal-label">{L('Hiệu ứng', 'Effects')}</label>
                      <div className="video-fx-grid" aria-disabled="true">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <span className="video-fx-chip" key={i} />
                        ))}
                      </div>
                      <p className="bg-modal-note video-fx-note">
                        {L('Các hiệu ứng video sẽ được cập nhật sớm.', 'Video effects will be added soon.')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Khung Hiệu ứng chuột */}
              {/* ================= SECTION 3.5: CURSOR EFFECT CUSTOMIZATION (SPLASH CURSOR & BLOB CURSOR) ================= */}
              <section className="guns-section premium-frame">
                <div className="splash-section-head">
                  <h2 className="guns-section-title">
                    {language === 'vi' ? "Hiệu ứng Chuột" : 'Cursor Effects (Splash & Blob Cursor)'}
                    <DiamondIcon className="pro-diamond" size={16} style={{ marginLeft: 8 }} />
                  </h2>

                </div>

                <div className="cursor-fx-layout">
                <div className="cursor-fx-main">
                {CURSOR_FX_IDS.includes(cursorTab) ? (
                <div className="guns-panel">
                  <div className="cursor-panel-topbar">
                    <span className="cursor-panel-subtitle">
                      {cursorTab === 'bubble' && L('Bong bóng bay lên theo chuột', 'Bubbles float up from the cursor')}
                      {cursorTab === 'rainbow' && L('Vệt cầu vồng đuổi theo chuột', 'Rainbow trail following the cursor')}
                      {cursorTab === 'trail3d' && L('Chuỗi con trỏ nối đuôi nhau', 'A chain of cursors trailing behind')}
                      {cursorTab === 'canvas' && L('Dây sáng nhiều màu uốn lượn theo chuột', 'Glowing multicolor ribbons following the cursor')}
                    </span>
                    <div className="splash-master-toggle">
                      <span>{cursorFx.id === cursorTab ? L('Đang bật', 'Enabled') : L('Đang tắt', 'Disabled')}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={cursorFx.id === cursorTab}
                        className={`guns-switch ${cursorFx.id === cursorTab ? 'on' : ''}`}
                        onClick={() => setCursorFx((prev) => ({ ...prev, id: prev.id === cursorTab ? '' : cursorTab }))}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>
                  </div>

                  {(cursorTab === 'rainbow' || cursorTab === 'trail3d') && (
                    <div className="splash-sliders-grid">
                      {(cursorTab === 'rainbow'
                        ? [
                            ['length', L('Độ dài vệt', 'Trail length'), 5, 40, 1],
                            ['size', L('Độ dày', 'Thickness'), 1, 8, 0.5],
                            ['trailSpeed', L('Độ đuổi theo', 'Follow speed'), 0.1, 0.9, 0.05]
                          ]
                        : [
                            ['particles', L('Số lượng', 'Count'), 5, 30, 1],
                            ['rate', L('Độ đuổi theo', 'Follow speed'), 0.1, 0.9, 0.05]
                          ]
                      ).map(([key, label, min, max, step]) => (
                        <div className="custom-dark-field" key={key}>
                          <label>{label}: <strong>{cursorFx[key]}</strong></label>
                          <div className="guns-slider-wrap">
                            <input
                              type="range" min={min} max={max} step={step}
                              value={cursorFx[key]}
                              onChange={(e) => setCursorFx((prev) => ({ ...prev, id: cursorTab, [key]: Number(e.target.value) }))}
                              className="guns-range-slider"
                              style={{ '--val': `${((cursorFx[key] - min) / (max - min)) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                ) : cursorTab === 'splash' ? (
                <div className="guns-panel">
                  <div className="cursor-panel-topbar">
                    <span className="cursor-panel-subtitle">
                      {language === 'vi'
                        ? "Hiệu ứng sóng nước chuyển màu theo chuột"
                        : 'Fluid WebGL2 color wave trail (@react-bits/SplashCursor-JS-CSS)'}
                    </span>
                    <div className="splash-master-toggle">
                      <span>
                        {splashCursor.enabled
                          ? (language === 'vi' ? 'Đang bật Splash' : 'Splash Enabled')
                          : (language === 'vi' ? 'Đang tắt' : 'Disabled')}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={splashCursor.enabled}
                        className={`guns-switch ${splashCursor.enabled ? 'on' : ''}`}
                        onClick={() => setSplashCursor((prev) => ({ ...prev, enabled: !prev.enabled }))}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>
                  </div>

                  {/* Tùy chọn Rainbow / Click Splash */}
                  <div className="splash-top-controls">
                    <div className="splash-quick-switches">
                      <div className="other-toggle-item">
                        <label>{language === 'vi' ? "Chế độ Cầu vồng" : 'Rainbow Spectrum'}</label>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={splashCursor.rainbow}
                          className={`guns-switch ${splashCursor.rainbow ? 'on' : ''}`}
                          onClick={() =>
                            setSplashCursor((prev) => ({ ...prev, enabled: true, rainbow: !prev.rainbow }))
                          }
                        >
                          <span className="switch-knob" />
                        </button>
                      </div>

                      <div className="other-toggle-item">
                        <label>{language === 'vi' ? "Bung sóng khi Click" : 'Click Splash Burst'}</label>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={splashCursor.clickSplash}
                          className={`guns-switch ${splashCursor.clickSplash ? 'on' : ''}`}
                          onClick={() =>
                            setSplashCursor((prev) => ({ ...prev, clickSplash: !prev.clickSplash }))
                          }
                        >
                          <span className="switch-knob" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3 Ô chọn màu chuột tùy chỉnh (hiển thị rõ để người dùng tự phối 3 màu) */}
                  <div className="splash-colors-grid">
                    {[0, 1, 2].map((idx) => {
                      const cVal = (splashCursor.colors && splashCursor.colors[idx]) || '#f65c5c';
                      return (
                        <div className="custom-dark-field" key={idx}>
                          <label>
                            {language === 'vi' ? `Màu hiệu ứng chuột #${idx + 1}` : `Splash Color #${idx + 1}`}
                          </label>
                          <label className={`dark-color-pill ${splashCursor.rainbow ? 'is-dimmed' : ''}`}>
                            <span className="color-dot-preview" style={{ background: cVal }} />
                            <input
                              type="text"
                              value={cVal}
                              onChange={(e) => {
                                const nextColors = [...(splashCursor.colors || ['#f65c5c', '#dc2626', '#a21caf'])];
                                nextColors[idx] = e.target.value;
                                setSplashCursor((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  rainbow: false,
                                  colors: nextColors
                                }));
                              }}
                            />
                            <input
                              type="color"
                              value={cVal}
                              onChange={(e) => {
                                const nextColors = [...(splashCursor.colors || ['#f65c5c', '#dc2626', '#a21caf'])];
                                nextColors[idx] = e.target.value;
                                setSplashCursor((prev) => ({
                                  ...prev,
                                  enabled: true,
                                  rainbow: false,
                                  colors: nextColors
                                }));
                              }}
                              className="hidden-native-color"
                            />
                            <span className="color-pencil-ico">✎</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {/* 6 Thanh trượt tinh chỉnh — thu gọn, bấm mới mở */}
                  <button
                    type="button"
                    className={`cursor-tuning-toggle ${showCursorTuning ? 'open' : ''}`}
                    aria-expanded={showCursorTuning}
                    onClick={() => setShowCursorTuning((v) => !v)}
                  >
                    <span>{language === 'vi' ? 'Tinh chỉnh nâng cao' : 'Advanced tuning'}</span>
                    <span className="cursor-tuning-summary">
                      Size {splashCursor.size} · Swirl {splashCursor.swirl} · Force {splashCursor.force}
                    </span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {showCursorTuning && (
                  <div className="splash-sliders-grid">
                    {/* 1. Size */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Kích thước vệt" : 'Splash Size'}: <strong>{splashCursor.size}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0.2"
                          max="2.5"
                          step="0.1"
                          value={splashCursor.size}
                          onChange={(e) =>
                            setSplashCursor((prev) => ({ ...prev, enabled: true, size: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${((splashCursor.size - 0.2) / 2.3) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Swirl */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Độ xoáy" : 'Vortex Swirl'}: <strong>{splashCursor.swirl}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={splashCursor.swirl}
                          onChange={(e) =>
                            setSplashCursor((prev) => ({ ...prev, enabled: true, swirl: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${(splashCursor.swirl / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. Force */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Lực đẩy" : 'Push Force'}: <strong>{splashCursor.force}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.1"
                          value={splashCursor.force}
                          onChange={(e) =>
                            setSplashCursor((prev) => ({ ...prev, enabled: true, force: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${((splashCursor.force - 0.2) / 2.8) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 4. Trail */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Độ lưu vệt" : 'Trail Length'}: <strong>{splashCursor.trail}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.1"
                          value={splashCursor.trail}
                          onChange={(e) =>
                            setSplashCursor((prev) => ({ ...prev, enabled: true, trail: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${((splashCursor.trail - 0.2) / 2.8) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 5. Intensity */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Cường độ màu" : 'Color Intensity'}: <strong>{splashCursor.intensity}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0.2"
                          max="2.5"
                          step="0.1"
                          value={splashCursor.intensity}
                          onChange={(e) =>
                            setSplashCursor((prev) => ({ ...prev, enabled: true, intensity: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${((splashCursor.intensity - 0.2) / 2.3) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 6. Glow */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Phát sáng" : 'Bloom Glow'}: <strong>{splashCursor.glow}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={splashCursor.glow}
                          onChange={(e) =>
                            setSplashCursor((prev) => ({ ...prev, enabled: true, glow: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${splashCursor.glow * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  )}
                </div>
                ) : (
                <div className="guns-panel">
                  <div className="cursor-panel-topbar">
                    <span className="cursor-panel-subtitle">
                      {language === 'vi'
                        ? "Hiệu ứng giọt chất lỏng 3D Three.js"
                        : '3D Metaball Liquid Blob Cursor (@react-bits/BlobCursor-JS-CSS)'}
                    </span>
                    <div className="splash-master-toggle">
                      <span>
                        {blobCursor.enabled
                          ? (language === 'vi' ? 'Đang bật Blob 3D' : 'Blob 3D Enabled')
                          : (language === 'vi' ? 'Đang tắt' : 'Disabled')}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={blobCursor.enabled}
                        className={`guns-switch ${blobCursor.enabled ? 'on' : ''}`}
                        onClick={() => setBlobCursor((prev) => ({ ...prev, enabled: !prev.enabled }))}
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>
                  </div>

                  {/* Hàng 1: Chất liệu (Material), Màu sắc (Color), Hòa trộn (Blend Mode) */}
                  <div className="splash-colors-grid">
                    {/* 1. Material */}
                    <div className="custom-dark-field">
                      <label>{language === 'vi' ? "Chất liệu 3D" : '3D Material'}</label>
                      <div className="dark-input-box">
                        <select
                          value={blobCursor.material}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, material: e.target.value }))
                          }
                        >
                          <option value="chrome">{L("Chrome — kim loại phản chiếu", "Chrome — reflective metal")}</option>
                          <option value="jelly">{L("Thạch — bóng trong", "Jelly — glossy")}</option>
                          <option value="pearl">{L("Ngọc trai — ngũ sắc", "Pearl — iridescent")}</option>
                          <option value="ink">{L("Mực — phẳng tối giản", "Ink — flat minimal")}</option>
                        </select>
                      </div>
                    </div>

                    {/* 2. Blob Color */}
                    <div className="custom-dark-field">
                      <label>{language === 'vi' ? "Màu giọt 3D" : 'Blob Color'}</label>
                      <label className="dark-color-pill">
                        <span className="color-dot-preview" style={{ background: blobCursor.color || '#3B82F6' }} />
                        <input
                          type="text"
                          value={blobCursor.color || '#3B82F6'}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, color: e.target.value }))
                          }
                        />
                        <input
                          type="color"
                          value={blobCursor.color || '#3B82F6'}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, color: e.target.value }))
                          }
                          className="hidden-native-color"
                        />
                        <span className="color-pencil-ico">✎</span>
                      </label>
                    </div>

                    {/* 3. Blend Mode */}
                    <div className="custom-dark-field">
                      <label>{language === 'vi' ? "Hòa trộn" : 'Blend Mode'}</label>
                      <div className="dark-input-box">
                        <select
                          value={blobCursor.blend}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, blend: e.target.value }))
                          }
                        >
                          <option value="normal">{L("Bình thường", "Normal")}</option>
                          <option value="difference">Difference</option>
                          <option value="exclusion">Exclusion</option>
                          <option value="screen">Screen</option>
                          <option value="overlay">Overlay</option>
                          <option value="multiply">Multiply</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Các công tắc nhanh cho BlobCursor */}
                  <div className="cursor-switch-row">
                      <div className="other-toggle-item">
                        <label>{language === 'vi' ? "Bắn giọt khi Click" : 'Click Splash Drops'}</label>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={blobCursor.splash}
                          className={`guns-switch ${blobCursor.splash ? 'on' : ''}`}
                          onClick={() =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, splash: !prev.splash }))
                          }
                        >
                          <span className="switch-knob" />
                        </button>
                      </div>

                      <div className="other-toggle-item">
                        <label>{language === 'vi' ? "Đổ bóng 3D" : '3D Drop Shadow'}</label>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={blobCursor.shadow}
                          className={`guns-switch ${blobCursor.shadow ? 'on' : ''}`}
                          onClick={() =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, shadow: !prev.shadow }))
                          }
                        >
                          <span className="switch-knob" />
                        </button>
                      </div>

                      <div className="other-toggle-item">
                        <label>{language === 'vi' ? 'Ẩn chuột mặc định' : 'Hide System Cursor'}</label>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={blobCursor.hideCursor}
                          className={`guns-switch ${blobCursor.hideCursor ? 'on' : ''}`}
                          onClick={() =>
                            setBlobCursor((prev) => ({ ...prev, hideCursor: !prev.hideCursor }))
                          }
                        >
                          <span className="switch-knob" />
                        </button>
                      </div>
                  </div>

                  {/* 6 Thanh trượt tinh chỉnh — thu gọn, bấm mới mở */}
                  <button
                    type="button"
                    className={`cursor-tuning-toggle ${showCursorTuning ? 'open' : ''}`}
                    aria-expanded={showCursorTuning}
                    onClick={() => setShowCursorTuning((v) => !v)}
                  >
                    <span>{language === 'vi' ? 'Tinh chỉnh nâng cao' : 'Advanced tuning'}</span>
                    <span className="cursor-tuning-summary">
                      Size {blobCursor.size}px · Trail {blobCursor.trail} · Goo {blobCursor.goo}
                    </span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {showCursorTuning && (
                  <div className="splash-sliders-grid">
                    {/* 1. Size */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Kích thước giọt" : 'Blob Size'}: <strong>{blobCursor.size}px</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="30"
                          max="260"
                          step="5"
                          value={blobCursor.size}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, size: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${((blobCursor.size - 30) / 230) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Trail */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Độ dài đuôi" : 'Trail Segments'}: <strong>{blobCursor.trail}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="16"
                          step="1"
                          value={blobCursor.trail}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, trail: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${(blobCursor.trail / 16) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. Goo */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Độ kết dính" : 'Gooey Blend'}: <strong>{blobCursor.goo}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={blobCursor.goo}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, goo: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${blobCursor.goo * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 4. Stretch */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Độ kéo giãn" : 'Stretch'}: <strong>{blobCursor.stretch}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={blobCursor.stretch}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, stretch: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${blobCursor.stretch * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 5. Wobble */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Độ nảy thạch" : 'Wobble'}: <strong>{blobCursor.wobble}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={blobCursor.wobble}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, wobble: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${blobCursor.wobble * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 6. Shine */}
                    <div className="custom-dark-field">
                      <label>
                        {language === 'vi' ? "Độ bóng bề mặt" : 'Surface Shine'}: <strong>{blobCursor.shine}</strong>
                      </label>
                      <div className="guns-slider-wrap">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={blobCursor.shine}
                          onChange={(e) =>
                            setBlobCursor((prev) => ({ ...prev, enabled: true, shine: Number(e.target.value) }))
                          }
                          className="guns-range-slider"
                          style={{ '--val': `${blobCursor.shine * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  )}
                </div>
                )}
                </div>

                {/* Bảng chọn hiệu ứng (bên phải) — thêm effect mới ở src/constants/cursorEffects.js */}
                <aside className="cursor-fx-picker" aria-label={L('Chọn hiệu ứng chuột', 'Pick cursor effect')}>
                  <div className="cursor-fx-picker-title">{L('Chọn hiệu ứng', 'Effects')}</div>
                  <div className="cursor-fx-list">
                    <button
                      type="button"
                      className={`cursor-fx-item ${!splashCursor.enabled && !blobCursor.enabled && !cursorFx.id ? 'selected' : ''}`}
                      onClick={() => {
                        setCursorFx((prev) => ({ ...prev, id: '' }));
                        setSplashCursor((prev) => ({ ...prev, enabled: false }));
                        setBlobCursor((prev) => ({ ...prev, enabled: false }));
                      }}
                    >
                      <span className="cursor-fx-name">{L('Tắt', 'None')}</span>
                      <span className="cursor-fx-go"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></span>
                    </button>
                    {CURSOR_EFFECTS.map((fx) => {
                      const on = fx.id === 'splash' ? splashCursor.enabled : fx.id === 'blob' ? blobCursor.enabled : cursorFx.id === fx.id;
                      return (
                        <button
                          key={fx.id}
                          type="button"
                          className={`cursor-fx-item ${cursorTab === fx.id ? 'selected' : ''}`}
                          onClick={() => {
                            setCursorTab(fx.id);
                            if (CURSOR_FX_IDS.includes(fx.id)) setCursorFx((prev) => ({ ...prev, id: fx.id }));
                          }}
                        >
                          <span className="cursor-fx-name">{fx.name}{on && <span className="tab-on-dot" />}</span>
                          <span className="cursor-fx-go"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></span>
                        </button>
                      );
                    })}
                  </div>
                </aside>
                </div>
              </section>

              {/* ================= SECTION 5: BỐ CỤC WEB — POSTER ĐỨNG & CHỮ GIỚI THIỆU ================= */}
              {formData.layout === 'web' && (
                <section className="guns-section">
                  <div className="splash-section-head">
                    <h2 className="guns-section-title">
                      {language === 'vi' ? 'Bố cục WEB — Poster Đứng & Giới thiệu' : 'WEB Layout — Vertical Poster & Intro'}
                      <span className="new-pill-badge" style={{ marginLeft: 8 }}>WEB</span>
                    </h2>
                    <button
                      type="button"
                      className={`splash-preset-btn ${formData.layout === 'web' ? 'active' : ''}`}
                      onClick={() => handleLayoutSwitch('web')}
                    >
                      <span>{formData.layout === 'web'
                        ? L('✓ Đang dùng Bố cục WEB', '✓ Using WEB layout')
                        : L('Chọn Bố cục WEB', 'Use WEB layout')}</span>
                    </button>
                  </div>

                  <div className="guns-panel">
                    <div className="web-layout-editor-grid">
                      {/* Cột trái: Upload Poster đứng */}
                      <div className="asset-col web-poster-upload-col">
                        <div className="asset-col-head">
                          <span className="asset-label">
                            {language === 'vi' ? 'Poster đứng (Bên trái khi cuộn xuống)' : 'Vertical Poster (Left)'}
                          </span>
                          {formData.webPosterImage && (
                            <button
                              type="button"
                              className="asset-clear-x"
                              onClick={() => handleRemoveImage('webPosterImage')}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="asset-drop-box web-poster-drop">
                          {uploadingPoster && (
                            <div className="uploading-overlay"><div className="spinner" /></div>
                          )}
                          {formData.webPosterImage ? (
                            <img src={formData.webPosterImage} alt="Poster" className="asset-filled-img" />
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'webPosterImage')}
                                disabled={uploadingPoster}
                                className="asset-file-input"
                              />
                              <svg className="asset-svg-ico asset-svg-2d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="3" width="16" height="18" rx="2.2" />
                                <circle cx="9.5" cy="9" r="1.5" />
                                <path d="M20 15.5l-4.5-4.5-6.5 6.5" />
                              </svg>
                              <span className="asset-hint">
                                {language === 'vi' ? 'Tải lên Poster đứng (Tỉ lệ 2:3)' : 'Upload Vertical Poster'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Cột phải: Tiêu đề & Nội dung chữ giới thiệu bên phải poster */}
                      <div className="web-intro-fields-col">
                        <div className="custom-dark-field">
                          <label>{language === 'vi' ? 'Tiêu đề giới thiệu (Bên phải Poster)' : 'Introduction Heading'}</label>
                          <div className="dark-input-box">
                            <input
                              type="text"
                              name="webIntroTitle"
                              value={formData.webIntroTitle}
                              onChange={handleChange}
                              placeholder={
                                language === 'vi'
                                  ? `Về ${formData.displayName || formData.username || 'tôi'} / About Me`
                                  : 'About Me / My Story'
                              }
                            />
                          </div>
                        </div>

                        <div className="custom-dark-field">
                          <label>
                            {language === 'vi'
                              ? 'Nội dung chữ giới thiệu (Hiển thị bên phải Poster khi cuộn xuống)'
                              : 'Introduction Text (Right side of Poster)'}
                          </label>
                          <textarea
                            name="webIntroText"
                            rows={5}
                            className="web-intro-textarea"
                            value={formData.webIntroText}
                            onChange={handleChange}
                            placeholder={
                              language === 'vi'
                                ? 'Viết lời giới thiệu chi tiết, dự án, kỹ năng hoặc câu chuyện của bạn tại đây...'
                                : 'Write your detailed bio, projects, or introduction here...'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* BÊN PHẢI: KHUNG DEMO PROFILE (Tạm ẩn theo yêu cầu — bật lại bằng SHOW_DEMO_PROFILE) */}
            {SHOW_DEMO_PROFILE && (
            <aside className="editor-right-demo">
              <div className="demo-panel-header">
                {/* Nút chuyển đổi 3 bố cục ở góc trên đầu: Bố cục Basic, Bố cục Thẻ mới, Bố cục WEB */}
                <div className="demo-layout-switcher" role="tablist" aria-label={L("Chuyển bố cục", "Layout Switcher")}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={formData.layout === 'card' || !formData.layout}
                    className={`layout-switch-btn ${formData.layout === 'card' || !formData.layout ? 'active' : ''}`}
                    onClick={() => handleLayoutSwitch('card')}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{language === 'vi' ? 'Bố cục Basic' : 'Basic'}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={formData.layout === 'lanyard'}
                    className={`layout-switch-btn ${formData.layout === 'lanyard' ? 'active' : ''}`}
                    onClick={() => handleLayoutSwitch('lanyard')}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v5" />
                      <rect x="5" y="7" width="14" height="15" rx="3" />
                      <circle cx="12" cy="13" r="2.5" />
                    </svg>
                    <span>{language === 'vi' ? 'Bố cục Thẻ mới' : '3D Card'}</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={formData.layout === 'web'}
                    className={`layout-switch-btn ${formData.layout === 'web' ? 'active' : ''}`}
                    onClick={() => handleLayoutSwitch('web')}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="18" rx="2" />
                      <line x1="2" y1="8" x2="22" y2="8" />
                      <line x1="9" y1="13" x2="19" y2="13" />
                    </svg>
                    <span>{language === 'vi' ? 'Bố cục WEB' : 'WEB Layout'}</span>
                  </button>
                </div>
              </div>

              {/* Sân khấu hiển thị Demo Profile theo thời gian thực */}
              <div
                className="demo-stage-viewport"
                style={{
                  backgroundColor: bgColor || '#000000',
                  '--name-scale': (Number(formData.nameScale) || 100) / 100,
                  '--bio-scale': (Number(formData.bioScale) || 100) / 100,
                  backgroundImage: formData.backgroundImage ? `url(${formData.backgroundImage})` : undefined
                }}
              >
                <div className="demo-stage-overlay" />

                <div className="demo-stage-effects">
                  {renderLiveEffect()}
                  {splashCursor.enabled && (
                    <SplashCursor
                      colors={splashCursor.colors}
                      rainbow={splashCursor.rainbow}
                      size={splashCursor.size}
                      force={splashCursor.force}
                      swirl={splashCursor.swirl}
                      trail={splashCursor.trail}
                      clickSplash={splashCursor.clickSplash}
                      colorSpeed={splashCursor.colorSpeed}
                      intensity={splashCursor.intensity}
                      momentum={splashCursor.momentum}
                      shading={splashCursor.shading}
                      glow={splashCursor.glow}
                      quality={splashCursor.quality || 'high'}
                      intro
                      contained={true}
                    />
                  )}
                  {cursorFx.id && (
                    <CursorFx
                      id={cursorFx.id}
                      contained
                      length={cursorFx.length}
                      size={cursorFx.size}
                      trailSpeed={cursorFx.trailSpeed}
                      particles={cursorFx.particles}
                      rate={cursorFx.rate}
                    />
                  )}
                  {blobCursor.enabled && (
                    <BlobCursor
                      material={blobCursor.material}
                      color={blobCursor.color}
                      blend={blobCursor.blend}
                      size={blobCursor.size}
                      morph={blobCursor.morph}
                      morphSpeed={blobCursor.morphSpeed}
                      depth={blobCursor.depth}
                      trail={blobCursor.trail}
                      lag={blobCursor.lag}
                      goo={blobCursor.goo}
                      stretch={blobCursor.stretch}
                      wobble={blobCursor.wobble}
                      drip={blobCursor.drip}
                      shine={blobCursor.shine}
                      splash={blobCursor.splash}
                      splashCount={blobCursor.splashCount}
                      splashSpeed={blobCursor.splashSpeed}
                      splashSize={blobCursor.splashSize}
                      splashGravity={blobCursor.splashGravity}
                      regrow={blobCursor.regrow}
                      shadow={blobCursor.shadow}
                      hideCursor={blobCursor.hideCursor}
                    />
                  )}
                </div>

                <div className="demo-stage-content" style={{ flexDirection: 'column', gap: 14 }}>
                  {formData.layout === 'web' ? (
                    <div className="demo-web-layout-scroll">
                      {/* Phần 1: Hero giống ảnh MonkeDev (Avatar vuông bo góc bên trái + Tên | Icon Kim cương & Bio bên phải + Đường kẻ ngang phát sáng) */}
                      <div className="demo-web-hero">
                        <div className="demo-web-hero-row">
                          <div className={`demo-web-avatar-box ${otherSettings.avatarBorder ? 'avatar-bordered' : 'avatar-plain'}`}>
                            {formData.avatar ? (
                              <img src={formData.avatar} alt="" className="demo-web-avatar" />
                            ) : (
                              <img src="/logo-konone-v1.png" alt="KonOne" className="demo-web-avatar demo-default-logo" />
                            )}
                            {otherSettings.discordAvatarDecoration && formData.avatarFrame && (
                              <img src={formData.avatarFrame} alt="" className="demo-web-avatar-frame" />
                            )}
                          </div>

                          <div className="demo-web-hero-text">
                            <div className="demo-web-name-line">
                              <h3
                                className="demo-web-name"
                                style={{
                                  color: textColor,
                                  textShadow: glowSettings.username
                                    ? `0 0 14px ${textColor}, 0 0 26px ${textColor}66`
                                    : 'none'
                                }}
                              >
                                {formData.displayName || formData.username || 'MonkeDev'}
                              </h3>
                              <span className="demo-web-cursor-bar">|</span>
                              {demoBadges.length > 0 && (
                                <div className="demo-web-badge-circle" style={{ color: textColor }}>
                                  {demoBadges.map((b) => (
                                    <span
                                      key={b.key}
                                      className="demo-badge-ico"
                                      title={b.label}
                                      style={{
                                        filter: glowSettings.badges
                                          ? `drop-shadow(0 0 6px ${textColor})`
                                          : 'none'
                                      }}
                                    >
                                      {b.icon}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="demo-web-bio-line" style={{ color: textColor }}>
                              <span>{formData.bio || 'Owner @ LA | Over 1M Installs | 32K'}</span>
                              <span className="demo-web-cursor-thin">|</span>
                            </div>

                            {renderDemoSocialsRow('demo-web-socials')}
                          </div>
                        </div>

                        <div className="demo-web-scroll-hint">↓</div>
                      </div>

                      {/* Phần 2: Khi cuộn xuống — Poster đứng bên trái, Chữ giới thiệu bên phải */}
                      <div className="demo-web-showcase">
                        <div className="demo-web-poster-card">
                          {formData.webPosterImage || formData.coverImage || formData.avatar ? (
                            <img
                              src={formData.webPosterImage || formData.coverImage || formData.avatar}
                              alt="Poster"
                              className="demo-web-poster-img"
                            />
                          ) : (
                            <div className="demo-web-poster-placeholder">
                              <span>{L("POSTER ĐỨNG", "VERTICAL POSTER")}</span>
                              <small>2:3</small>
                            </div>
                          )}
                        </div>

                        <div className="demo-web-intro-col" style={{ color: textColor }}>
                          <span className="demo-web-eyebrow" style={{ color: formData.lanyardStrapColor || '#22c55e' }}>
                            {L("GIỚI THIỆU", "INTRODUCTION")}
                          </span>
                          <h4 className="demo-web-intro-title" style={{ color: textColor }}>
                            {formData.webIntroTitle ||
                              L(
                                `Giới thiệu về ${formData.displayName || formData.username || 'tôi'}`,
                                `About ${formData.displayName || formData.username || 'me'}`
                              )}
                          </h4>
                          <p className="demo-web-intro-p" style={{ color: `${textColor}cc` }}>
                            {formData.webIntroText ||
                              formData.bio ||
                              L(
                                'Chào mừng bạn đến với không gian cá nhân của tôi. Cuộn xuống để khám phá các dự án, câu chuyện và liên kết mạng xã hội.',
                                'Welcome to my personal space. Scroll down to explore my projects, stories and social links.'
                              )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : formData.layout === 'lanyard' ? (
                    <>
                      <LanyardCard
                        profile={{
                          ...formData,
                          customLinks,
                          socialPosition,
                          profileOpacity,
                          profileBlur,
                          textColor,
                          avatarFrame: otherSettings.discordAvatarDecoration ? formData.avatarFrame : '',
                          userId: currentUser?.uid,
                          viewCount,
                          textFontFamily
                        }}
                        interactive={true}
                        compact={true}
                        strapColor={formData.lanyardStrapColor || accentColor}
                        cardBgColor={formData.lanyardCardColor || formData.cardColor || '#18161c'}
                        cardOpacity={profileOpacity}
                        cardBlur={profileBlur}
                        badgeLabel={formData.lanyardBadgeLabel || 'KONONE PASS'}
                      />
                      {socialPosition === 'outside' && renderDemoSocialsRow('outside-demo-socials')}
                    </>
                  ) : (
                    <>
                    <div
                      className="demo-basic-card guns-style-demo-card"
                      style={{
                        borderColor:
                          profileOpacity <= 5
                            ? 'transparent'
                            : `${formData.lanyardStrapColor || accentColor}33`,
                        color: textColor,
                        background:
                          profileOpacity <= 2
                            ? 'transparent'
                            : profileGradient
                              ? `linear-gradient(145deg, ${hexToRgba(
                                  formData.gradientFrom || formData.lanyardCardColor || formData.cardColor || '#18161c',
                                  Math.max(0, profileOpacity / 100)
                                )}, ${hexToRgba(
                                  formData.gradientTo || formData.lanyardStrapColor || accentColor,
                                  Math.max(0, (profileOpacity / 100) * 0.65)
                                )})`
                              : hexToRgba(
                                  formData.lanyardCardColor || formData.cardColor || '#18161c',
                                  Math.max(0, profileOpacity / 100)
                                ),
                        backdropFilter:
                          profileBlur > 0 ? `blur(${Math.round((profileBlur / 100) * 40)}px)` : 'none',
                        WebkitBackdropFilter:
                          profileBlur > 0 ? `blur(${Math.round((profileBlur / 100) * 40)}px)` : 'none',
                        boxShadow: profileOpacity <= 5 ? 'none' : undefined
                      }}
                    >
                      <div className="demo-basic-body guns-demo-body">
                        <div className={`demo-basic-avatar-wrap guns-demo-avatar-wrap ${otherSettings.avatarBorder ? 'avatar-bordered' : 'avatar-plain'}`}>
                          {formData.avatar ? (
                            <img src={formData.avatar} alt="" className="demo-basic-avatar" />
                          ) : (
                            <img src="/logo-konone-v1.png" alt="KonOne" className="demo-basic-avatar demo-default-logo" />
                          )}
                          {otherSettings.discordAvatarDecoration && formData.avatarFrame && (
                            <img src={formData.avatarFrame} alt="" className="demo-basic-frame" />
                          )}
                        </div>

                        <h3
                          className="demo-basic-name"
                          style={{
                            color: textColor,
                            fontFamily: textFontFamily || 'inherit',
                            textShadow: glowSettings.username
                              ? `0 0 14px ${textColor}aa, 0 0 26px ${textColor}44`
                              : text3DEffect
                                ? '2px 2px 0 rgba(0,0,0,0.4), 4px 4px 0 rgba(0,0,0,0.2)'
                                : 'none'
                          }}
                        >
                          {formData.displayName || formData.username || 'KonOne'}
                        </h3>

                        {/* Khung Pill chứa Danh hiệu (Icon Kim cương tự hiển thị khi có Premium + Danh hiệu Admin cấp) */}
                        {demoBadges.length > 0 && (
                          <div
                            className="demo-badges-pill"
                            style={{
                              color: textColor,
                              borderColor: `${textColor}1f`
                            }}
                          >
                            {demoBadges.map((b) => (
                              <span
                                key={b.key}
                                className="demo-badge-ico"
                                title={b.label}
                                style={{
                                  filter: glowSettings.badges
                                    ? `drop-shadow(0 0 6px ${textColor})`
                                    : 'none'
                                }}
                              >
                                {b.icon}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="demo-basic-bio" style={{ color: textColor, opacity: 0.88 }}>
                          {formData.bio || 'this is my description'}
                        </p>

                        {formData.location && (
                          <div className="demo-basic-location">
                            <span>📍 {formData.location}</span>
                          </div>
                        )}

                        {hasPresence && (
                          <div className="demo-basic-presence">
                            <span className="demo-presence-dot" />
                            <div className="demo-presence-info">
                              <strong>{formData.presenceTitle || 'Activity'}</strong>
                              {formData.presenceSubtitle && <small>{formData.presenceSubtitle}</small>}
                            </div>
                          </div>
                        )}

                        {socialPosition === 'inside' && renderDemoSocialsRow('inside-demo-socials')}
                      </div>
                    </div>

                    {socialPosition === 'outside' && renderDemoSocialsRow('outside-demo-socials')}

                    {/* Khung Âm Thanh ở dưới nếu thêm âm thanh (giống ảnh mẫu spool) */}
                    {formData.musicUrl && (
                      <div
                        className="demo-audio-player-card"
                        style={{
                          color: textColor,
                          borderColor: `${textColor}18`,
                          ...(formData.musicBoxColor ? { background: musicBoxBg(formData.musicBoxColor) } : {})
                        }}
                      >
                        <img
                          src={
                            demoYoutubeId
                              ? `https://img.youtube.com/vi/${demoYoutubeId}/hqdefault.jpg`
                              : formData.avatar || '/logo-konone-v1.png'
                          }
                          alt=""
                          className="demo-audio-thumb"
                        />
                        <div className="demo-audio-main">
                          <div className="demo-audio-title" style={{ color: textColor }}>
                            {demoAudioTitle || `${formData.displayName || formData.username || 'KONONE'} — AUDIO`}
                          </div>
                          <div className="demo-audio-timeline">
                            <span>0:05</span>
                            <div className="demo-audio-bar">
                              <div className="demo-audio-fill" style={{ background: formData.musicAccentColor || textColor, width: '24%' }} />
                            </div>
                            <span>3:18</span>
                          </div>
                        </div>
                        <div className="demo-audio-ctrls" style={{ color: formData.musicAccentColor || textColor }}>
                          <span>⏮</span>
                          <span>▶</span>
                          <span>⏭</span>
                        </div>
                      </div>
                    )}
                    </>
                  )}
                </div>
              </div>
            </aside>
            )}
          </div>
            </>
          )}

          {/* Thanh báo sau khi lưu — dùng chung cho cả khởi tạo mới & chỉnh sửa */}
          {saveToast && (
            <div className={`save-toast ${saveToast.ok ? 'ok' : 'err'}`} role="status">
              <span className="save-toast-ico">{saveToast.ok ? '✓' : '!'}</span>
              <span className="save-toast-text">{saveToast.text}</span>
              {saveToast.ok && (savedUsername || formData.username) && (
                <a
                  href={`/${savedUsername || formData.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="save-toast-btn"
                >
                  {L('Xem hồ sơ ngay', 'View profile')}
                </a>
              )}
              <button type="button" className="save-toast-close" aria-label={L('Đóng', 'Close')} onClick={() => setSaveToast(null)}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

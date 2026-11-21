import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { notifyError, notifySuccess, confirmDialog } from '../notify/notify';
import { isPremiumActive } from '../constants/premium';
import PublicProfile from './PublicProfile';
import DiamondIcon from './DiamondIcon';
import { withSampleSocials } from '../constants/templates';
import {
  readList, tplKeys, toggleFavoriteId, pushRecentId, applyTemplateToProfile
} from '../utils/applyTemplate';
import './ProfileTemplate.css';
import './TemplateView.css';

const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

/**
 * Trang xem mẫu: hiển thị mẫu như một hồ sơ công khai thật, dùng tên hiển thị của chính người xem.
 * Chưa có tên -> hỏi tên hiển thị + username (chỉ dùng để xem trước, không ghi vào hồ sơ).
 */
export default function TemplateView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const uid = currentUser?.uid || 'guest';
  const keys = tplKeys(uid);

  const [tpl, setTpl] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing
  const [profile, setProfile] = useState(null);
  const [profileDocId, setProfileDocId] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [identity, setIdentity] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(keys.identity) || 'null');
    } catch (e) {
      return null;
    }
  });
  const [askName, setAskName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [userInput, setUserInput] = useState('');
  const [fav, setFav] = useState(() => readList(keys.fav).includes(id));
  const [applying, setApplying] = useState(false);

  // Tải mẫu: mẫu cá nhân nằm trong trình duyệt, mẫu thư viện nằm ở Firestore
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (id.startsWith('mine-')) {
        const found = readList(keys.mine).find((t) => t.id === id);
        if (!cancelled) {
          setTpl(found || null);
          setState(found ? 'ready' : 'missing');
        }
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'templates', id));
        if (cancelled) return;
        if (snap.exists() && snap.data().published !== false) {
          setTpl({ id: snap.id, ...snap.data() });
          setState('ready');
        } else {
          setState('missing');
        }
      } catch (err) {
        console.error('Load template error:', err);
        if (!cancelled) setState('missing');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Hồ sơ của người xem (lấy tên hiển thị, username, avatar, mô tả, liên kết)
  useEffect(() => {
    if (!currentUser) return undefined;
    let cancelled = false;
    getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid)))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.empty) {
          const real = snap.docs.find((d) => !d.data().isStub) || snap.docs[0];
          setProfileDocId(real.id);
          setProfile({ id: real.id, ...real.data() });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const hasRealName = Boolean(profile?.displayName?.trim() && profile?.username?.trim() && !profile?.isStub);

  // Chưa có tên (hồ sơ chưa tạo / chưa có display name) và chưa từng nhập -> hiện popup
  useEffect(() => {
    if (state !== 'ready' || !profileLoaded) return;
    if (!hasRealName && !identity) setAskName(true);
  }, [state, profileLoaded, hasRealName, identity]);

  const sampleBio = L('Mô tả của bạn sẽ hiển thị ở đây', 'Your description will appear here');

  const previewProfile = useMemo(() => {
    if (!tpl) return null;
    const mine = profile && !profile.isStub ? profile : {};
    const nameFromUser = hasRealName ? { displayName: profile.displayName, username: profile.username } : null;
    const who = nameFromUser || identity || { displayName: 'KonOne', username: 'konone' };
    return {
      bio: sampleBio,
      ...mine,
      displayName: who.displayName,
      username: who.username,
      ...(tpl.preset || {}),
      avatar: mine.avatar || (tpl.preset && tpl.preset.avatar) || '',
      isHidden: false,
      isPremium: true,
      premiumExpiresAt: new Date(Date.now() + 86400000),
      ...(tpl.preset && tpl.preset.sampleSocials
        ? { socialLinks: withSampleSocials(mine.socialLinks) }
        : {})
    };
  }, [tpl, profile, hasRealName, identity, sampleBio]);

  function submitIdentity(e) {
    e.preventDefault();
    const displayName = nameInput.trim();
    const username = userInput.trim().toLowerCase().replace(/^@/, '');
    if (!displayName) return;
    if (!USERNAME_RE.test(username)) {
      notifyError(L('Username 3–20 ký tự: chữ thường, số, dấu . hoặc _', 'Username: 3–20 chars, lowercase letters, numbers, . or _'));
      return;
    }
    const value = { displayName, username };
    try {
      localStorage.setItem(keys.identity, JSON.stringify(value));
    } catch (err) {
      /* bỏ qua */
    }
    setIdentity(value);
    setAskName(false);
  }

  async function useTemplate() {
    if (!tpl) return;
    const premium = isPremiumActive(profile);
    const tplName = (tpl.name && (tpl.name[language === 'vi' ? 'vi' : 'en'] || tpl.name.vi || tpl.name.en)) || tpl.id;
    const ok = await confirmDialog({
      title: L('Sử dụng mẫu này?', 'Use this template?'),
      message: L(
        `Thiết kế của hồ sơ sẽ được thay bằng mẫu "${tplName}". Tên, ảnh đại diện, mô tả và liên kết của bạn được giữ nguyên.`,
        `Your profile design will be replaced by "${tplName}". Your name, avatar, bio and links stay the same.`
      ),
      confirmText: L('Sử dụng', 'Use'),
      cancelText: L('Hủy', 'Cancel')
    });
    if (!ok) return;
    if (!profileDocId || profile?.isStub) {
      notifyError(L('Hãy tạo hồ sơ trước khi dùng mẫu.', 'Please create your profile before using a template.'));
      navigate('/edit-profile');
      return;
    }
    if (tpl.premium && !premium) {
      notifyError(L('Mẫu này cần gói Premium.', 'This template requires Premium.'));
      navigate('/premium');
      return;
    }
    setApplying(true);
    try {
      await applyTemplateToProfile(profileDocId, tpl, profile);
      pushRecentId(uid, tpl.id);
      notifySuccess(L('Đã áp dụng mẫu cho hồ sơ của bạn!', 'Template applied to your profile!'));
      navigate('/profile-template');
    } catch (err) {
      console.error('Apply template error:', err);
      notifyError(L('Không thể áp dụng mẫu: ', 'Could not apply template: ') + err.message);
    } finally {
      setApplying(false);
    }
  }

  function toggleFav() {
    setFav(toggleFavoriteId(uid, id).includes(id));
  }

  if (state === 'loading') return <div className="tv-center">{L('Đang tải mẫu...', 'Loading template...')}</div>;
  if (state === 'missing') {
    return (
      <div className="tv-center">
        <p>{L('Không tìm thấy mẫu này (có thể đã bị gỡ).', 'Template not found (it may have been removed).')}</p>
        <button type="button" className="tp-btn primary" onClick={() => navigate('/profile-template')}>{L('Về trang Mẫu', 'Back to Templates')}</button>
      </div>
    );
  }

  const name = (tpl.name && (tpl.name[language === 'vi' ? 'vi' : 'en'] || tpl.name.vi || tpl.name.en)) || tpl.id;

  return (
    <div className="tv-page">
      <PublicProfile previewProfile={previewProfile} applyCursor />

      <div className="tv-bar" role="toolbar">
        <button type="button" className="tv-back" onClick={() => navigate('/profile-template')} aria-label={L('Quay lại', 'Back')}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="tv-title">
          <strong>{name}</strong>
          {tpl.premium && <DiamondIcon className="pro-diamond" size={14} />}
        </div>
        <button type="button" className={`tv-fav${fav ? ' on' : ''}`} aria-pressed={fav} onClick={toggleFav}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>{L('Yêu thích', 'Favorite')}</span>
        </button>
        <button type="button" className="tv-use" disabled={applying} onClick={useTemplate}>
          {applying ? L('Đang áp dụng...', 'Applying...') : L('Sử dụng', 'Use')}
        </button>
      </div>

      {askName && (
        <div className="tp-modal-backdrop tv-modal-top">
          <form className="tp-modal" onSubmit={submitIdentity}>
            <h3>{L('Nhập tên để xem mẫu', 'Enter your name to preview')}</h3>
            <p className="tp-modal-note">
              {L('Bạn chưa có tên hiển thị. Tên này chỉ dùng để xem trước mẫu.', 'You have no display name yet. It is only used to preview this template.')}
            </p>
            <label>
              <span>{L('Tên hiển thị', 'Display name')}</span>
              <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={30} autoFocus />
            </label>
            <label>
              <span>Username</span>
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} maxLength={20} placeholder="konone" />
            </label>
            <div className="tp-modal-foot">
              <button type="button" className="tp-btn" onClick={() => navigate('/profile-template')}>{L('Hủy', 'Cancel')}</button>
              <button type="submit" className="tp-btn primary" disabled={!nameInput.trim() || !userInput.trim()}>{L('Xem mẫu', 'View template')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

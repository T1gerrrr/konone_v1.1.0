import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { notifyError, notifySuccess } from '../notify/notify';
import { isPremiumActive } from '../constants/premium';
import { TEMPLATE_FIELDS } from '../constants/templates';
import AppSidebar from './AppSidebar';
import DiamondIcon from './DiamondIcon';
import PublicProfile from './PublicProfile';
import './ProfileTemplate.css';

const TABS = ['library', 'favorites', 'recent', 'mine'];

function readList(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* bỏ qua nếu trình duyệt chặn lưu trữ */
  }
}

// Bản xem trước thu nhỏ của mẫu
function MiniPreview({ tpl }) {
  const { bg, card, accent, text } = tpl.preview || {};
  return (
    <div className="tp-preview" style={{ background: bg }}>
      <div className="tp-mini-card" style={{ background: card, borderColor: `${accent}55` }}>
        <span className="tp-mini-avatar" style={{ borderColor: accent }} />
        <span className="tp-mini-name" style={{ background: text }} />
        <span className="tp-mini-line" style={{ background: `${text}66` }} />
        <span className="tp-mini-dots">
          {[0, 1, 2].map((i) => (
            <i key={i} style={{ background: accent }} />
          ))}
        </span>
      </div>
    </div>
  );
}

// Xem trước bằng CHÍNH trang hồ sơ thật (PublicProfile), thu nhỏ vừa khung
function RealPreview({ previewProfile }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.4);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const update = () => setScale(el.clientWidth / vw);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vw]);

  return (
    <div className="tp-real" ref={boxRef} style={{ aspectRatio: `${vw} / ${vh}` }}>
      <div className="tp-real-stage" style={{ width: vw, height: vh, transform: `scale(${scale})` }}>
        <PublicProfile previewProfile={previewProfile} />
      </div>
    </div>
  );
}

// Hồ sơ xem trước: nội dung thật của bạn (tên, avatar, mô tả, liên kết) + thiết kế của mẫu
function buildPreviewProfile(tpl, mine, sampleBio) {
  return {
    displayName: 'KonOne',
    username: 'konone',
    bio: sampleBio,
    ...(mine || {}),
    ...(tpl.preset || {}),
    musicUrl: '',
    backgroundVideo: '',
    isHidden: false,
    isPremium: true,
    premiumExpiresAt: new Date(Date.now() + 86400000)
  };
}

// Hình xem trước ngay trên thẻ: vẽ bằng hồ sơ thật khi thẻ nằm trong màn hình, ngoài màn hình thì dùng bản thu nhỏ nhẹ
function TemplateThumb({ tpl, mine, sampleBio }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 720;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: '120px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pv = useMemo(() => (inView ? buildPreviewProfile(tpl, mine, sampleBio) : null), [inView, tpl, mine, sampleBio]);

  return (
    <div className="tp-thumb" ref={ref} style={{ aspectRatio: `${vw} / ${vh}` }}>
      {inView && pv ? <RealPreview previewProfile={pv} /> : <MiniPreview tpl={tpl} />}
    </div>
  );
}

export default function ProfileTemplate() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();
  const uid = currentUser?.uid || 'guest';

  const favKey = `konone.tpl.fav.${uid}`;
  const recentKey = `konone.tpl.recent.${uid}`;
  const mineKey = `konone.tpl.mine.${uid}`;

  const [tab, setTab] = useState('library');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [favorites, setFavorites] = useState(() => readList(favKey));
  const [recent, setRecent] = useState(() => readList(recentKey));
  const [mine, setMine] = useState(() => readList(mineKey));
  const [library, setLibrary] = useState([]); // mẫu do quản trị viên thêm (Firestore `templates`)
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileDocId, setProfileDocId] = useState('');
  const [applyingId, setApplyingId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTags, setNewTags] = useState('');
  const [previewTpl, setPreviewTpl] = useState(null);

  useEffect(() => {
    if (!currentUser) return undefined;
    let cancelled = false;
    getDocs(query(collection(db, 'profiles'), where('userId', '==', currentUser.uid)))
      .then((snap) => {
        if (cancelled || snap.empty) return;
        const real = snap.docs.find((d) => !d.data().isStub) || snap.docs[0];
        setProfileDocId(real.id);
        setProfile({ id: real.id, ...real.data() });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    getDocs(collection(db, 'templates'))
      .then((snap) => {
        if (cancelled) return;
        const rows = snap.docs.map((d) => {
          const data = d.data();
          const created = data.createdAt && typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : 0;
          return { id: d.id, ...data, _created: created };
        });
        rows.sort((a, b) => b._created - a._created);
        setLibrary(rows);
      })
      .catch((err) => {
        console.error('Load templates error:', err);
        if (!cancelled) setLibraryError(err.code || err.message || 'error');
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const premium = isPremiumActive(profile);

  const sampleBio = L('Mô tả của bạn sẽ hiển thị ở đây', 'Your description will appear here');
  const previewProfile = useMemo(
    () => (previewTpl ? buildPreviewProfile(previewTpl, profile, sampleBio) : null),
    [previewTpl, profile, sampleBio]
  );

  const allTemplates = useMemo(() => [...mine, ...library], [mine, library]);

  const visible = useMemo(() => {
    let list;
    if (tab === 'favorites') list = allTemplates.filter((t) => favorites.includes(t.id));
    else if (tab === 'recent') list = recent.map((id) => allTemplates.find((t) => t.id === id)).filter(Boolean);
    else if (tab === 'mine') list = mine;
    else list = library;

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const name = `${(t.name && t.name.vi) || ''} ${(t.name && t.name.en) || ''}`.toLowerCase();
        return name.includes(q) || (t.tags || []).some((g) => g.toLowerCase().includes(q));
      });
    }
    const sorted = [...list];
    const nm = (t) => (t.name && (t.name[language === 'vi' ? 'vi' : 'en'] || t.name.vi || t.name.en)) || '';
    if (sort === 'name') sorted.sort((a, b) => nm(a).localeCompare(nm(b)));
    if (sort === 'free') sorted.sort((a, b) => Number(a.premium) - Number(b.premium));
    return sorted;
  }, [tab, search, sort, allTemplates, favorites, recent, mine, library, language]);

  function toggleFavorite(id) {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      writeList(favKey, next);
      return next;
    });
  }

  async function applyTemplate(tpl) {
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
    setApplyingId(tpl.id);
    try {
      await updateDoc(doc(db, 'profiles', profileDocId), { ...(tpl.preset || {}), updatedAt: new Date() });
      setRecent((prev) => {
        const next = [tpl.id, ...prev.filter((x) => x !== tpl.id)].slice(0, 12);
        writeList(recentKey, next);
        return next;
      });
      notifySuccess(L('Đã áp dụng mẫu cho hồ sơ của bạn!', 'Template applied to your profile!'));
    } catch (err) {
      console.error('Apply template error:', err);
      notifyError(L('Không thể áp dụng mẫu: ', 'Could not apply template: ') + err.message);
    } finally {
      setApplyingId('');
    }
  }

  // Tạo mẫu từ thiết kế hiện tại của hồ sơ (lưu trên trình duyệt này)
  function createTemplate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (!profile) {
      notifyError(L('Hãy tạo hồ sơ trước khi tạo mẫu.', 'Please create your profile before creating a template.'));
      return;
    }
    const preset = {};
    TEMPLATE_FIELDS.forEach((k) => {
      if (profile[k] !== undefined) preset[k] = profile[k];
    });
    const tpl = {
      id: `mine-${Date.now()}`,
      name: { vi: name, en: name },
      author: profile.username ? `@${profile.username}` : L('Bạn', 'You'),
      tags: newTags.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 4),
      premium: ['lanyard', 'web'].includes(preset.layout),
      preview: {
        bg: preset.bgColor || '#0a0a0c',
        card: preset.cardColor || '#18161c',
        accent: preset.lanyardStrapColor || '#ff5757',
        text: preset.textColor || '#ffffff'
      },
      preset
    };
    setMine((prev) => {
      const next = [tpl, ...prev];
      writeList(mineKey, next);
      return next;
    });
    setShowCreate(false);
    setNewName('');
    setNewTags('');
    setTab('mine');
    notifySuccess(L('Đã tạo mẫu từ thiết kế hiện tại!', 'Template created from your current design!'));
  }

  function deleteMine(id) {
    setMine((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeList(mineKey, next);
      return next;
    });
  }

  const tabLabels = {
    library: L('Thư viện mẫu', 'Template Library'),
    favorites: L('Mẫu yêu thích', 'Favorite Templates'),
    recent: L('Mẫu dùng gần đây', 'Last Used Templates'),
    mine: L('Mẫu của tôi', 'My Templates')
  };

  const emptyText = {
    library: libraryLoading
      ? L('Đang tải mẫu...', 'Loading templates...')
      : libraryError
        ? L('Không tải được mẫu (' + libraryError + '). Kiểm tra quy tắc Firestore cho bộ sưu tập templates.', 'Could not load templates (' + libraryError + '). Check the Firestore rules for the templates collection.')
        : search.trim()
        ? L('Không tìm thấy mẫu phù hợp.', 'No templates found.')
        : L('Chưa có mẫu nào trong thư viện.', 'There are no templates in the library yet.'),
    favorites: L('Bạn chưa đánh dấu mẫu yêu thích nào.', 'You have no favorite templates yet.'),
    recent: L('Bạn chưa dùng mẫu nào.', 'You have not used any template yet.'),
    mine: L('Bạn chưa tạo mẫu nào. Bấm "Tạo mẫu" để lưu thiết kế hiện tại.', 'You have no templates yet. Click "Create Template" to save your current design.')
  }[tab];

  return (
    <div className="profile-editor-layout">
      <AppSidebar active="templates" profile={profile || {}} />
      <main className="editor-main">
        <div className="tp-page">
          <nav className="tp-tabs" aria-label={L('Mẫu', 'Templates')}>
            <div className="tp-tabs-left">
              {TABS.map((k) => (
                <button type="button" key={k} className={`tp-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
                  {tabLabels[k]}
                </button>
              ))}
            </div>
            <button type="button" className="tp-create" onClick={() => setShowCreate(true)}>
              <span aria-hidden="true">+</span> {L('Tạo mẫu', 'Create Template')}
            </button>
          </nav>

          <div className="tp-toolbar">
            <label className="tp-search">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L('Tìm mẫu theo tên hoặc thẻ...', 'Search templates by name or tag...')}
              />
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </label>
            <select className="tp-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label={L('Sắp xếp', 'Sort')}>
              <option value="default">{L('Mặc định', 'Default')}</option>
              <option value="name">{L('Tên A–Z', 'Name A–Z')}</option>
              <option value="free">{L('Miễn phí trước', 'Free first')}</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <p className="tp-empty">{emptyText}</p>
          ) : (
            <div className="tp-grid">
              {visible.map((tpl) => {
                const fav = favorites.includes(tpl.id);
                const isMine = tpl.id.startsWith('mine-');
                return (
                  <article className="tp-card" key={tpl.id}>
                    <button
                      type="button"
                      className={`tp-star${fav ? ' on' : ''}`}
                      aria-pressed={fav}
                      aria-label={L('Yêu thích', 'Favorite')}
                      onClick={() => toggleFavorite(tpl.id)}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>

                    <TemplateThumb tpl={tpl} mine={profile} sampleBio={sampleBio} />

                    <div className="tp-body">
                      <h3 className="tp-name">
                        {(tpl.name && (tpl.name[language === 'vi' ? 'vi' : 'en'] || tpl.name.vi || tpl.name.en)) || tpl.id}
                        {tpl.premium && <DiamondIcon className="pro-diamond" size={15} />}
                      </h3>
                      <p className="tp-author">{tpl.author}</p>
                      <div className="tp-tags">
                        {(tpl.tags || []).map((g) => (
                          <span key={g}>{g}</span>
                        ))}
                      </div>
                      <div className="tp-actions">
                        <button type="button" className="tp-use" disabled={applyingId === tpl.id} onClick={() => applyTemplate(tpl)}>
                          {applyingId === tpl.id ? L('Đang áp dụng...', 'Applying...') : L('Dùng mẫu', 'Use Template')}
                        </button>
                        <button type="button" className="tp-eye" onClick={() => setPreviewTpl(tpl)} aria-label={L('Xem trước', 'Preview')} title={L('Xem trước trên hồ sơ của bạn', 'Preview on your profile')}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        {isMine && (
                          <button type="button" className="tp-del" onClick={() => deleteMine(tpl.id)} aria-label={L('Xóa mẫu', 'Delete template')}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {previewTpl && createPortal(
          <div className="tp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setPreviewTpl(null); }}>
            <div className="tp-preview-modal" role="dialog" aria-modal="true">
              <div className="tp-preview-head">
                <strong>
                  {(previewTpl.name && (previewTpl.name[language === 'vi' ? 'vi' : 'en'] || previewTpl.name.vi || previewTpl.name.en)) || previewTpl.id}
                </strong>
                <button type="button" className="tp-preview-x" onClick={() => setPreviewTpl(null)} aria-label={L('Đóng', 'Close')}>✕</button>
              </div>
              <RealPreview previewProfile={previewProfile} />
              <p className="tp-modal-note">
                {L('Đây là hồ sơ thật của bạn khi áp dụng mẫu này.', 'This is your real profile with this template applied.')}
              </p>
              <div className="tp-modal-foot">
                <button type="button" className="tp-btn" onClick={() => setPreviewTpl(null)}>{L('Đóng', 'Close')}</button>
                <button
                  type="button"
                  className="tp-btn primary"
                  disabled={applyingId === previewTpl.id}
                  onClick={async () => {
                    await applyTemplate(previewTpl);
                    setPreviewTpl(null);
                  }}
                >
                  {L('Dùng mẫu', 'Use Template')}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {showCreate && (
          <div className="tp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <form className="tp-modal" onSubmit={createTemplate}>
              <h3>{L('Tạo mẫu từ thiết kế hiện tại', 'Create a template from your current design')}</h3>
              <label>
                <span>{L('Tên mẫu', 'Template name')}</span>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} autoFocus />
              </label>
              <label>
                <span>{L('Thẻ (cách nhau bằng dấu phẩy)', 'Tags (comma separated)')}</span>
                <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="dark, bio" />
              </label>
              <p className="tp-modal-note">
                {L('Mẫu được lưu trên trình duyệt này.', 'The template is saved in this browser.')}
              </p>
              <div className="tp-modal-foot">
                <button type="button" className="tp-btn" onClick={() => setShowCreate(false)}>{L('Hủy', 'Cancel')}</button>
                <button type="submit" className="tp-btn primary" disabled={!newName.trim()}>{L('Tạo mẫu', 'Create')}</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

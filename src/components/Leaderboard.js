import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { isPremiumActive } from '../constants/premium';
import DiamondIcon from './DiamondIcon';
import './Leaderboard.css';

const TOP = 50;
// Lấy rộng hơn để còn đủ 50 sau khi bỏ hồ sơ ẩn / 0 lượt xem, và để tính bảng "Tháng này"
const FETCH = 200;

function monthViews(viewsByDay) {
  if (!viewsByDay || typeof viewsByDay !== 'object') return 0;
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;
  return Object.entries(viewsByDay).reduce((sum, [k, v]) => (k.startsWith(prefix) ? sum + (Number(v) || 0) : sum), 0);
}

export default function Leaderboard() {
  const { language, changeLanguage } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const [period, setPeriod] = useState('all'); // all | month
  const [profiles, setProfiles] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const q = query(collection(db, 'profiles'), orderBy('viewCount', 'desc'), limit(FETCH));
        const snap = await getDocs(q);
        if (cancelled) return;
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => p.username && !p.isHidden)
          .map((p) => ({
            id: p.id,
            username: p.username,
            displayName: p.displayName || p.username,
            avatar: p.avatar || '',
            premium: isPremiumActive(p),
            total: Number(p.viewCount) || 0,
            month: monthViews(p.viewsByDay)
          }));
        setProfiles(list);
        setStatus('ready');
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        if (!cancelled) setStatus('error');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const key = period === 'month' ? 'month' : 'total';
    return profiles
      .filter((p) => p[key] > 0)
      .sort((a, b) => b[key] - a[key])
      .slice(0, TOP)
      .map((p) => ({ ...p, views: p[key] }));
  }, [profiles, period]);

  const fmt = (n) => n.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');

  return (
    <div className="lb-page">
      <header className="lb-topbar">
        <Link to="/" className="lb-brand">
          <img src="/logo-konone-v1.png" alt="KonOne" />
          <span>KonOne</span>
        </Link>
        <div className="lb-topbar-actions">
          <button
            type="button"
            className="lb-lang"
            onClick={() => changeLanguage(language === 'vi' ? 'en' : 'vi')}
          >
            {language === 'vi' ? 'English' : 'Tiếng Việt'}
          </button>
          <Link to="/dashboard" className="lb-top-link">
            {L('Bảng điều khiển', 'Dashboard')}
          </Link>
        </div>
      </header>

      <main className="lb-container">
        <section className="lb-hero">
          <div className="lb-hero-glow" aria-hidden="true" />
          <h1>{L('Bảng xếp hạng lượt xem', 'Views Leaderboard')}</h1>
          <p>
            {period === 'month'
              ? L(`Top ${TOP} hồ sơ có nhiều lượt xem nhất trong tháng này.`, `Top ${TOP} profiles by views this month.`)
              : L(`Top ${TOP} hồ sơ có nhiều lượt xem nhất mọi thời đại.`, `Top ${TOP} profiles by total views of all time.`)}
          </p>
          <div className="lb-tabs" role="tablist">
            {[
              ['all', L('Mọi thời đại', 'All Time')],
              ['month', L('Tháng này', 'This Month')]
            ].map(([id, text]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={period === id}
                className={`lb-tab ${period === id ? 'active' : ''}`}
                onClick={() => setPeriod(id)}
              >
                {text}
              </button>
            ))}
          </div>
        </section>

        <section className="lb-table" aria-live="polite">
          <div className="lb-row lb-head">
            <span className="lb-rank">#</span>
            <span>{L('Hồ sơ', 'Profile')}</span>
            <span className="lb-views">{L('Lượt xem', 'Views')}</span>
          </div>

          {status === 'loading' &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="lb-row lb-skeleton">
                <span className="lb-rank">
                  <i />
                </span>
                <span className="lb-profile">
                  <i className="lb-sk-avatar" />
                  <i className="lb-sk-line" />
                </span>
                <span className="lb-views">
                  <i />
                </span>
              </div>
            ))}

          {status === 'error' && (
            <div className="lb-empty">{L('Không tải được bảng xếp hạng. Vui lòng thử lại sau.', 'Could not load the leaderboard. Please try again later.')}</div>
          )}

          {status === 'ready' && rows.length === 0 && (
            <div className="lb-empty">
              {period === 'month'
                ? L('Tháng này chưa có lượt xem nào được ghi nhận.', 'No views recorded this month yet.')
                : L('Chưa có hồ sơ nào có lượt xem.', 'No profiles with views yet.')}
            </div>
          )}

          {status === 'ready' &&
            rows.map((p, i) => (
              <Link
                key={p.id}
                to={`/${p.username}`}
                className={`lb-row lb-item ${i < 3 ? `lb-top lb-top-${i + 1}` : ''}`}
              >
                <span className="lb-rank">{i + 1}</span>
                <span className="lb-profile">
                  {p.avatar ? (
                    <img src={p.avatar} alt="" className="lb-avatar" loading="lazy" />
                  ) : (
                    <span className="lb-avatar lb-avatar-fallback">{p.displayName.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="lb-names">
                    <span className="lb-name">
                      {p.displayName}
                      {p.premium && (
                        <span className="lb-pro" title="Premium">
                          <DiamondIcon size={12} />
                        </span>
                      )}
                    </span>
                    <span className="lb-handle">@{p.username}</span>
                  </span>
                </span>
                <span className="lb-views">{fmt(p.views)}</span>
              </Link>
            ))}
        </section>
      </main>
    </div>
  );
}

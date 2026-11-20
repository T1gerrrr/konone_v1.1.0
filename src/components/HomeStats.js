import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import AnimatedContent from './AnimatedContent';

// ===== Cấu hình số liệu hiển thị (sửa tại đây) =====
const STATS = {
  visits: 12380, // lượt truy cập
  views: 3032, // xem hồ sơ
  users: 443, // người dùng
  uploads: 6000, // file upload
  signups: 501 // đăng ký
};

// Số đếm tăng dần khi cuộn tới
function CountUp({ value, locale }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      if (reduce) {
        setShown(value);
        return;
      }
      const t0 = performance.now();
      const dur = 1400;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) run();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return <span ref={ref}>{shown.toLocaleString(locale)}</span>;
}

const ICONS = {
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  userplus: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </>
  )
};

function StatCard({ icon, value, label, locale }) {
  return (
    <div className="hs-card">
      <svg className="hs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[icon]}
      </svg>
      <div className="hs-value">
        <CountUp value={value} locale={locale} />+
      </div>
      <div className="hs-label">{label}</div>
    </div>
  );
}

export default function HomeStats() {
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  return (
    <div className="home-stats">
      <AnimatedContent distance={60} duration={0.8} ease="power3.out" threshold={0.1}>
        <h2 className="home-stats-title">
          {L('Hơn ', 'Over ')}
          <span className="home-stats-hl">{STATS.users.toLocaleString(locale)}</span>
          {L(' người dùng KonOne — bạn còn chờ gì nữa?', ' people use KonOne — what are you waiting for?')}
        </h2>
        <p className="home-stats-sub">
          {L(
            'Chúng tôi luôn được tìm thấy đầu tiên trên đa nền tảng, Konone.fun',
            'We are always found first across every platform, Konone.fun'
          )}
        </p>
      </AnimatedContent>

      <AnimatedContent distance={80} duration={0.8} ease="power3.out" stagger={0.1} threshold={0.05} className="home-stats-grid">
        <StatCard icon="globe" value={STATS.visits} label={L('Lượt truy cập', 'Site visits')} locale={locale} />
        <StatCard icon="eye" value={STATS.views} label={L('Xem hồ sơ', 'Profile views')} locale={locale} />
        <StatCard icon="users" value={STATS.users} label={L('Người dùng', 'Users')} locale={locale} />
        <StatCard icon="file" value={STATS.uploads} label={L('File Upload', 'File uploads')} locale={locale} />
        <StatCard icon="userplus" value={STATS.signups} label={L('Đăng ký', 'Sign-ups')} locale={locale} />
      </AnimatedContent>
    </div>
  );
}

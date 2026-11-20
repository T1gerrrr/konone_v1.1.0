import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import { FEATURES } from '../constants/features';
import AnimatedContent from './AnimatedContent';

const Check = () => (
  <svg className="hp-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function HomePricing() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);

  const freeFeatures = [
    L('Tùy chỉnh cơ bản', 'Basic customization'),
    L('Thống kê hồ sơ', 'Profile statistics'),
    L('Hiệu ứng cơ bản', 'Basic effects'),
    L('Thêm mạng xã hội', 'Add social networks')
  ];

  const premiumFeatures = [
    L('Huy hiệu độc quyền', 'Exclusive badge'),
    L('Bố cục hồ sơ', 'Profile layout'),
    L('Phông chữ tùy chỉnh', 'Custom font'),
    L('Hiệu ứng gõ chữ', 'Typewriter effect'),
    L('Hiệu ứng hồ sơ đặc biệt', 'Special profile effect'),
    L('Tùy chỉnh nâng cao', 'Advanced customization'),
    L('Tích hợp nhiều nền tảng', 'Integrate multiple platforms')
  ];

  return (
    <div className="hp">
      <AnimatedContent distance={60} duration={0.8} ease="power3.out" threshold={0.1}>
        <h2 className="hp-title">{L('Chọn gói phù hợp với bạn', 'Choose the plan that fits you')}</h2>
        <p className="hp-sub">
          {L('Bắt đầu miễn phí, nâng cấp Premium khi bạn cần nhiều hơn.', 'Start free, upgrade to Premium when you need more.')}
        </p>
      </AnimatedContent>

      <AnimatedContent distance={80} duration={0.8} ease="power3.out" stagger={0.12} threshold={0.05} className="hp-grid">
        {/* FREE */}
        <div className="hp-card">
          <div className="hp-name">FREE</div>
          <div className="hp-price">
            <span className="hp-amount">{t(language, 'home.freePrice')}</span>
            <span className="hp-period">{t(language, 'home.freePeriod')}</span>
          </div>
          <p className="hp-desc">{t(language, 'home.freeDescription')}</p>
          <ul className="hp-list">
            {freeFeatures.map((f) => (
              <li key={f}><Check />{f}</li>
            ))}
          </ul>
          <Link to={currentUser ? '/dashboard' : '/register'} className="hp-btn hp-btn--ghost">
            {currentUser ? t(language, 'home.goToDashboard') : t(language, 'home.getStarted')}
          </Link>
        </div>

        {/* PREMIUM */}
        <div className="hp-card hp-card--premium">
          <span className="hp-badge">{t(language, 'home.popular')}</span>
          <div className="hp-name">PREMIUM</div>
          <div className="hp-price">
            {FEATURES.showPricing ? (
              <>
                <span className="hp-amount">{t(language, 'home.premiumPrice')}</span>
                <span className="hp-period">{t(language, 'home.premiumPeriod')}</span>
              </>
            ) : (
              <span className="hp-amount hp-soon">{L('Sắp ra mắt', 'Coming soon')}</span>
            )}
          </div>
          <p className="hp-desc">{t(language, 'home.premiumDescription')}</p>
          <ul className="hp-list">
            {premiumFeatures.map((f) => (
              <li key={f}><Check />{f}</li>
            ))}
          </ul>
          <Link to="/premium" className="hp-btn hp-btn--primary">
            {t(language, 'home.learnMore')}
          </Link>
        </div>
      </AnimatedContent>
    </div>
  );
}

import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import PageRays from './PageRays';
import SiteHeader from './SiteHeader';
import ShinyText from './ShinyText';
import HomeStats from './HomeStats';
import HomePricing from './HomePricing';
import HomeFaq from './HomeFaq';
import './Home.css';

const DISCORD_URL = 'https://discord.gg/YVJSEN3s6v';
const EMAIL = 'mailto:konone@gmail.com';

export default function Home() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const inputRef = useRef(null);
  const L = (vi, en) => (language === 'vi' ? vi : en);

  // Nhập tên link mong muốn rồi chuyển sang đăng nhập
  function claimLink(e) {
    e.preventDefault();
    const clean = name.trim().toLowerCase();
    if (!clean) {
      inputRef.current?.focus();
      return;
    }
    navigate('/login', { state: { username: clean } });
  }

  return (
    <div className="home-page">
      <SiteHeader />

      <div className="home-rays" aria-hidden="true">
        <PageRays />
      </div>

      <main className="home-main">
        <div className="home-hero-text">
        <h1 className="home-title">
          <ShinyText
            text="ONE LINK. YOUR WHOLE WORLD"
            color="rgb(255, 255, 255)"
            shineColor="rgba(139, 139, 139, 0.9)"
            speed={2.5}
            shineWidth={40}
            softness={0.8}
            trigger="loop"
            delay={0.5}
            angle={120}
            glow={0.55}
          />
        </h1>
        <p className="home-subtitle">
          {L('KonOne.fun tạo cả thế giới trong profile của bạn — theo cách bạn muốn.', 'KonOne.fun create your whole world into your profile — your way.')}
        </p>

        {currentUser ? (
          <div className="home-actions">
            <Link to="/dashboard" className="home-btn home-btn--primary">
              Dashboard
            </Link>
            <Link to="/premium" className="home-btn home-btn--ghost">
              {L('Xem gói', 'View plans')}
            </Link>
          </div>
        ) : (
          <form className="home-claim" onSubmit={claimLink}>
            <span className="home-claim-prefix">konone.fun/</span>
            <input
              ref={inputRef}
              className="home-claim-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ''))}
              placeholder={L('tên-của-bạn', 'your-name')}
              aria-label={L('Tên link mong muốn', 'Your desired link name')}
              maxLength={30}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="home-claim-go" aria-label={L('Tiếp tục', 'Continue')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
        )}
        </div>

        <div className="home-hero-art" aria-hidden="true">
          <img src="/profile_showcase_bg.png" alt="" draggable={false} />
        </div>
      </main>

      <section className="home-section">
        <HomeStats />
      </section>

      <section className="home-section" id="pricing">
        <HomePricing />
      </section>

      <section className="home-section" id="faq">
        <HomeFaq />
      </section>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-top">
            <div className="home-footer-brand">
              <div className="home-footer-logoRow">
                <img src="/logo-konone-v1.png" alt="KonOne" className="home-footer-logo" />
                <span>KonOne</span>
              </div>
              <p className="home-footer-desc">
                {L('Một đường link cho cả thế giới của bạn.', 'One link for your whole world.')}
              </p>
            </div>

            <nav className="home-footer-col" aria-label="General">
              <h4>{L('Chung', 'General')}</h4>
              <ul>
                <li><Link to="/login">{L('Đăng nhập', 'Login')}</Link></li>
                <li><Link to="/register">{L('Đăng ký', 'Sign Up')}</Link></li>
                <li><Link to="/premium">{L('Bảng giá', 'Pricing')}</Link></li>
              </ul>
            </nav>

            <nav className="home-footer-col" aria-label="Contact">
              <h4>{L('Liên hệ', 'Contact')}</h4>
              <ul>
                <li><a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Discord Server</a></li>
                <li><a href="mailto:support@konone.com">{L('Email hỗ trợ', 'Support Email')}</a></li>
                <li><a href="mailto:business@konone.com">{L('Email hợp tác', 'Business Email')}</a></li>
              </ul>
            </nav>

            <nav className="home-footer-col" aria-label="Legal">
              <h4>{L('Pháp lý', 'Legal')}</h4>
              <ul>
                <li><Link to="/terms">{L('Điều khoản dịch vụ', 'Terms of Service')}</Link></li>
                <li><Link to="/privacy">{L('Chính sách bảo mật', 'Privacy Policy')}</Link></li>
                <li><Link to="/copyright">{L('Chính sách bản quyền', 'Copyright Policy')}</Link></li>
              </ul>
            </nav>
          </div>

          <div className="home-footer-bottom">
            <div className="home-footer-copy">
              © {new Date().getFullYear()} KonOne — {L('Bảo lưu mọi quyền', 'All rights reserved')}
            </div>

            <div className="home-footer-contact">
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="home-footer-icon" title="Discord" aria-label="Discord">
                <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a href={EMAIL} className="home-footer-icon" title="Gmail" aria-label="Gmail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 6L2 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

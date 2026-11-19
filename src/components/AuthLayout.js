import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const DiscordGlyph = ({ size = 28 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#ffffff">
    <path d="M20.32 4.37A19.8 19.8 0 0 0 15.43 2.9a.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.26a18.3 18.3 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.26.08.08 0 0 0-.08-.04A19.74 19.74 0 0 0 3.68 4.37a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.07 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.09-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z" />
  </svg>
);

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Cột trái: Logo, Form và Footer */}
        <div className="auth-left">
          <div className="auth-left-top">
            <Link to="/" className="auth-brand-link" aria-label="KonOne Home">
              <img
                src="/logo-konone-v1.png"
                alt="KonOne Logo"
                className="auth-brand"
              />
            </Link>
          </div>

          <div className="auth-form-wrap">{children}</div>

          <div className="auth-left-footer">
            <Link to="/privacy">Privacy Policy</Link>
            <span>Copyright 2026</span>
          </div>
        </div>

        {/* Cột phải: Top Nav & Phone Showcase với giao diện Profile KonOne */}
        <aside className="auth-right" aria-hidden="false">
          <header className="auth-right-header">
            <nav className="auth-right-nav">
              <Link to="/#pricing" className="auth-nav-item">Pricing</Link>
              <Link to="/community" className="auth-nav-item">
                Community
                <span className="auth-nav-badge">New</span>
              </Link>
              <Link to="/terms" className="auth-nav-item">About</Link>
            </nav>

            <div className="auth-right-actions">
              <Link to="/community" className="auth-search-btn" aria-label="Explore Community">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Link>
              <Link to="/register" className="auth-get-started-btn">
                Get Started
              </Link>
            </div>
          </header>

          <div className="auth-right-stage">
            <div className="phone-scene">
              {/* Ánh sáng đỏ phía sau điện thoại */}
              <div className="phone-glow phone-glow-top" />
              <div className="phone-glow phone-glow-bottom" />

              {/* Khung điện thoại (đã bỏ bàn tay phía sau) */}
              <div className="phone-frame">
                <div className="phone-notch" />
                <div className="phone-screen konone-phone-screen">
                  {/* Card Profile KonOne bên trong màn hình điện thoại giống ảnh mẫu */}
                  <div className="konone-profile-card">
                    {/* Banner cảnh đêm thành phố / bờ biển */}
                    <div className="konone-banner">
                      <div className="konone-banner-lights" />
                    </div>

                    {/* Avatar tròn cam với icon Discord */}
                    <div className="konone-avatar-wrap">
                      <div className="konone-discord-avatar">
                        <DiscordGlyph size={28} />
                      </div>
                    </div>

                    {/* Tên KONONE phát sáng */}
                    <h3 className="konone-username">KONONE</h3>

                    {/* Hàng 4 badge: Kim cương, Cờ lê/Búa, Tick xác thực, Ngọn lửa */}
                    <div className="konone-badges-pill">
                      {/* Diamond */}
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                        <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
                      </svg>
                      {/* Crossed tools */}
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                      </svg>
                      {/* Verified flower/star */}
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                        <path d="M12 2l2.4 2.1 3.1-.4 1.2 2.9 2.9 1.2-.4 3.1L23.3 13l-2.1 2.4.4 3.1-2.9 1.2-1.2 2.9-3.1-.4L12 24.3l-2.4-2.1-3.1.4-1.2-2.9-2.9-1.2.4-3.1L.7 13l2.1-2.4-.4-3.1 2.9-1.2 1.2-2.9 3.1.4L12 2zm-1.1 14.6l6-6-1.4-1.4-4.6 4.6-2.2-2.2-1.4 1.4 3.6 3.6z" />
                      </svg>
                      {/* Flame */}
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                        <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
                      </svg>
                    </div>

                    {/* Bio có dấu nháy gõ chữ */}
                    <p className="konone-bio">
                      guns.lol on top<span className="konone-cursor">|</span>
                    </p>

                    {/* Discord Rich Presence Box */}
                    <div className="konone-rpc-box">
                      <div className="konone-rpc-avatar">
                        <DiscordGlyph size={17} />
                        <span className="konone-rpc-status" />
                      </div>
                      <div className="konone-rpc-info">
                        <div className="konone-rpc-name-row">
                          <strong>popaperc</strong>
                          <span className="konone-rpc-tag red" />
                          <span className="konone-rpc-tag green" />
                        </div>
                        <span className="konone-rpc-line">
                          <b>Playing</b> Visual Studio Code
                        </span>
                        <span className="konone-rpc-line">Editing globals.css</span>
                      </div>
                      <div className="konone-rpc-art">
                        <span>3</span>
                      </div>
                    </div>

                    {/* Hàng 3 icon mạng xã hội phát sáng: Globe, GitHub, Discord */}
                    <div className="konone-socials-row">
                      {/* Globe */}
                      <span className="konone-social-ico">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </span>
                      {/* GitHub */}
                      <span className="konone-social-ico">
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
                        </svg>
                      </span>
                      {/* Discord */}
                      <span className="konone-social-ico">
                        <DiscordGlyph size={18} />
                      </span>
                    </div>

                    {/* Góc trái dưới: Lượt xem 4,814 */}
                    <div className="konone-views">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>4,814</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 1: Phía trên bên phải */}
              <div className="float-card float-card-top">
                <div className="float-profile-head">
                  <div className="float-profile-avatar">
                    <img src="/logo-konone-v1.png" alt="" />
                  </div>
                  <div>
                    <h5>Andrew Johnson</h5>
                    <small>5 Hours Ago</small>
                  </div>
                </div>
                <p className="float-profile-msg">
                  “Hey, can we create a collab on your KonOne profile?”
                </p>
                <div className="float-profile-foot">
                  <span className="float-price">
                    <strong>+4,814</strong> <small>/ Views</small>
                  </span>
                  <div className="float-actions">
                    <span className="float-act-btn">✕</span>
                    <span className="float-act-btn active">♥</span>
                  </div>
                </div>
              </div>

              {/* Floating Card 2: Phía dưới bên trái */}
              <div className="float-card float-card-bottom">
                <div className="float-promo-tag" />
                <h4>40% Off</h4>
                <p className="float-promo-sub">On Premium Plan</p>
                <small className="float-promo-desc">Unlock custom effects &amp; layouts</small>
                <Link to="/register" className="float-promo-btn">
                  Get Pro Now
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

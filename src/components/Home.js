import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';
import './Home.css';

export default function Home() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const statsRef = useRef(null);
  const pricingRef = useRef(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll animation observer
  useEffect(() => {
    let observer;
    const timer = setTimeout(() => {
      const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
      };

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      // Observe all animated elements
      const animatedElements = document.querySelectorAll('.scroll-animate');
      animatedElements.forEach((el) => {
        if (el) {
          observer.observe(el);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observer) {
        const animatedElements = document.querySelectorAll('.scroll-animate');
        animatedElements.forEach((el) => {
          if (el) {
            observer.unobserve(el);
          }
        });
      }
    };
  }, []);

  // Header show/hide on scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Only update and re-render if there's a meaningful change in visibility
          let nextVisible = isHeaderVisible;

          if (currentScrollY < 50) {
            nextVisible = true;
          } else if (currentScrollY > lastScrollY && currentScrollY > 150) {
            nextVisible = false;
          } else if (currentScrollY < lastScrollY) {
            nextVisible = true;
          }

          if (nextVisible !== isHeaderVisible) {
            setIsHeaderVisible(nextVisible);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isHeaderVisible]);

  return (
    <div className="home-page">
      {/* Header */}
      <header className={`home-header ${isHeaderVisible ? 'header-visible' : 'header-hidden'}`}>
        <div className="header-content">
          <div className="logo-section">
            <img
              src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png"
              alt="KonOne Logo"
              className="logo-icon"
            />
            <span className="logo-text">KonOne</span>
          </div>
          <nav className="header-nav">


            <div className="language-selector-header">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="language-select-header"
              >
                <option value="vi">{t(language, 'home.vietnamese')}</option>
                <option value="en">{t(language, 'home.english')}</option>
              </select>
            </div>
            <a
              href="https://discord.gg/YVJSEN3s6v"
              target="_blank"
              rel="noopener noreferrer"
              className="discord-nav-button"
              title="Join our Discord"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Discord</span>
            </a>
            {currentUser ? (
              <>
                <Link to="/dashboard" className="nav-link">{t(language, 'home.dashboard')}</Link>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      navigate('/');
                      window.location.reload();
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="nav-button logout-btn-header"
                >
                  {t(language, 'home.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">{t(language, 'home.login')}</Link>
                <Link to="/register" className="nav-button">{t(language, 'home.register')}</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Side - Text and Buttons */}
          <div className="hero-content">
            <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t(language, 'home.heroTitle') }}></h1>
            <p className="hero-subtitle">
              {t(language, 'home.heroSubtitle')}
            </p>
            <div className="hero-buttons">
              {currentUser ? (
                <>
                  <Link to="/dashboard" className="btn-primary">
                    <div className="button-top">{t(language, 'home.goToDashboard')}</div>
                    <div className="button-bottom" />
                    <div className="button-base" />
                  </Link>
                  <Link to="/community" className="btn-secondary">
                    {t(language, 'home.community')}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn-primary">
                    <div className="button-top">Explore</div>
                    <div className="button-bottom" />
                    <div className="button-base" />
                  </Link>
                  <Link to="/login" className="btn-secondary">
                    How it works?
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Side - Profile Showcase Image */}
          <div className="hero-image-container scroll-animate slide-in-right">
            <img
              src="profile_showcase.png"
              alt="Profile Showcase"
              className="hero-showcase-image"
            />
          </div>
        </div>
      </section>

      {/* Showcase Section */}


      {/* Dashboard Info Section */}
      <section id="features" className="dashboard-info-section" ref={statsRef}>
        <div className="dashboard-info-container">
          <div className="dashboard-info-content">
            {/* Left Side - Dashboard Showcase Image */}
            <div className="dashboard-image-wrapper scroll-animate slide-in-left">
              <img
                src="dashboard_showcase.png"
                alt="Dashboard Showcase"
                className="dashboard-showcase-image"
              />
            </div>

            {/* Right Side - Info Description */}
            <div className="dashboard-info-text scroll-animate slide-in-right">
              <div className="features-label">Dashboard View</div>
              <h2 className="dashboard-info-title">
                Powerful Dashboard<br />to Manage Everything
              </h2>
              <p className="dashboard-info-description">
                Control every aspect of your profile from our intuitive dashboard.
                Monitor your views, customize your layout, and update your information in real-time.
              </p>

              <div className="dashboard-features-list">
                <div className="dashboard-feature-item">
                  {/* <div className="feature-icon-small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div> */}
                  <div className="feature-info">
                    <h4>{t(language, 'home.views')}</h4>
                    <p>Track your profile analytics and engagement.</p>
                  </div>
                </div>

                <div className="dashboard-feature-item">
                  {/* <div className="feature-icon-small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                  </div> */}
                  <div className="feature-info">
                    <h4>Easy Customization</h4>
                    <p>Personalize your page with various layouts and themes.</p>
                  </div>
                </div>
              </div>

              {currentUser ? (
                <Link to="/dashboard" className="btn-primary">
                  <div className="button-top">{t(language, 'home.goToDashboard')}</div>
                  <div className="button-bottom" />
                  <div className="button-base" />
                </Link>
              ) : (
                <Link to="/register" className="btn-primary">
                  <div className="button-top">{t(language, 'home.createNow')}</div>
                  <div className="button-bottom" />
                  <div className="button-base" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section" ref={pricingRef}>
        <div className="pricing-container">
          <h2 className="pricing-title scroll-animate fade-in-up">
            {t(language, 'home.pricingTitle', { name: 'KonOne' })}
          </h2>
          <div className="pricing-cards">
            {/* Free Plan */}
            <div className="pricing-card free-card scroll-animate slide-in-left">
              <div className="pricing-header">
                <h3 className="pricing-name">{t(language, 'home.free')}</h3>
                <div className="pricing-price">
                  <span className="price-amount">{t(language, 'home.freePrice')}</span>
                  <span className="price-period">{t(language, 'home.freePeriod')}</span>
                </div>
                <p className="pricing-description">{t(language, 'home.freeDescription')}</p>
              </div>
              <ul className="pricing-features">
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Basic customization
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Profile statistics
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Basic effects
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Add social networks
                </li>
              </ul>
              {currentUser ? (
                <Link to="/dashboard" className="pricing-button">
                  {t(language, 'home.goToDashboard')}
                </Link>
              ) : (
                <Link to="/register" className="pricing-button">
                  {t(language, 'home.getStarted')}
                </Link>
              )}
            </div>

            {/* Premium Plan */}
            <div className="pricing-card premium-card scroll-animate slide-in-right">
              <div className="popular-badge">{t(language, 'home.popular')}</div>
              <div className="pricing-header">
                <h3 className="pricing-name">
                  <span className="premium-icon"></span> {t(language, 'home.premium')}
                </h3>
                <div className="pricing-price">
                  <span className="price-amount">{t(language, 'home.premiumPrice')}</span>
                  <span className="price-period">{t(language, 'home.premiumPeriod')}</span>
                </div>
                <p className="price-subtitle">{t(language, 'home.premiumSubtitle')}</p>
                <p className="pricing-description">{t(language, 'home.premiumDescription')}</p>
              </div>
              <ul className="pricing-features">
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Exclusive badge
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Profile layout
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Custom font
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Typewriter effect
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Special profile effect
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Advanced customization
                </li>
                <li className="feature-item">
                  <span className="checkmark">✓</span>
                  Integrate multiple platforms
                </li>
              </ul>
              <Link to="/register" className="pricing-button premium-button">
                {t(language, 'home.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          {/* Top Section */}
          <div className="footer-top">
            {/* Left: Branding */}
            <div className="footer-branding">
              <div className="footer-logo-section">
                <img
                  src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png"
                  alt="KonOne Logo"
                  className="footer-logo-icon"
                />
                <div className="footer-logo-text">
                  <span>KonOne</span>

                </div>
              </div>
              <p className="footer-description">
                Create feature-rich, customizable and modern link-in-bio pages with KonOne.
              </p>

            </div>

            {/* Right: Navigation Links */}
            <div className="footer-links">
              {/* General */}
              <div className="footer-column">
                <h4 className="footer-column-title">General</h4>
                <ul className="footer-link-list">
                  <li><Link to="/login">Login</Link></li>
                  <li><Link to="/register">Sign Up</Link></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#features">Reset Password</a></li>
                  <li><a href="#features">Website Status</a></li>
                </ul>
              </div>

              {/* Resources */}
              <div className="footer-column">
                <h4 className="footer-column-title">Resources</h4>
                <ul className="footer-link-list">

                  <li><a href="#features">Changelog</a></li>
                  <li><Link to="/premium">Redeem Code</Link></li>
                  <li><a href="#features">Salad.com Product</a></li>
                </ul>
              </div>

              {/* Contact */}
              <div className="footer-column">
                <h4 className="footer-column-title">Contact</h4>
                <ul className="footer-link-list">
                  <li><a href="#features">Discord Server</a></li>
                  <li><a href="mailto:support@konone.com">Support Email</a></li>
                  <li><a href="mailto:business@konone.com">Business Email</a></li>
                  <li><a href="mailto:legal@konone.com">Legal Email</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="footer-column">
                <h4 className="footer-column-title">Legal</h4>
                <ul className="footer-link-list">
                  <li><a href="#features">Terms of Service</a></li>
                  <li><a href="#features">Privacy Policy</a></li>
                  <li><a href="#features">Copyright Policy</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="footer-bottom">
            <div className="footer-copyright">
              Copyright © {new Date().getFullYear()} KonOne - All Rights Reserved.
            </div>
            <div className="footer-social">
              <a href="#features" className="social-icon-link" title="Discord">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a href="#features" className="social-icon-link" title="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a href="#features" className="social-icon-link" title="X (Twitter)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#features" className="social-icon-link" title="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


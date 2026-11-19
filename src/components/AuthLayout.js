import React, { useState } from 'react';
import './Auth.css';

const SLIDES = [
  {
    title: 'One link for your whole identity.',
    quote: '“Gather your socials, music, projects and more on a single profile page that looks exactly the way you want.”',
    name: 'Profile Builder',
    role: 'Drag, drop and customize every block',
  },
  {
    title: 'Make it yours, in minutes.',
    quote: '“Pick a template, tweak the layout, add effects and your page is live — no code, no hassle.”',
    name: 'Layout Editor',
    role: 'Templates, effects and live preview',
  },
  {
    title: 'Grow with the community.',
    quote: '“Share your profile, get discovered, and see how many people visit your page.”',
    name: 'Community & Insights',
    role: 'Discover creators and track views',
  },
];

export default function AuthLayout({ children }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const prev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setIndex((i) => (i + 1) % SLIDES.length);

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Bên trái: form */}
        <div className="auth-left">
          <img
            src="/logo.png"
            alt="KonOne Logo"
            className="auth-brand"
          />
          <div className="auth-form-wrap">{children}</div>
        </div>

        {/* Bên phải: giới thiệu */}
        <aside className="auth-right" aria-hidden="false">
          <div className="auth-showcase">
            <h2 className="showcase-title" key={`t-${index}`}>{slide.title}</h2>

            <div className="showcase-quote" key={`q-${index}`}>
              <p>{slide.quote.replace(/[“”]/g, '')}</p>
              <strong>{slide.name}</strong>
              <small>{slide.role}</small>
            </div>

            <div className="showcase-nav">
              <button type="button" className="nav-prev" onClick={prev} aria-label="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </button>
              <button type="button" className="nav-next" onClick={next} aria-label="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>

            <img src="/profile_showcase.png" alt="" className="showcase-image" />

          </div>

          <div className="showcase-card">
            <h3>Create your KonOne profile now</h3>
            <p>Be among the first creators to build a beautiful, shareable page in just a few clicks.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

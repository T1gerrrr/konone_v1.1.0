import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { LEGAL, LEGAL_UPDATED, LEGAL_EMAIL } from '../legal/content';
import './LegalPage.css';

const NAV = [
  { key: 'terms', path: '/terms', en: 'Terms of Service', vi: 'Điều khoản dịch vụ' },
  { key: 'privacy', path: '/privacy', en: 'Privacy Policy', vi: 'Chính sách bảo mật' },
  { key: 'copyright', path: '/copyright', en: 'Copyright Policy', vi: 'Chính sách bản quyền' },
];

// Thay {LEGAL_EMAIL} trong văn bản bằng liên kết mailto
function renderText(text) {
  const parts = text.split('{LEGAL_EMAIL}');
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, <a key={i} href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>]
      : [part]
  );
}

export default function LegalPage({ doc }) {
  const { language, changeLanguage } = useLanguage();
  const lang = language === 'en' ? 'en' : 'vi';
  const content = LEGAL[doc][lang];
  const updatedLabel = lang === 'en' ? 'Last updated' : 'Cập nhật lần cuối';
  const updated = new Date(LEGAL_UPDATED).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    document.title = `${content.title} | KonOne`;
    window.scrollTo(0, 0);
  }, [content.title]);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-brand">
          <img src="/logo-konone-v1.png" alt="KonOne Logo" />
          <span>KonOne</span>
        </Link>

        <div className="legal-header-right">
          <nav className="legal-tabs" aria-label="Legal navigation">
            {NAV.map((n) => (
              <Link key={n.key} to={n.path} className={n.key === doc ? 'active' : ''}>
                {n[lang]}
              </Link>
            ))}
          </nav>

          <div className="legal-lang" aria-label="Language switcher">
            <button
              type="button"
              className={lang === 'vi' ? 'active' : ''}
              onClick={() => changeLanguage('vi')}
            >
              VI
            </button>
            <span className="legal-lang-sep">/</span>
            <button
              type="button"
              className={lang === 'en' ? 'active' : ''}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <main className="legal-doc">
        <div className="legal-doc-head">
          <p className="legal-updated">{updatedLabel}: {updated}</p>
          <h1>{content.title}</h1>
          <p className="legal-intro">{content.intro}</p>
        </div>

        <div className="legal-doc-body">
          {content.sections.map((sec) => (
            <section key={sec.h} className="legal-section">
              <h2>{sec.h}</h2>
              {sec.p && sec.p.map((t, i) => <p key={`p${i}`}>{renderText(t)}</p>)}
              {sec.ul && (
                <ul>
                  {sec.ul.map((t, i) => <li key={i}>{renderText(t)}</li>)}
                </ul>
              )}
              {sec.after && sec.after.map((t, i) => <p key={`a${i}`}>{renderText(t)}</p>)}
            </section>
          ))}
        </div>
      </main>

      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} KonOne. All rights reserved.</span>
        <Link to="/">{lang === 'en' ? 'Back to Home' : 'Về trang chủ'}</Link>
      </footer>
    </div>
  );
}

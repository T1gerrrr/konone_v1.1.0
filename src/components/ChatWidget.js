import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { TOPICS, UI, getReply } from '../chat/answers';
import './ChatWidget.css';

// Chỉ hiện trên các trang của KonOne, không hiện trên trang hồ sơ công khai của người dùng (/:username)
const SHOW_ON = [
  '/', '/login', '/register', '/verify-email', '/community',
  '/terms', '/privacy', '/copyright',
  '/dashboard', '/edit-profile', '/premium', '/profile-template',
];

let nextId = 1;

export default function ChatWidget() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'vi';
  const ui = UI[lang];

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { id, from: 'bot'|'user', lines, links }
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);

  // Lời chào ban đầu (đổi theo ngôn ngữ nếu chưa có hội thoại)
  useEffect(() => {
    setMessages((prev) =>
      prev.length === 0 || (prev.length === 1 && prev[0].greeting)
        ? [{ id: nextId++, from: 'bot', greeting: true, lines: [ui.greeting], links: [] }]
        : prev
    );
  }, [ui.greeting]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing, open]);

  if (!SHOW_ON.includes(pathname)) return null;

  async function ask({ topicId, text }) {
    const label = topicId ? TOPICS.find((t) => t.id === topicId).label[lang] : text;
    setMessages((m) => [...m, { id: nextId++, from: 'user', lines: [label], links: [] }]);
    setTyping(true);
    try {
      const [reply] = await Promise.all([
        getReply({ topicId, text, lang }),
        new Promise((r) => setTimeout(r, 500)), // hiệu ứng "đang trả lời"
      ]);
      setMessages((m) => [...m, { id: nextId++, from: 'bot', lines: reply.lines, links: reply.links }]);
    } catch (e) {
      setMessages((m) => [...m, { id: nextId++, from: 'bot', lines: [ui.fallback], links: [] }]);
    }
    setTyping(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    ask({ text });
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel" role="dialog" aria-label={ui.title}>
          <div className="chat-header">
            <img src="/logo-konone-v1.png" alt="" className="chat-header-logo" />
            <div className="chat-header-text">
              <strong>{ui.title}</strong>
              <span>{ui.subtitle}</span>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label={ui.close}>
              ×
            </button>
          </div>

          <div className="chat-body" ref={bodyRef}>
            {messages.map((m) => (
              <div key={m.id} className={`chat-msg ${m.from}`}>
                <div className="chat-bubble">
                  {m.lines.map((line, i) => <p key={i}>{line}</p>)}
                  {m.links.length > 0 && (
                    <div className="chat-links">
                      {m.links.map((l) => (
                        <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label} →</Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="chat-msg bot">
                <div className="chat-bubble chat-typing"><span /><span /><span /></div>
              </div>
            )}
          </div>

          <div className="chat-topics">
            {messages.length > 1 && <div className="chat-topics-label">{ui.others}</div>}
            <div className="chat-chips">
              {TOPICS.map((t) => (
                <button key={t.id} type="button" disabled={typing} onClick={() => ask({ topicId: t.id })}>
                  {t.label[lang]}
                </button>
              ))}
            </div>
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.placeholder}
              maxLength={300}
            />
            <button type="submit" disabled={!input.trim() || typing}>{ui.send}</button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`chat-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? ui.close : ui.open}
        aria-expanded={open}
      >
        {open ? (
          <span className="chat-fab-x">×</span>
        ) : (
          <img src="/logo-konone-v1.png" alt="KonOne" />
        )}
      </button>
    </div>
  );
}

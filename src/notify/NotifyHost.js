import React, { useEffect, useRef, useState } from 'react';
import { subscribe } from './notify';
import { useLanguage } from '../contexts/LanguageContext';
import './Notify.css';

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="7" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="12" y1="7" x2="12.01" y2="7" />
    </svg>
  )
};

export default function NotifyHost() {
  const { language } = useLanguage();
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const confirmBtnRef = useRef(null);

  useEffect(
    () =>
      subscribe((ev) => {
        if (ev.kind === 'toast') {
          setToasts((list) => [...list.slice(-3), ev]);
          setTimeout(() => setToasts((list) => list.filter((t) => t.id !== ev.id)), ev.duration);
        } else if (ev.kind === 'confirm') {
          setDialog(ev);
        }
      }),
    []
  );

  useEffect(() => {
    if (!dialog) return undefined;
    confirmBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  function close(result) {
    if (!dialog) return;
    dialog.resolve(result);
    setDialog(null);
  }

  const vi = language === 'vi';

  return (
    <>
      <div className="nt-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`nt-toast nt-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <span className="nt-ico">{ICONS[t.type] || ICONS.info}</span>
            <span className="nt-msg">{t.message}</span>
            <button
              type="button"
              className="nt-x"
              aria-label={vi ? 'Đóng' : 'Close'}
              onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="nt-backdrop" onMouseDown={() => close(false)}>
          <div
            className="nt-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nt-dialog-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 id="nt-dialog-title">{dialog.title || (vi ? 'Xác nhận' : 'Confirm')}</h3>
            {dialog.message && <p>{dialog.message}</p>}
            <div className="nt-actions">
              <button type="button" className="nt-btn" onClick={() => close(false)}>
                {dialog.cancelText || (vi ? 'Để sau' : 'Not now')}
              </button>
              <button type="button" ref={confirmBtnRef} className="nt-btn nt-btn-primary" onClick={() => close(true)}>
                {dialog.confirmText || (vi ? 'Đồng ý' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Ô nhập mật khẩu có nút con mắt hiện/ẩn
export function PasswordInput({ floatLabel, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} placeholder={floatLabel ? ' ' : props.placeholder} />
      {floatLabel && <label className="float-label" htmlFor={props.id}>{floatLabel}</label>}
      <button
        type="button"
        className="eye-btn"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        tabIndex={-1}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 15.65 5 12c0-3.65 3.36-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

// 2 nút đăng nhập mạng xã hội dạng chữ nhật viền gradient theo thiết kế mẫu
export function SocialButtons({ onSuccess, onError, disabled, mode = 'login' }) {
  const { loginWithProvider } = useAuth();
  const actionLabel = mode === 'register' ? 'Sign Up With' : 'Login With';

  async function handle(name) {
    try {
      const result = await loginWithProvider(name);
      onSuccess(result.user);
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      if (err.code === 'auth/account-exists-with-different-credential') {
        onError('Email này đã đăng ký bằng phương thức khác. Hãy đăng nhập bằng phương thức đó.');
      } else {
        onError('Đăng nhập thất bại: ' + err.message);
      }
    }
  }

  return (
    <div className="social-grid">
      <button
        type="button"
        className="social-rect-btn"
        title="Google"
        aria-label={`${actionLabel} Google`}
        disabled={disabled}
        onClick={() => handle('google')}
      >
        <GoogleIcon />
        <span>{actionLabel} Google</span>
      </button>
      <button
        type="button"
        className="social-rect-btn"
        title="GitHub"
        aria-label={`${actionLabel} GitHub`}
        disabled={disabled}
        onClick={() => handle('github')}
      >
        <GithubIcon />
        <span>{actionLabel} GitHub</span>
      </button>
    </div>
  );
}

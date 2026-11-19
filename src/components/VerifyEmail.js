import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from './AuthLayout';

const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const { currentUser, sendVerificationEmail, verifyOtp, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Register đã tự gửi mã trước khi chuyển trang -> không gửi lại
  const alreadySent = !!(location.state && location.state.otpSent);

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(alreadySent ? RESEND_COOLDOWN : 0);
  const autoSent = useRef(false);

  // Mở trang trực tiếp (ví dụ sau khi login) mà chưa có mã -> tự gửi 1 lần
  useEffect(() => {
    if (!currentUser || currentUser.emailVerified || alreadySent || autoSent.current) return;
    autoSent.current = true;
    handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.emailVerified) return <Navigate to="/dashboard" />;

  async function handleSend() {
    try {
      setError('');
      setInfo('');
      await sendVerificationEmail(currentUser);
      setInfo('Đã gửi mã đến ' + currentUser.email + '. Hãy kiểm tra hộp thư (kể cả Spam).');
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      if (err.code === 'otp/cooldown') {
        setCooldown(err.retryAfter || RESEND_COOLDOWN);
        setInfo('Mã đã được gửi gần đây. Hãy kiểm tra hộp thư (kể cả Spam).');
      } else {
        setError('Không thể gửi mã: ' + err.message);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setInfo('');
      setLoading(true);
      await verifyOtp(currentUser, code);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      if (err.code !== 'otp/wrong-code') setCode('');
    }
    setLoading(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <AuthLayout>
      <div className="auth-header-block">
        <h1 className="auth-title">Verify Your Email</h1>
        <p className="auth-subtitle">One Last Step to Activate Account</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {info && <div className="success-message">{info}</div>}

      <div className="verification-notice">
        <p>Nhập mã 6 số đã gửi đến <strong>{currentUser.email}</strong></p>
        <p className="verification-hint">Mã có hiệu lực 10 phút. Nếu không thấy, hãy kiểm tra <strong>Spam/Junk</strong>.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            placeholder="• • • • • •"
            aria-label="Verification Code"
            className="otp-input"
          />
        </div>
        <button type="submit" disabled={loading || code.length !== 6} className="auth-button">
          {loading ? 'Verifying...' : 'Verify Account'}
        </button>
      </form>

      <div className="verify-actions">
        <button
          type="button"
          className="resend-btn"
          onClick={handleSend}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
        </button>
      </div>

      <p className="auth-link">
        Sai tài khoản?{' '}
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          Đăng xuất
        </a>
      </p>
    </AuthLayout>
  );
}

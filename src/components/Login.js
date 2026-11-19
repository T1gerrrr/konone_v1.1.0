import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { PasswordInput, SocialButtons } from './AuthWidgets';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  function goAfterLogin(user) {
    // Chưa xác thực email -> giữ đăng nhập và chuyển sang trang nhập mã OTP
    navigate(user.emailVerified ? '/dashboard' : '/verify-email');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setInfo('');
      setLoading(true);
      const userCredential = await login(email, password, remember);
      goAfterLogin(userCredential.user);
      return;
    } catch (err) {
      setError('Login failed: ' + err.message);
    }

    setLoading(false);
  }

  async function handleForgot() {
    if (!email) {
      setInfo('');
      return setError('Nhập email của bạn ở trên, rồi bấm "Forgot Password?" lần nữa.');
    }
    try {
      setError('');
      await resetPassword(email);
      setInfo('Đã gửi email đặt lại mật khẩu đến ' + email + '. Hãy kiểm tra hộp thư (kể cả Spam).');
    } catch (err) {
      setInfo('');
      setError('Không thể gửi email: ' + err.message);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-header-block">
        <h1 className="auth-title">Login to Your Account</h1>
        <p className="auth-subtitle">Your Own Digital Profile</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {info && <div className="success-message">{info}</div>}

      <SocialButtons
        mode="login"
        onSuccess={goAfterLogin}
        onError={setError}
        disabled={loading}
      />

      <div className="auth-divider">
        <span>OR</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email Address"
            aria-label="Email Address"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
          />
        </div>

        <div className="auth-options">
          <label className="remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="remember-circle" />
            <span>Remember Me</span>
          </label>
          <button type="button" className="link-btn" onClick={handleForgot}>
            Forgot Password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Logging in...' : 'Login to Your Account'}
        </button>
      </form>

      <p className="auth-link">
        Not a member yet? <Link to="/register">Register Now</Link>
      </p>
    </AuthLayout>
  );
}

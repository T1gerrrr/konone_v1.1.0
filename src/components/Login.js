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
      return setError('Nhập email của bạn ở trên, rồi bấm "Forgot Password" lần nữa.');
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
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-subtitle">Please enter your account details</p>

      {error && <div className="error-message">{error}</div>}
      {info && <div className="success-message">{info}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        <div className="auth-options">
          <label className="remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Keep me logged in
          </label>
          <button type="button" className="link-btn" onClick={handleForgot}>
            Forgot Password
          </button>
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Logging in...' : 'Sign in'}
        </button>
      </form>

      <SocialButtons onSuccess={goAfterLogin} onError={setError} disabled={loading} />

      <p className="auth-link">
        You don't have an account? <Link to="/register">Register!</Link>
      </p>
    </AuthLayout>
  );
}

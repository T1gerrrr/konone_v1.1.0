import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { PasswordInput, SocialButtons } from './AuthWidgets';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Mật khẩu không khớp');
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await signup(email, password);

      // Gửi mã OTP; nếu lỗi vẫn sang trang xác thực để người dùng bấm "Gửi lại mã"
      let otpSent = true;
      try {
        await sendVerificationEmail(userCredential.user);
      } catch (otpError) {
        console.error('Error sending OTP:', otpError);
        otpSent = false;
      }

      navigate('/verify-email', { state: { otpSent } });
    } catch (err) {
      setError('Đăng ký thất bại: ' + err.message);
    }

    setLoading(false);
  }

  function handleSocial(user) {
    navigate(user.emailVerified ? '/dashboard' : '/verify-email');
  }

  return (
    <AuthLayout>
      <div className="auth-header-block">
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-subtitle">Start Building Your Digital Profile</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <SocialButtons
        mode="register"
        onSuccess={handleSocial}
        onError={setError}
        disabled={loading}
      />

      <div className="auth-divider">
        <span>OR</span>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            id="reg-email"
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
            id="reg-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            aria-label="Password"
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <PasswordInput
            id="reg-confirm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-button">
          {loading ? 'Creating Account...' : 'Create Your Account'}
        </button>
      </form>

      <p className="auth-link">
        Already a member? <Link to="/login">Login Now</Link>
      </p>
    </AuthLayout>
  );
}

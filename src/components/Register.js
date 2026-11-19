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
      <h1 className="auth-title">Create account</h1>
      <p className="auth-subtitle">Start building your KonOne profile</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-password">Password</label>
          <PasswordInput
            id="reg-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="reg-confirm">Confirm Password</label>
          <PasswordInput
            id="reg-confirm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Enter your password again"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-button" style={{ marginTop: 10 }}>
          {loading ? 'Registering...' : 'Sign up'}
        </button>
      </form>

      <SocialButtons onSuccess={handleSocial} onError={setError} disabled={loading} />

      <p className="auth-link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
}

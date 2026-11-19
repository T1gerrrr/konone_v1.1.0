import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

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

  return (
    <div className="auth-container">
      <img src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png" alt="KonOne Logo" className="auth-logo" />
      <div className="auth-card">
        <h2>REGISTER</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password (minimum 6 characters)"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Enter your password again"
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

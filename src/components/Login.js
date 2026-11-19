import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      const userCredential = await login(email, password);

      // Chưa xác thực email -> giữ đăng nhập và chuyển sang trang nhập mã OTP
      if (!userCredential.user.emailVerified) {
        navigate('/verify-email');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError('Login failed: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="auth-container">
      <img src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png" alt="KonOne Logo" className="auth-logo" />
      <div className="auth-card">
        <h2>LOGIN</h2>
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
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
         You don't have an account? <Link to="/register">Register!</Link>
        </p>
      </div>
    </div>
  );
}

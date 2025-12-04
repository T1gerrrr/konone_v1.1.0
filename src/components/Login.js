import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [resendLoading, setResendLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [searchParams] = useSearchParams();

  // Kiểm tra nếu bị redirect từ PrivateRoute do chưa verify
  useEffect(() => {
    if (searchParams.get('unverified') === 'true') {
      setNeedsVerification(true);
      setError('Email not verified. Please check your email and click the verification link before logging in.');
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setNeedsVerification(false);
      setLoading(true);
      
      // Import auth để lấy currentUser sau khi login
      const { auth } = await import('../firebase');
      
      await login(email, password);
      
      // Kiểm tra email đã được xác thực chưa
      await new Promise(resolve => setTimeout(resolve, 500)); // Đợi auth state update
      
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        setUnverifiedUser(auth.currentUser);
        setNeedsVerification(true);
        setError('Email not verified. Please check your email and click the verification link before logging in.');
        // Đăng xuất để không cho vào dashboard
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
        setLoading(false);
        return;
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed: ' + err.message);
    }

    setLoading(false);
  }

  async function handleResendVerification() {
    if (!unverifiedUser) return;
    
    try {
      setResendLoading(true);
      setError('');
      await sendVerificationEmail(unverifiedUser, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
      setError('Email verification has been sent again! Please check your email (Spam folder).');
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError('You have sent too many emails. Please wait 10-15 minutes and try again.');
      } else {
        setError('Cannot send email: ' + err.message);
      }
    }
    setResendLoading(false);
  }

  return (
    <div className="auth-container">
      <img src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png" alt="KonOne Logo" className="auth-logo" />
      <div className="auth-card">
        <h2>LOGIN</h2>
        {error && (
          <div className={error.includes('✅') ? 'success-message' : 'error-message'}>
            {error}
          </div>
        )}
        {needsVerification && (
          <div className="verification-notice">
            <p><strong>Email not verified</strong></p>
            <p>You can check your email <strong>{email}</strong> and click the verification link.</p>
            <p className="verification-hint"> Check your <strong>Spam/Junk(Trash)</strong></p>
            <button 
              type="button"
              onClick={handleResendVerification}
              className="resend-btn"
              disabled={resendLoading}
            >
              {resendLoading ? 'sending...' : 'Send verification email again'}
            </button>
          </div>
        )}
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


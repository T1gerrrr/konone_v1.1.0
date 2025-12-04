import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [successWithTooltip, setSuccessWithTooltip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signup, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Mật khẩu không khớp');
    }

      try {
      setError('');
      setSuccess('');
      setSuccessWithTooltip(false);
      setLoading(true);
      const userCredential = await signup(email, password);
      
      // Gửi email xác thực
      try {
        console.log('Sending verification email to:', userCredential.user.email);
        console.log('User UID:', userCredential.user.uid);
        console.log('Email verified status:', userCredential.user.emailVerified);
        
        const emailResult = await sendVerificationEmail(userCredential.user, {
          url: window.location.origin + '/dashboard',
          handleCodeInApp: false
        });
        
        console.log('Verification email sent successfully');
        console.log('Email result:', emailResult);
        setEmailSent(true);
        setSuccess('Register success! Verification email has been sent to ' + email + '. Please check your email (including ');
        setSuccessWithTooltip(true);
      } catch (emailError) {
        console.error('❌ Error sending verification email:', emailError);
        console.error('Error code:', emailError.code);
        console.error('Error message:', emailError.message);
        console.error('Full error:', JSON.stringify(emailError, null, 2));
        
        // Xử lý lỗi too-many-requests
        if (emailError.code === 'auth/too-many-requests') {
          setEmailSent(false);
          setSuccessWithTooltip(false);
          setError('Đã gửi quá nhiều email trong thời gian ngắn. Vui lòng đợi 1-2 giờ rồi thử lại từ Dashboard. Hoặc kiểm tra email đã gửi trước đó trong hộp thư.');
          setSuccess('Đăng ký thành công! Bạn có thể đăng nhập và gửi lại email xác thực sau 1-2 giờ.');
        } else {
          // Vẫn cho phép đăng ký thành công nhưng báo lỗi email
          setEmailSent(false);
          setSuccessWithTooltip(false);
          setError('⚠️ Không thể gửi email xác thực: ' + emailError.message + ' (Code: ' + emailError.code + '). Bạn có thể gửi lại sau.');
          setSuccess('Đăng ký thành công! Nhưng email xác thực chưa được gửi. Bạn có thể gửi lại từ Dashboard.');
        }
      }
      
      // Chờ 2 giây rồi chuyển đến dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Đăng ký thất bại: ' + err.message);
    }

    setLoading(false);
  }

  async function handleResendEmail() {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      // Lấy user hiện tại từ auth
      const { auth } = await import('../firebase');
      if (auth.currentUser) {
        console.log('Resending verification email to:', auth.currentUser.email);
        await sendVerificationEmail(auth.currentUser, {
          url: window.location.origin + '/dashboard',
          handleCodeInApp: false
        });
        console.log('Verification email resent successfully');
        setSuccess('Đã gửi lại email xác thực đến ' + auth.currentUser.email + '! Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).');
      } else {
        setError('Không tìm thấy tài khoản. Vui lòng đăng ký lại.');
      }
    } catch (err) {
      console.error('Error resending email:', err);
      setError('Không thể gửi email: ' + err.message + ' (Code: ' + err.code + ')');
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <img src="https://raw.githubusercontent.com/T1gerrrr/konone/refs/heads/main/logo.png" alt="KonOne Logo" className="auth-logo" />
      <div className="auth-card">
        <h2>REGISTER</h2>
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            {successWithTooltip ? (
              <>
                {success}
                <strong className="spam-tooltip-trigger">Spam/Junk(Trash)</strong>
                . Email may take 1-5 minutes to arrive.
              </>
            ) : (
              success
            )}
          </div>
        )}
        {emailSent && (
          <div className="verification-notice">
            <p>Email verification has been sent to <strong>{email}</strong></p>
            <p>Please check your email and click the verification link to verify your account.</p>
            <button 
              type="button" 
              onClick={handleResendEmail}
              className="resend-btn"
              disabled={loading}
            >
              Resend email
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


import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { PasswordInput, SocialButtons } from './AuthWidgets';
import FluidSlideCommit from './FluidSlideCommit';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const userRef = useRef(null);

  function goAfterLogin(user) {
    // Chưa xác thực email -> giữ đăng nhập và chuyển sang trang nhập mã OTP
    navigate(user.emailVerified ? '/dashboard' : '/verify-email');
  }

  // Đăng nhập; ném lỗi nếu thất bại để thanh trượt báo lỗi
  async function doLogin() {
    if (formRef.current && !formRef.current.reportValidity()) throw new Error('invalid');
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const userCredential = await login(email, password, remember);
      userRef.current = userCredential.user;
    } catch (err) {
      setError(L('Đăng nhập thất bại: ', 'Login failed: ') + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Nhấn Enter trong form
  function handleSubmit(e) {
    e.preventDefault();
    doLogin()
      .then(() => goAfterLogin(userRef.current))
      .catch(() => {});
  }

  async function handleForgot() {
    if (!email) {
      setInfo('');
      return setError(
        L(
          'Nhập email của bạn ở trên, rồi bấm "Quên mật khẩu?" lần nữa.',
          'Enter your email above, then click "Forgot Password?" again.'
        )
      );
    }
    try {
      setError('');
      await resetPassword(email);
      setInfo(
        L(
          `Đã gửi email đặt lại mật khẩu đến ${email}. Hãy kiểm tra hộp thư (kể cả Spam).`,
          `A password reset email was sent to ${email}. Check your inbox (and Spam).`
        )
      );
    } catch (err) {
      setInfo('');
      setError(L('Không thể gửi email: ', 'Could not send email: ') + err.message);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-header-block">
        <h1 className="auth-title">{L('Đăng nhập tài khoản', 'Login to Your Account')}</h1>
        <p className="auth-subtitle">{L('Hồ sơ số của riêng bạn', 'Your Own Digital Profile')}</p>
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
        <span>{L('HOẶC', 'OR')}</span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={L('Địa chỉ email', 'Email Address')}
            aria-label={L('Địa chỉ email', 'Email Address')}
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={L('Mật khẩu', 'Password')}
            aria-label={L('Mật khẩu', 'Password')}
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
            <span>{L('Ghi nhớ đăng nhập', 'Remember Me')}</span>
          </label>
          <button type="button" className="link-btn" onClick={handleForgot}>
            {L('Quên mật khẩu?', 'Forgot Password?')}
          </button>
        </div>

        {/* Nút ẩn để nhấn Enter vẫn gửi form */}
        <button type="submit" className="visually-hidden-submit" tabIndex={-1} aria-hidden="true" />

        {/* Trượt để đăng nhập (ReactBits SlideCommit) */}
        <FluidSlideCommit
          label={L('Trượt để đăng nhập', 'Slide to log in')}
          doneLabel={L('Đã đăng nhập', 'Logged in')}
          errorLabel={L('Đăng nhập thất bại', 'Login failed')}
          onConfirm={doLogin}
          onDone={() => setTimeout(() => goAfterLogin(userRef.current), 600)}
          trackColor="rgba(255, 255, 255, 0.06)"
          handleColor="#f65c5c"
          successColor="#22c55e"
          dangerColor="#e5484d"
          height={50}
          radius={12}
          holdMs={0}
          className="auth-slide"
        />
      </form>

      <p className="auth-link">
        {L('Chưa có tài khoản?', 'Not a member yet?')} <Link to="/register">{L('Đăng ký ngay', 'Register Now')}</Link>
      </p>
    </AuthLayout>
  );
}

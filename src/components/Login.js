import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout, { useAuthExit } from './AuthLayout';
import { PasswordInput, SocialButtons } from './AuthWidgets';
import FluidSlideCommit from './FluidSlideCommit';

// Thông báo nhỏ gắn vào góc trên của ô nhập
function FieldNotice({ notice, field }) {
  if (!notice || notice.field !== field) return null;
  return (
    <div className={`field-notice field-notice--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'} key={notice.id}>
      <span className="field-notice-dot" aria-hidden="true" />
      {notice.text}
    </div>
  );
}

let noticeSeq = 0;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();
  const show = (field, type, text) => setNotice({ field, type, text, id: ++noticeSeq });
  const clearOn = (field) => setNotice((n) => (n && n.field === field ? null : n));

  // Rút gọn lỗi Firebase thành câu ngắn
  function shortAuthError(err) {
    const code = (err && err.code) || '';
    if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) {
      return L('Email hoặc mật khẩu không đúng', 'Incorrect email or password');
    }
    if (/invalid-email/.test(code)) return L('Email không hợp lệ', 'Invalid email');
    if (/too-many-requests/.test(code)) return L('Thử quá nhiều lần, hãy đợi một lúc', 'Too many attempts, try later');
    if (/network/.test(code)) return L('Lỗi mạng, thử lại', 'Network error, try again');
    return (err && err.message ? err.message : L('Đã có lỗi xảy ra', 'Something went wrong')).replace(/^Firebase:s*/, '');
  }
  const formRef = useRef(null);
  const userRef = useRef(null);

  const playExit = useAuthExit();

  // Thành công: gom UI vào logo, phóng logo, rồi mới chuyển trang
  function finishLogin(user) {
    playExit(() => goAfterLogin(user));
  }

  function goAfterLogin(user) {
    // Chưa xác thực email -> giữ đăng nhập và chuyển sang trang nhập mã OTP
    navigate(user.emailVerified ? '/dashboard' : '/verify-email');
  }

  // Đăng nhập; ném lỗi nếu thất bại để thanh trượt báo lỗi
  async function doLogin() {
    if (!email.trim()) {
      show('email', 'error', L('Vui lòng nhập email', 'Please enter your email'));
      throw new Error('invalid');
    }
    if (!password) {
      show('password', 'error', L('Vui lòng nhập mật khẩu', 'Please enter your password'));
      throw new Error('invalid');
    }
    setNotice(null);
    setLoading(true);
    try {
      const userCredential = await login(email, password, remember);
      userRef.current = userCredential.user;
    } catch (err) {
      show('password', 'error', shortAuthError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Nhấn Enter trong form
  function handleSubmit(e) {
    e.preventDefault();
    doLogin()
      .then(() => finishLogin(userRef.current))
      .catch(() => {});
  }

  async function handleForgot() {
    if (!email.trim()) {
      return show('email', 'error', L('Nhập email rồi bấm "Quên mật khẩu?"', 'Enter your email, then click "Forgot Password?"'));
    }
    try {
      setNotice(null);
      await resetPassword(email);
      show('email', 'success', L('Đã gửi email đặt lại mật khẩu', 'Password reset email sent'));
    } catch (err) {
      show('email', 'error', shortAuthError(err));
    }
  }

  return (
    <AuthLayout>
      <div className="auth-header-block">
        <h1 className="auth-title">{L('Đăng nhập tài khoản', 'Login to Your Account')}</h1>
        <p className="auth-subtitle">{L('Hồ sơ số của riêng bạn', 'Your Own Digital Profile')}</p>
      </div>

      <SocialButtons
        mode="login"
        onSuccess={finishLogin}
        onError={(msg) => show('email', 'error', msg)}
        disabled={loading}
      />

      <div className="auth-divider">
        <span>{L('HOẶC', 'OR')}</span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <FieldNotice notice={notice} field="email" />
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearOn('email'); }}
            required
            placeholder=" "
            aria-label={L('Địa chỉ email', 'Email Address')}
            autoComplete="email"
          />
          <label className="float-label" htmlFor="login-email">{L('Địa chỉ email', 'Email Address')}</label>
        </div>
        <div className="form-group">
          <FieldNotice notice={notice} field="password" />
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearOn('password'); }}
            required
            floatLabel={L('Mật khẩu', 'Password')}
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
          onDone={() => setTimeout(() => finishLogin(userRef.current), 350)}
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

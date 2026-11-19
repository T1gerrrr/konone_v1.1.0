import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { PasswordInput, SocialButtons } from './AuthWidgets';
import FluidSlideCommit from './FluidSlideCommit';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, sendVerificationEmail } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const otpSentRef = useRef(true);

  // Đăng ký; ném lỗi nếu thất bại để thanh trượt báo lỗi
  async function doRegister() {
    if (formRef.current && !formRef.current.reportValidity()) throw new Error('invalid');
    if (password !== confirmPassword) {
      setError(L('Mật khẩu không khớp', 'Passwords do not match'));
      throw new Error('mismatch');
    }
    setError('');
    setLoading(true);
    try {
      const userCredential = await signup(email, password);
      // Gửi mã OTP; nếu lỗi vẫn sang trang xác thực để người dùng bấm "Gửi lại mã"
      otpSentRef.current = true;
      try {
        await sendVerificationEmail(userCredential.user);
      } catch (otpError) {
        console.error('Error sending OTP:', otpError);
        otpSentRef.current = false;
      }
    } catch (err) {
      setError(L('Đăng ký thất bại: ', 'Registration failed: ') + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function goVerify() {
    navigate('/verify-email', { state: { otpSent: otpSentRef.current } });
  }

  // Nhấn Enter trong form
  function handleSubmit(e) {
    e.preventDefault();
    doRegister().then(goVerify).catch(() => {});
  }

  function handleSocial(user) {
    navigate(user.emailVerified ? '/dashboard' : '/verify-email');
  }

  return (
    <AuthLayout>
      <div className="auth-header-block">
        <h1 className="auth-title">{L('Tạo tài khoản', 'Create Your Account')}</h1>
        <p className="auth-subtitle">{L('Bắt đầu xây dựng hồ sơ số của bạn', 'Start Building Your Digital Profile')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <SocialButtons
        mode="register"
        onSuccess={handleSocial}
        onError={setError}
        disabled={loading}
      />

      <div className="auth-divider">
        <span>{L('HOẶC', 'OR')}</span>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            id="reg-email"
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
            id="reg-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={L('Mật khẩu (tối thiểu 6 ký tự)', 'Password (min 6 characters)')}
            aria-label={L('Mật khẩu', 'Password')}
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <PasswordInput
            id="reg-confirm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={L('Nhập lại mật khẩu', 'Confirm Password')}
            aria-label={L('Nhập lại mật khẩu', 'Confirm Password')}
            autoComplete="new-password"
          />
        </div>

        {/* Nút ẩn để nhấn Enter vẫn gửi form */}
        <button type="submit" className="visually-hidden-submit" tabIndex={-1} aria-hidden="true" />

        {/* Trượt để đăng ký (ReactBits SlideCommit) */}
        <FluidSlideCommit
          label={L('Trượt để tạo tài khoản', 'Slide to sign up')}
          doneLabel={L('Đã tạo tài khoản', 'Account created')}
          errorLabel={L('Đăng ký thất bại', 'Sign up failed')}
          onConfirm={doRegister}
          onDone={() => setTimeout(goVerify, 600)}
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
        {L('Đã có tài khoản?', 'Already a member?')} <Link to="/login">{L('Đăng nhập ngay', 'Login Now')}</Link>
      </p>
    </AuthLayout>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { notifyError, notifySuccess } from '../notify/notify';
import FluidSlideCommit from './FluidSlideCommit';
import './AccountSettings.css';

const CONFIRM_TEXT = 'XOA TAI KHOAN';

// Tài khoản & quyền riêng tư: tải bản sao dữ liệu, xóa tài khoản vĩnh viễn.
// Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (quyền được biết, truy cập, xóa dữ liệu).
export default function AccountSettings({ profile }) {
  const { currentUser, signInMethod, reauthenticate, deleteAccount } = useAuth();
  const { language } = useLanguage();
  const L = (vi, en) => (language === 'vi' ? vi : en);
  const navigate = useNavigate();

  const method = signInMethod ? signInMethod(currentUser) : 'password';
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [typed, setTyped] = useState('');
  const [understood, setUnderstood] = useState(false);

  const ready = verified && understood && typed.trim().toUpperCase() === CONFIRM_TEXT;

  // Quyền truy cập dữ liệu: tải bản sao dữ liệu cá nhân dạng JSON
  function downloadMyData() {
    const toPlain = (v) => {
      if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
      if (Array.isArray(v)) return v.map(toPlain);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toPlain(x)]));
      return v;
    };
    const data = {
      exportedAt: new Date().toISOString(),
      account: {
        uid: currentUser?.uid,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified,
        createdAt: currentUser?.metadata?.creationTime,
        lastSignIn: currentUser?.metadata?.lastSignInTime,
        providers: (currentUser?.providerData || []).map((p) => p.providerId)
      },
      profile: profile ? toPlain(profile) : null
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `konone-du-lieu-${profile?.username || 'tai-khoan'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    notifySuccess(L('Đã tải bản sao dữ liệu của bạn.', 'Your data copy has been downloaded.'));
  }

  async function handleVerify(e) {
    e?.preventDefault?.();
    setVerifying(true);
    try {
      await reauthenticate(password);
      setVerified(true);
      setPassword('');
      notifySuccess(L('Đã xác thực lại. Bạn có 10 phút để hoàn tất.', 'Re-authenticated. You have 10 minutes to finish.'));
    } catch (err) {
      const wrong = /wrong-password|invalid-credential|invalid-login/.test(err.code || '');
      notifyError(
        wrong
          ? L('Mật khẩu không đúng.', 'Incorrect password.')
          : L('Không xác thực được: ', 'Could not re-authenticate: ') + (err.message || '')
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteAccount(CONFIRM_TEXT);
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setVerified(false);
        notifyError(L('Phiên xác thực đã hết hạn. Vui lòng xác thực lại.', 'Your re-authentication expired. Please verify again.'));
      } else {
        notifyError(err.message || L('Không xóa được tài khoản.', 'Could not delete the account.'));
      }
      throw err;
    }
  }

  return (
    <section className="acc">
      {/* Thông tin & quyền dữ liệu */}
      <div className="acc-card">
        <h3>{L('Dữ liệu của bạn', 'Your data')}</h3>
        <p className="acc-muted">
          {L(
            'Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, bạn có quyền được biết, truy cập, chỉnh sửa và yêu cầu xóa dữ liệu cá nhân của mình.',
            'Under Vietnam’s Decree 13/2023/ND-CP on personal data protection, you can know, access, correct and request deletion of your personal data.'
          )}
        </p>
        <div className="acc-actions">
          <button type="button" className="acc-btn" onClick={downloadMyData}>
            {L('Tải bản sao dữ liệu (JSON)', 'Download my data (JSON)')}
          </button>
          <Link to="/privacy" className="acc-link">
            {L('Xem Chính sách bảo mật', 'Read the Privacy Policy')}
          </Link>
        </div>
      </div>

      {/* Khu vực nguy hiểm: xóa tài khoản */}
      <div className="acc-card acc-danger">
        <h3>{L('Xóa tài khoản', 'Delete account')}</h3>
        <p className="acc-muted">
          {L(
            'Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu cá nhân. Thao tác này không thể hoàn tác.',
            'Permanently delete your account and all personal data. This cannot be undone.'
          )}
        </p>

        {!open ? (
          <button type="button" className="acc-btn acc-btn-danger" onClick={() => setOpen(true)}>
            {L('Tôi muốn xóa tài khoản', 'I want to delete my account')}
          </button>
        ) : (
          <div className="acc-flow">
            <div className="acc-list">
              <strong>{L('Sẽ bị xóa ngay:', 'Deleted immediately:')}</strong>
              <ul>
                <li>{L('Tài khoản đăng nhập', 'Your login account')} ({currentUser?.email})</li>
                <li>{L('Hồ sơ công khai', 'Your public profile')}{profile?.username ? ` konone.fun/${profile.username}` : ''}</li>
                <li>{L('Liên kết, cài đặt giao diện, nhạc, thống kê lượt xem', 'Links, appearance settings, music, view stats')}</li>
                <li>{L('Gói Premium còn lại (không hoàn tiền phần chưa dùng)', 'Remaining Premium time (unused time is not refunded)')}</li>
              </ul>
              <p className="acc-muted small">
                {L(
                  'Chúng tôi chỉ giữ một bản ghi tối thiểu (mã băm, thời điểm xóa, không chứa dữ liệu cá nhân) để chứng minh yêu cầu đã được thực hiện. Tên người dùng của bạn sẽ được giải phóng cho người khác dùng.',
                  'We keep only a minimal record (a hash and the deletion time, no personal data) to prove the request was fulfilled. Your username becomes available to others.'
                )}
              </p>
            </div>

            {/* Bước 1: xác thực lại */}
            <div className={`acc-step ${verified ? 'done' : ''}`}>
              <span className="acc-step-no">1</span>
              <div className="acc-step-body">
                <strong>{L('Xác thực lại', 'Verify it’s you')}</strong>
                {verified ? (
                  <span className="acc-ok">✓ {L('Đã xác thực', 'Verified')}</span>
                ) : method === 'password' ? (
                  <form className="acc-inline" onSubmit={handleVerify}>
                    <input
                      id="acc-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={L('Mật khẩu hiện tại', 'Current password')}
                      autoComplete="current-password"
                      required
                    />
                    <button type="submit" className="acc-btn" disabled={verifying || !password}>
                      {verifying ? L('Đang xác thực...', 'Verifying...') : L('Xác thực', 'Verify')}
                    </button>
                  </form>
                ) : (
                  <button type="button" className="acc-btn" onClick={handleVerify} disabled={verifying}>
                    {verifying
                      ? L('Đang xác thực...', 'Verifying...')
                      : L(`Xác thực bằng ${method === 'github' ? 'GitHub' : 'Google'}`, `Verify with ${method === 'github' ? 'GitHub' : 'Google'}`)}
                  </button>
                )}
              </div>
            </div>

            {/* Bước 2: gõ xác nhận */}
            <div className={`acc-step ${typed.trim().toUpperCase() === CONFIRM_TEXT ? 'done' : ''}`}>
              <span className="acc-step-no">2</span>
              <div className="acc-step-body">
                <label htmlFor="acc-confirm">
                  {L('Gõ', 'Type')} <code>{CONFIRM_TEXT}</code> {L('để xác nhận', 'to confirm')}
                </label>
                <input
                  id="acc-confirm"
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Bước 3: cam kết hiểu hậu quả */}
            <div className={`acc-step ${understood ? 'done' : ''}`}>
              <span className="acc-step-no">3</span>
              <label className="acc-step-body acc-check" htmlFor="acc-understood">
                <input
                  id="acc-understood"
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                />
                <span>
                  {L(
                    'Tôi hiểu rằng tài khoản và dữ liệu sẽ bị xóa vĩnh viễn, không thể khôi phục.',
                    'I understand my account and data will be permanently deleted and cannot be recovered.'
                  )}
                </span>
              </label>
            </div>

            <FluidSlideCommit
              label={ready ? L('Trượt để xóa vĩnh viễn', 'Slide to delete forever') : L('Hoàn thành 3 bước ở trên', 'Complete the 3 steps above')}
              doneLabel={L('Đã xóa tài khoản', 'Account deleted')}
              errorLabel={L('Chưa xóa được', 'Not deleted')}
              onConfirm={handleDelete}
              onDone={() => {
                notifySuccess(L('Tài khoản của bạn đã được xóa vĩnh viễn.', 'Your account has been permanently deleted.'));
                setTimeout(() => navigate('/'), 900);
              }}
              trackColor="rgba(229, 72, 77, 0.08)"
              handleColor="#e5484d"
              successColor="#22c55e"
              dangerColor="#e5484d"
              height={50}
              radius={12}
              holdMs={0}
              disabled={!ready}
            />

            <button
              type="button"
              className="acc-cancel"
              onClick={() => {
                setOpen(false);
                setTyped('');
                setUnderstood(false);
              }}
            >
              {L('Hủy, giữ lại tài khoản', 'Cancel, keep my account')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // remember = false: chỉ giữ đăng nhập trong phiên trình duyệt hiện tại
  async function login(email, password, remember = true) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Đăng nhập bằng Google / GitHub (popup)
  function loginWithProvider(name) {
    const provider = name === 'github' ? new GithubAuthProvider() : new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  async function callApi(user, path, body) {
    const idToken = await user.getIdToken();
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'Yêu cầu thất bại');
      err.code = data.code || `http/${res.status}`;
      err.retryAfter = data.retryAfter;
      throw err;
    }
    return data;
  }

  // Gửi mã OTP 6 số qua Gmail SMTP (api/send-otp.js)
  function sendVerificationEmail(user) {
    return callApi(user, '/api/send-otp');
  }

  // Xác thực mã OTP (api/verify-otp.js), sau đó làm mới trạng thái emailVerified của user
  async function verifyOtp(user, code) {
    await callApi(user, '/api/verify-otp', { code });
    await user.reload();
    await user.getIdToken(true);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Cách đăng nhập của tài khoản hiện tại: 'password' | 'google' | 'github'
  function signInMethod(user = auth.currentUser) {
    const ids = (user?.providerData || []).map((p) => p.providerId);
    if (ids.includes('password')) return 'password';
    if (ids.includes('github.com')) return 'github';
    return 'google';
  }

  // Xác thực lại (bắt buộc trước thao tác nhạy cảm như xóa tài khoản)
  async function reauthenticate(password) {
    const user = auth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập');
    const method = signInMethod(user);
    if (method === 'password') {
      const credential = EmailAuthProvider.credential(user.email, password || '');
      await reauthenticateWithCredential(user, credential);
    } else {
      const provider = method === 'github' ? new GithubAuthProvider() : new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    }
    await user.getIdToken(true);
  }

  // Xóa vĩnh viễn tài khoản + dữ liệu (api/delete-account.js), rồi đăng xuất
  async function deleteAccount(confirmText) {
    const user = auth.currentUser;
    if (!user) throw new Error('Chưa đăng nhập');
    const result = await callApi(user, '/api/delete-account', { confirm: confirmText });
    await signOut(auth).catch(() => {});
    return result;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithProvider,
    logout,
    sendVerificationEmail,
    verifyOtp,
    resetPassword,
    signInMethod,
    reauthenticate,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


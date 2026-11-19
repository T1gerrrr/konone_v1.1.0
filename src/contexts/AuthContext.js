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
  sendPasswordResetEmail
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
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


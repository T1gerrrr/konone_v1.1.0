import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
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

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
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


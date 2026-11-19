import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  // Kiểm tra đã đăng nhập
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Kiểm tra email đã được xác thực chưa
  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" />;
  }

  return children;
}


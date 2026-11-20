import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FEATURES } from './constants/features';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import { AuthShell } from './components/AuthLayout';
import VerifyEmail from './components/VerifyEmail';
import LegalPage from './components/LegalPage';
import ChatWidget from './components/ChatWidget';
import ClickSpark from './components/ClickSpark';
import NotifyHost from './notify/NotifyHost';
import Dashboard from './components/Dashboard';
import ProfileEditor from './components/ProfileEditor';
import PublicProfile from './components/PublicProfile';
import Premium from './components/Premium';
import Invite from './components/Invite';
import Admin from './components/Admin';
import RouteTracker from './components/RouteTracker';
import Community from './components/Community';
import ProfileTemplate from './components/ProfileTemplate';
import LinksPage from './components/LinksPage';
import Leaderboard from './components/Leaderboard';
import './App.css';

// Trang chủ không hiển thị boxchat
function HideOnHome({ children }) {
  const { pathname } = useLocation();
  return pathname === '/' ? null : children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <ClickSpark
            sparkColor="#fff"
            shape="line"
            sparkCount={8}
            sparkSize={14}
            sparkRadius={30}
            duration={500}
            style={{ height: 'auto', minHeight: '100vh' }}
          >
          <div className="App">
            <RouteTracker />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route element={<AuthShell />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/terms" element={<LegalPage doc="terms" />} />
              <Route path="/privacy" element={<LegalPage doc="privacy" />} />
              <Route path="/copyright" element={<LegalPage doc="copyright" />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/edit-profile"
                element={
                  <PrivateRoute>
                    <ProfileEditor />
                  </PrivateRoute>
                }
              />
              <Route
                path="/links"
                element={
                  <PrivateRoute>
                    <LinksPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <Admin />
                  </PrivateRoute>
                }
              />
              <Route
                path="/invite"
                element={
                  <PrivateRoute>
                    <Invite />
                  </PrivateRoute>
                }
              />
              <Route
                path="/premium"
                element={
                  <PrivateRoute>
                    <Premium />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile-template"
                element={
                  FEATURES.profileTemplate ? (
                    <PrivateRoute>
                      <ProfileTemplate />
                    </PrivateRoute>
                  ) : (
                    // Trang Mẫu đang tạm ẩn -> chuyển về Bảng điều khiển
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              {/* Trang Bố cục cũ đã được thay bằng trang Mẫu */}
              <Route path="/edit-layout" element={<Navigate to="/profile-template" replace />} />
              <Route path="/:username" element={<PublicProfile />} />
            </Routes>
            <HideOnHome><ChatWidget /></HideOnHome>
            <NotifyHost />
          </div>
          </ClickSpark>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

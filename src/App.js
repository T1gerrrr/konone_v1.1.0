import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FEATURES } from './constants/features';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import LegalPage from './components/LegalPage';
import ChatWidget from './components/ChatWidget';
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
import LayoutEditor from './components/LayoutEditor';
import LinksPage from './components/LinksPage';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <div className="App">
            <RouteTracker />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
              <Route
                path="/edit-layout"
                element={
                  <PrivateRoute>
                    <LayoutEditor />
                  </PrivateRoute>
                }
              />
              <Route path="/:username" element={<PublicProfile />} />
            </Routes>
            <ChatWidget />
            <NotifyHost />
          </div>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

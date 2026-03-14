import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProfileEditor from './components/ProfileEditor';
import PublicProfile from './components/PublicProfile';
import Premium from './components/Premium';
import Community from './components/Community';
import ProfileTemplate from './components/ProfileTemplate';
import LayoutEditor from './components/LayoutEditor';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/community" element={<Community />} />
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
                  <PrivateRoute>
                    <ProfileTemplate />
                  </PrivateRoute>
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
          </div>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import LocalReminderChecker from './components/LocalReminderChecker/LocalReminderChecker';
import InstallPrompt from './components/InstallPrompt/InstallPrompt';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Todos from './pages/Todos/Todos';
import Profile from './pages/Profile/Profile';

function AppContent() {
  const { user } = useAuth();
  
  return (
    <>
      <LocalReminderChecker userId={user?.id} enabled={!!user} />
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/todos" element={<Todos />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/todos" replace />} />
          <Route path="*" element={<Navigate to="/todos" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

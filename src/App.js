import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Todos from './pages/Todos/Todos';
import Profile from './pages/Profile/Profile';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
}

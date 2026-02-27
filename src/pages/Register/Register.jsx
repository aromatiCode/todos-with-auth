import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Register.module.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await register(username, email, password);

      if (result.success) {
        if (result.requiresConfirmation) {
          // Email confirmation required
          setSuccess(result.message || 'Account created! Please check your email to confirm your account.');
          // Clear form
          setUsername('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        } else {
          // Auto-confirmed (or email confirmation disabled)
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => {
            navigate('/todos', { replace: true });
          }, 500);
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logo}>✦</div>
        </div>

        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join TodoApp and start organizing</p>

        {success && (
          <div className={styles.success}>
            <span>✓</span> {success}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              autoComplete="username"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

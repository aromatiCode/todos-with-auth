import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>✦</span>
        <span className={styles.brandName}>TodoApp</span>
      </div>

      <div className={styles.right}>
        <button
          className={styles.themeBtn}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user && (
          <>
            <Link to="/profile" className={styles.userBadge}>
              <span className={styles.userAvatar}>
                {user.username.charAt(0).toUpperCase()}
              </span>
              <span className={styles.username}>{user.username}</span>
            </Link>
            <button className={styles.logoutBtn} onClick={logout}>
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

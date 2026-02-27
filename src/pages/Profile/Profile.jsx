import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, updateProfile, updatePassword, verifyCurrentPassword, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || '');
  const [email] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleUpdate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await updateProfile(username);

      if (result.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(result.error || 'Failed to update profile.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setError('');
    setDeleteLoading(true);

    try {
      const result = await deleteAccount();

      if (result.success) {
        navigate('/login', { replace: true });
      } else {
        setError(result.error || 'Failed to delete account.');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Delete account error:', err);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (!newPassword) {
      setPasswordError('New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      // First verify the current password
      const verifyResult = await verifyCurrentPassword(currentPassword);
      
      if (!verifyResult.success) {
        setPasswordError(verifyResult.error || 'Current password is incorrect.');
        setPasswordLoading(false);
        return;
      }

      // If current password is verified, update to new password
      const result = await updatePassword(newPassword);

      if (result.success) {
        setPasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.error || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordError('An unexpected error occurred. Please try again.');
      console.error('Update password error:', err);
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.backSection}>
          <Link to="/todos" className={styles.backLink}>
            ← Back to Todos
          </Link>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.subtitle}>Manage your account settings</p>
        </div>

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

        <form onSubmit={handleUpdate} className={styles.form}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <p className={styles.avatarHint}>Your avatar is generated from your username</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${styles.inputDisabled}`}
              value={email}
              disabled
              readOnly
            />
            <span className={styles.hint}>Email cannot be changed</span>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className={styles.passwordSection}>
          <h2 className={styles.passwordTitle}>Change Password</h2>
          <p className={styles.passwordText}>
            Update your password to keep your account secure.
          </p>

          {passwordSuccess && (
            <div className={styles.success}>
              <span>✓</span> {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className={styles.error}>
              <span>⚠️</span> {passwordError}
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className={styles.passwordForm}>
            <div className={styles.field}>
              <label htmlFor="currentPassword" className={styles.label}>Current Password</label>
              <input
                id="currentPassword"
                type="password"
                className={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="newPassword" className={styles.label}>New Password</label>
              <input
                id="newPassword"
                type="password"
                className={styles.input}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
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
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>

            <button type="submit" className={styles.passwordBtn} disabled={passwordLoading}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className={styles.dangerZone}>
          <h2 className={styles.dangerTitle}>Danger Zone</h2>
          <p className={styles.dangerText}>
            Once you delete your account, there is no going back. Please be certain.
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          ) : (
            <div className={styles.confirmDelete}>
              <p className={styles.confirmText}>
                Are you sure? This will permanently delete your account and all your todos.
              </p>
              <div className={styles.confirmButtons}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmDeleteBtn}
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

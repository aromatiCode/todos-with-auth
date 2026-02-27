import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, EDGE_FUNCTION_URL } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || session.user.email.split('@')[0]
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email.split('@')[0]
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Register a new user.
   * @returns {{ success: boolean, error?: string }}
   */
  async function register(username, email, password) {
    try {
      if (!username.trim() || !email.trim() || !password) {
        return { success: false, error: 'All fields are required.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: username.trim()
          }
        }
      });

      if (error) {
        // Provide more helpful error messages for common issues
        const errorMsg = error.message || '';
        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
          return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection and ensure your Supabase project is not paused.' };
        }
        if (errorMsg.includes('already registered') || errorMsg.includes('already exists') || errorMsg.includes('already been registered')) {
          return { success: false, error: 'An account with this email already exists.' };
        }
        return { success: false, error: error.message };
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        return { 
          success: true, 
          requiresConfirmation: true,
          message: 'Please check your email to confirm your account.' 
        };
      }

      return { success: true };
    } catch (error) {
      // Handle network errors
      const errorMsg = error.message || '';
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
        return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection and ensure your Supabase project is not paused.' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Log in an existing user.
   * @returns {{ success: boolean, error?: string }}
   */
  async function login(email, password) {
    try {
      if (!email.trim() || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        // Provide more helpful error messages
        const errorMsg = error.message || '';
        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
          return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection and ensure your Supabase project is not paused.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      // Handle network errors
      const errorMsg = error.message || '';
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
        return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection and ensure your Supabase project is not paused.' };
      }
      return { success: false, error: error.message };
    }
  }

  /** Log out the current user. */
  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  /**
   * Update the current user's profile (username).
   * @param {string} username - New username
   * @returns {{ success: boolean, error?: string }}
   */
  async function updateProfile(username) {
    try {
      if (!username.trim()) {
        return { success: false, error: 'Username is required.' };
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        return { success: false, error: error.message };
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { username: username.trim() }
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Update local state
      setUser({
        id: user.id,
        email: user.email,
        username: username.trim()
      });

      return { success: true };
    } catch (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
        return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection.' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify the current user's password.
   * @param {string} password - Current password to verify
   * @returns {{ success: boolean, error?: string }}
   */
  async function verifyCurrentPassword(password) {
    try {
      if (!password) {
        return { success: false, error: 'Password is required.' };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });

      if (error) {
        // Check if it's an invalid credentials error
        if (error.message.includes('Invalid login') || error.message.includes('Invalid credentials')) {
          return { success: false, error: 'Current password is incorrect.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
        return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection.' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Update the current user's password.
   * @param {string} newPassword - New password
   * @returns {{ success: boolean, error?: string }}
   */
  async function updatePassword(newPassword) {
    try {
      if (!newPassword) {
        return { success: false, error: 'Password is required.' };
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
        return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection.' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete the current user's account.
   * @returns {{ success: boolean, error?: string }}
   */
  async function deleteAccount() {
    try {
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        return { success: false, error: getUserError.message };
      }

      // Note: In production, you would typically call an Edge Function to handle
      // account deletion as the client cannot directly delete users from auth.users
      // This uses the Admin API through a server-side function
      const baseUrl = EDGE_FUNCTION_URL.replace('/todos', '');
      const response = await fetch(
        `${baseUrl}/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ user_id: user.id })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Check if it's a 404 (function not deployed)
        if (response.status === 404) {
          return { success: false, error: 'Delete account function is not deployed. Please contact support or redeploy the function.' };
        }
        return { success: false, error: errorData.error || 'Failed to delete account. Please contact support.' };
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();
      setUser(null);

      return { success: true };
    } catch (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
        return { success: false, error: 'Cannot connect to Supabase server. Please check your internet connection.' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the current session access token for API calls.
   * @returns {Promise<string|null>}
   */
  async function getSessionToken() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        getSessionToken,
        updateProfile,
        updatePassword,
        verifyCurrentPassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Custom hook to consume AuthContext. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

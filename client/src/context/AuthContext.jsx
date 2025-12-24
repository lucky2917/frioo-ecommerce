import React, { createContext, useState, useEffect, useContext } from 'react';
import { logger } from '../utils/logger';

// Moved to supabaseClient.js
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Fetch Profile Details
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      } else if (error) {
        logger.error("Profile fetch error:", error);
        // Don't crash, just log it
      }
      return data;
    } catch (err) {
      logger.error("Auth Error:", err);
      return null;
    }
  };

  useEffect(() => {
    // 1. Initial Session Check with Error Recovery
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // PRODUCTION FIX: Handle session errors gracefully
        if (error) {
          logger.error('Failed to get session:', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }

        setLoading(false);
      } catch (err) {
        // PRODUCTION FIX: Catch any initialization errors
        logger.error('Auth initialization error:', err);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initAuth();

    // 2. Realtime Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', event);

      // PRODUCTION FIX: Handle corrupted refresh tokens
      // This prevents white screen when refresh token is invalid
      if (event === 'TOKEN_REFRESHED') {
        logger.info('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        logger.info('User signed out');
        setUser(null);
        setProfile(null);
      } else if (event === 'USER_UPDATED') {
        logger.info('User updated');
      }

      // Handle session errors (corrupted tokens, etc.)
      if (session?.error) {
        logger.error('Session error detected:', session.error);
        // Clear corrupted session
        localStorage.clear();
        setUser(null);
        setProfile(null);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        try {
          await fetchProfile(session.user.id);
        } catch (err) {
          logger.error('Failed to fetch profile after auth change:', err);
          // Don't crash, just continue without profile
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // 3. AUTO-REFRESH: Automatically refresh session every 50 minutes
    // Supabase tokens expire after 1 hour, so we refresh at 50 minutes
    // This prevents "token expired" errors during long admin sessions
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) {
          logger.error('Scheduled session refresh failed:', error);
        } else if (session?.user) {
          logger.info('Session refreshed successfully (scheduled)');
          setUser(session.user);
        }
      } catch (err) {
        logger.error('Session refresh error:', err);
      }
    }, 50 * 60 * 1000); // 50 minutes in milliseconds

    // 4. PRODUCTION FIX: Page Visibility API - Refresh on App Wake
    // This handles when user returns after device sleep (overnight)
    // Timer-based refresh doesn't work when browser/device is inactive
    const handleVisibilityChange = async () => {
      // Only refresh when page becomes visible
      if (document.visibilityState === 'visible') {
        logger.info('App became visible, checking session...');

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            logger.error('Session check on visibility change failed:', error);
            // If session is invalid, sign out to trigger re-login
            setUser(null);
            setProfile(null);
            return;
          }

          if (session?.user) {
            // Refresh the session to get a new token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              logger.error('Session refresh on visibility failed:', refreshError);
              // Session expired, clear user state
              setUser(null);
              setProfile(null);
            } else if (refreshData?.session?.user) {
              logger.info('Session refreshed on app wake');
              setUser(refreshData.session.user);
              await fetchProfile(refreshData.session.user.id);
            }
          } else {
            // No session, clear user state
            setUser(null);
            setProfile(null);
          }
        } catch (err) {
          logger.error('Visibility change handler error:', err);
          setUser(null);
          setProfile(null);
        }
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 5. PRODUCTION FIX: Window Focus Event (Fallback)
    // Some mobile browsers don't fully support visibilitychange
    const handleFocus = async () => {
      logger.info('Window focused, validating session...');

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          logger.warn('No valid session on focus');
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        logger.error('Focus handler error:', err);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Helper function to manually refresh session (useful for admin panel)
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Manual session refresh failed:', err);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Reverted to dynamic origin
        redirectTo: window.location.origin + '/onboarding'
      }
    });
  };

  const signOut = async () => {
    // Preserve cart before clearing localStorage
    const cart = localStorage.getItem('frioo_cart');

    await supabase.auth.signOut();
    localStorage.clear();

    // Restore cart after clearing
    if (cart) {
      localStorage.setItem('frioo_cart', cart);
    }

    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, profile, signInWithGoogle, signOut, loading, fetchProfile, refreshSession }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
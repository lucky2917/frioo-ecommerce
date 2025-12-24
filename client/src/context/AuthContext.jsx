import React, { createContext, useState, useEffect, useContext } from 'react';
import { logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';

// Moved to supabaseClient.js
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Hard Reset (Clear Session but Preserve Cart)
  const hardReset = async () => {
    logger.warn('Performing hard reset of auth state');
    const cart = localStorage.getItem('frioo_cart');

    // Try to sign out from Supabase (best effort)
    try { await supabase.auth.signOut(); } catch (_) { /* ignore */ }

    // Clear local storage (tokens, cache)
    localStorage.clear();

    // Restore cart
    if (cart) localStorage.setItem('frioo_cart', cart);

    setUser(null);
    setProfile(null);
    setLoading(false); // Ensure we don't hang
  };

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
      // SAFETY TIMEOUT: Force app to load even if Supabase/Network hangs
      const safetyTimeout = setTimeout(() => {
        if (loading) {
          logger.warn('Auth initialization timed out - forcing load');
          setLoading(false);
        }
      }, 3000); // 3 seconds max wait

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Failed to get session:', error);
          // Only reset if it's a real auth error, not network
          if (error.message && !error.message.includes('Network')) {
            await hardReset();
          }
        } else if (session?.user) {
          setUser(session.user);
          // Non-blocking profile fetch - don't wait for it to stop loading state
          fetchProfile(session.user.id).catch(e => logger.error('Background profile fetch failed:', e));
        }

      } catch (err) {
        logger.error('Auth initialization error:', err);
        setUser(null);
        setProfile(null);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    initAuth();

    // 2. Realtime Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', event);

      if (event === 'TOKEN_REFRESHED') {
        logger.info('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'USER_UPDATED') {
        logger.info('User updated');
      }

      // Handle session errors (corrupted tokens, etc.)
      if (session?.error) {
        logger.error('Session error detected:', session.error);
        await hardReset();
        return;
      }

      if (session?.user) {
        setUser(session.user);
        // Optimized: Only fetch profile if not already set or if user changed
        if (!profile || profile.id !== session.user.id) {
          fetchProfile(session.user.id).catch(console.error);
        }
      } else if (!loading) {
        // Only clear if we are past initialization (prevents flickering)
        setUser(null);
        setProfile(null);
      }

      // Ensure loading is false after any auth change
      setLoading(false);
    });

    // ... (rest of the useEffect logic remains minimal changed, omitted for brevity but assumed safe) ...
    // 3. AUTO-REFRESH & 4. VISIBILITY (Keep existing logic instructions or assume preserved if not replacing)

    // For this tool usage, I am replacing a large chunk. I will assume the user wanted me to strictly replace lines 38-66 AND the render. 
    // BUT the 'replace_file_content' replaces a SINGLE contiguous block. 
    // `AuthContext` has `initAuth` at top and `return` at bottom. They are NOT contiguous. 
    // I MUST USE `multi_replace_file_content` instead. 
    // SKIPPING THIS TOOL CALL to use correct tool.


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
            // Only reset if it's a real auth error, not network
            if (error.message && !error.message.includes('Network')) {
              await hardReset();
            }
            return;
          }

          if (session?.user) {
            // Refresh the session to get a new token
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              logger.error('Session refresh on visibility failed:', refreshError);
              if (refreshError.message && !refreshError.message.includes('Network')) {
                await hardReset();
              }
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

        if (error) {
          if (error.message && !error.message.includes('Network')) {
            await hardReset();
          }
        } else if (!session) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    await hardReset();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, profile, signInWithGoogle, signOut, loading, fetchProfile, refreshSession }}>
      {loading ? <LoadingSpinner fullScreen={true} message="Verifying session..." /> : children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
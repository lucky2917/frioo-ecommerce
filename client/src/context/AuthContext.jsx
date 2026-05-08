import { createContext, useState, useEffect, useContext } from 'react';
import { logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const hardReset = async () => {
    logger.warn('Performing hard reset of auth state');
    const cart = localStorage.getItem('frioo_cart');

    try { await supabase.auth.signOut(); } catch (_) {  }

    localStorage.clear();

    if (cart) localStorage.setItem('frioo_cart', cart);

    setUser(null);
    setProfile(null);
    setLoading(false);
  };

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
      }
      return data;
    } catch (err) {
      logger.error("Auth Error:", err);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const safetyTimeout = setTimeout(() => {
        if (loading) {
          logger.warn('Auth initialization timed out - forcing load');
          setLoading(false);
        }
      }, 3000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Failed to get session:', error);
          if (error.message && !error.message.includes('Network')) {
            await hardReset();
          }
        } else if (session?.user) {
          setUser(session.user);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', event);

      if (event === 'SIGNED_IN') {
        logger.info('User signed in');
      } else if (event === 'TOKEN_REFRESHED') {
        logger.info('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'USER_UPDATED') {
        logger.info('User updated');
      }

      if (session?.error) {
        logger.error('Session error detected:', session.error);
        await hardReset();
        return;
      }

      if (session?.user) {
        setUser(session.user);
        if (!profile || profile.id !== session.user.id) {
          fetchProfile(session.user.id).catch(e => logger.error('Background profile fetch failed:', e));
        }
      } else if (!loading) {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

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
    }, 50 * 60 * 1000);

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        logger.info('App became visible, checking session...');

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            logger.error('Session check on visibility change failed:', error);
            if (error.message && !error.message.includes('Network')) {
              await hardReset();
            }
            return;
          }

          if (session?.user) {
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

    document.addEventListener('visibilitychange', handleVisibilityChange);

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

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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

export const useAuth = () => useContext(AuthContext);

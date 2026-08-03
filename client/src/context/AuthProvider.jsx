import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from './auth-context';

const AUTH_INIT_TIMEOUT_MS = 8000;
const SESSION_RECHECK_INTERVAL_MS = 60 * 1000;
const CART_STORAGE_KEY = 'frioo_cart';

const isNetworkError = (error) => {
  const message = error?.message || '';
  return /network|fetch|timeout|offline|connection/i.test(message);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const profileRef = useRef(null);
  const sessionCheckInFlightRef = useRef(false);
  const lastSessionCheckRef = useRef(0);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hardReset = useCallback(async () => {
    logger.warn('Performing hard reset of auth state');
    let preservedCart = null;

    try {
      preservedCart = localStorage.getItem(CART_STORAGE_KEY);
    } catch (err) {
      logger.warn('Could not read cart before reset:', err);
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.warn('Sign out during hard reset failed:', err);
    }

    try {
      localStorage.clear();
      if (preservedCart) localStorage.setItem(CART_STORAGE_KEY, preservedCart);
    } catch (err) {
      logger.warn('Could not clear storage during reset:', err);
    }

    if (!mountedRef.current) return;
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Profile fetch error:', error);
        return null;
      }

      if (data && mountedRef.current) setProfile(data);
      return data;
    } catch (err) {
      logger.error('Auth Error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let safetyTimeout = null;

    const finishLoading = () => {
      if (!mountedRef.current) return;
      setLoading(false);
    };

    const initAuth = async () => {
      safetyTimeout = setTimeout(() => {
        logger.warn('Auth initialization timed out - continuing without session');
        finishLoading();
      }, AUTH_INIT_TIMEOUT_MS);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Failed to get session:', error);
          if (!isNetworkError(error)) {
            await hardReset();
            return;
          }
        } else if (session?.user && mountedRef.current) {
          setUser(session.user);
          fetchProfile(session.user.id).catch((err) => logger.error('Background profile fetch failed:', err));
        }
      } catch (err) {
        logger.error('Auth initialization error:', err);
        if (mountedRef.current) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(safetyTimeout);
        finishLoading();
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info('Auth state changed:', event);

      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        if (profileRef.current?.id !== session.user.id) {
          fetchProfile(session.user.id).catch((err) => logger.error('Background profile fetch failed:', err));
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    const verifySessionStillValid = async () => {
      if (document.visibilityState !== 'visible') return;
      if (sessionCheckInFlightRef.current) return;

      const now = Date.now();
      if (now - lastSessionCheckRef.current < SESSION_RECHECK_INTERVAL_MS) return;

      sessionCheckInFlightRef.current = true;
      lastSessionCheckRef.current = now;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          logger.error('Session check failed:', error);
          if (!isNetworkError(error)) await hardReset();
          return;
        }

        if (!session) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        logger.error('Session check error:', err);
      } finally {
        sessionCheckInFlightRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', verifySessionStillValid);
    window.addEventListener('focus', verifySessionStillValid);

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', verifySessionStillValid);
      window.removeEventListener('focus', verifySessionStillValid);
    };
  }, [fetchProfile, hardReset]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (!session?.user) return false;

      if (mountedRef.current) setUser(session.user);
      await fetchProfile(session.user.id);
      return true;
    } catch (err) {
      logger.error('Manual session refresh failed:', err);
      return false;
    }
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async (redirectPath = '/onboarding') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectPath}` }
    });
    if (error) logger.error('Google sign in failed:', error);
    return !error;
  }, []);

  const signOut = useCallback(async () => {
    await hardReset();
    window.location.href = '/';
  }, [hardReset]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    fetchProfile,
    refreshSession
  }), [user, profile, loading, signInWithGoogle, signOut, fetchProfile, refreshSession]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingSpinner fullScreen={true} message="Verifying session..." /> : children}
    </AuthContext.Provider>
  );
};

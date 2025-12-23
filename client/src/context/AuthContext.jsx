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
      }
      return data;
    } catch (err) {
      logger.error("Auth Error:", err);
    }
  };

  useEffect(() => {
    // 1. Initial Session Check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    };

    initAuth();

    // 2. Realtime Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
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
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        logger.error('Session refresh failed:', error);
      } else if (session?.user) {
        logger.info('Session refreshed successfully');
        setUser(session.user);
      }
    }, 50 * 60 * 1000); // 50 minutes in milliseconds

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
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
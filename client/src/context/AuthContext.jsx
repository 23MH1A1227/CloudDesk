import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { tokenStore, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialising, setInitialising] = useState(true);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restore the session on first load using the stored token.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    let cancelled = false;
    const bootstrap = async () => {
      if (!tokenStore.get()) {
        setInitialising(false);
        return;
      }
      try {
        const res = await authApi.me();
        if (!cancelled) setUser(res.data.user);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setInitialising(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    tokenStore.set(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    tokenStore.set(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => clearSession(), [clearSession]);

  const refreshUser = useCallback(async () => {
    const res = await authApi.me();
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      initialising,
      isAuthenticated: Boolean(user),
      isCustomer: user?.role === 'CUSTOMER',
      isAgent: user?.role === 'SUPPORT_AGENT',
      isAdmin: user?.role === 'ADMIN',
      isStaff: user?.role === 'SUPPORT_AGENT' || user?.role === 'ADMIN',
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, initialising, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

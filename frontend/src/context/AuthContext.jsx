import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/api';
import { setToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const t = authService.getToken();
    if (!t) { setLoading(false); return; }
    try {
      const { user: u } = await authService.auth.me();
      setUser(u);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (data) => {
    const { user: u, token } = await authService.auth.login(data);
    authService.setToken(token);
    setUser(u);
    return u;
  };

  const signup = async (data) => {
    const { user: u, token } = await authService.auth.signup(data);
    authService.setToken(token);
    setUser(u);
    return u;
  };

  const logout = () => {
    authService.setToken(null);
    setUser(null);
  };

  const value = { user, loading, login, signup, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

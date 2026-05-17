import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { PublicUser } from './types';

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setKiteAddress: (address: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await api.me();
      setUser(r.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signup = useCallback(async (email: string, password: string) => {
    const r = await api.signup(email, password);
    setUser(r.user);
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const r = await api.login(email, password);
    setUser(r.user);
  }, []);
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);
  const setKiteAddress = useCallback(async (address: string | null) => {
    const r = await api.setKiteAddress(address);
    setUser(r.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signup, login, logout, setKiteAddress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '../api/client';
import { login as apiLogin, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [isAuthenticated, setIsAuth]  = useState(false);
  const [isLoading, setIsLoading]     = useState(true);

  // On mount: verify stored token by calling /api/auth/me
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    // Token exists – verify it is still valid
    setToken(storedToken);
    getMe()
      .then((data) => {
        setUser(data?.user || data);
        setIsAuth(true);
      })
      .catch(() => {
        // Token rejected – clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setToken(null);
        setUser(null);
        setIsAuth(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * login(username, password)
   * Calls POST /api/auth/login, stores tokens, updates state.
   */
  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password); // throws on failure
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
    setIsAuth(true);
    return data;
  }, []);

  /**
   * logout()
   * Clears storage and resets auth state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIsAuth(false);
    // Hard redirect so the interceptor doesn't race
    window.location.href = '/login';
  }, []);

  /**
   * refreshUser()
   * Call when user details change (e.g. after password reset)
   */
  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data?.user || data);
    } catch(err) {
      console.error('Failed to refresh user context', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

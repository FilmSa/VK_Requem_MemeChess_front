import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "./authApi.js";
import { AuthContext } from "./AuthContext.js";
import {
  persistAuthToken,
  readStoredAuthToken,
} from "../../shared/lib/authToken.js";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredAuthToken());
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(() =>
    Boolean(readStoredAuthToken())
  );

  const clearSession = useCallback(() => {
    persistAuthToken("");
    setToken("");
    setUser(null);
    setIsInitializing(false);
  }, []);

  const applySession = useCallback((nextToken, nextUser, options = {}) => {
    persistAuthToken(nextToken, options);
    setToken(nextToken);
    setUser(nextUser);
    setIsInitializing(false);
  }, []);

  const refreshSession = useCallback(
    async (activeToken) => {
      const sessionToken = activeToken || token;

      if (!sessionToken) {
        clearSession();
        return null;
      }

      const response = await authApi.getCurrentUser(sessionToken);
      setUser(response.user);
      setIsInitializing(false);
      return response.user;
    },
    [clearSession, token]
  );

  const refreshCurrency = useCallback(
    async (activeToken) => {
      const sessionToken = activeToken || token;

      if (!sessionToken) {
        return null;
      }

      const currency = await authApi.getCurrency(sessionToken);
      setUser((currentUser) => authApi.applyCurrencyToUser(currentUser, currency));
      return currency;
    },
    [token]
  );

  useEffect(() => {
    let isCancelled = false;

    async function bootstrapSession() {
      if (!token) {
        setIsInitializing(false);
        setUser(null);
        return;
      }

      setIsInitializing(true);

      try {
        const response = await authApi.getCurrentUser(token);
        if (isCancelled) {
          return;
        }

        setUser(response.user);
      } catch {
        if (isCancelled) {
          return;
        }

        clearSession();
        return;
      }

      if (!isCancelled) {
        setIsInitializing(false);
      }
    }

    bootstrapSession();

    return () => {
      isCancelled = true;
    };
  }, [clearSession, token]);

  const login = useCallback(
    async (credentials, options = {}) => {
      const response = await authApi.login(credentials);
      applySession(response.token, response.user, options);
      return response.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const response = await authApi.register(payload);
      applySession(response.token, response.user);
      return response.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    let logoutError = null;

    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      logoutError = error;
    } finally {
      clearSession();
    }

    if (logoutError) {
      console.warn(logoutError);
    }
  }, [clearSession, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isInitializing,
      login,
      register,
      logout,
      refreshSession,
      refreshCurrency,
    }),
    [
      isInitializing,
      login,
      logout,
      refreshCurrency,
      refreshSession,
      register,
      token,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

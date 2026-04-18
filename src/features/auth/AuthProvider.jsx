import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authApi from "./authApi.js";
import { AuthContext } from "./AuthContext.js";

const tokenStorageKey = "meme-chess.auth.token";

function readStoredToken() {
  try {
    return window.localStorage.getItem(tokenStorageKey) || "";
  } catch {
    return "";
  }
}

function persistToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(tokenStorageKey, token);
      return;
    }

    window.localStorage.removeItem(tokenStorageKey);
  } catch {
    // Ignore storage access issues and keep the session in memory only.
  }
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readStoredToken());
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(() =>
    Boolean(readStoredToken())
  );

  const clearSession = useCallback(() => {
    persistToken("");
    setToken("");
    setUser(null);
    setIsInitializing(false);
  }, []);

  const applySession = useCallback((nextToken, nextUser) => {
    persistToken(nextToken);
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
    async (credentials) => {
      const response = await authApi.login(credentials);
      applySession(response.token, response.user);
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
    }),
    [isInitializing, login, logout, refreshSession, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

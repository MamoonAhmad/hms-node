import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "hms_token";
const USER_KEY = "hms_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    const payload = response.data ?? response;
    const userData = payload.user;
    const authToken = payload.token;
    if (!userData || !authToken) {
      throw new Error('Invalid login response');
    }

    // Save to state
    setUser(userData);
    setToken(authToken);

    // Persist to localStorage
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));

    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      let parsedUser;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      setUser(parsedUser);

      // Validate token by fetching current user (with timeout so we don't hang on blank screen)
      const timeoutMs = 10000;
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, timeoutMs);

      authApi
        .me(storedToken)
        .then((response) => {
          const userData = response?.data ?? response;
          if (userData) setUser(userData);
        })
        .catch(() => {
          // Token is invalid, clear auth state
          logout();
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

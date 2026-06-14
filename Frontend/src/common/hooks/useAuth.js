import { useCallback, useState } from 'react';
import { getToken, removeToken, setToken } from '../auth/cookie';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback((userData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (userData.token) {
        setToken(userData.token);
      }

      setUser(userData.user || userData);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeToken();
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
  };
};
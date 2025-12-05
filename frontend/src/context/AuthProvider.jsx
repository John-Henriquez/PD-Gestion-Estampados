import { useState, useCallback } from 'react';
import { AuthContext } from './AuthContext.jsx';
import { logout as logoutService } from '../services/auth.service';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem('usuario');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;

  const loginSuccess = useCallback((userData) => {
    sessionStorage.setItem('usuario', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error('Error al cerrar sesión en servidor', error);
    } finally {
      sessionStorage.removeItem('usuario');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext.jsx';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario')) || '';
  const isAuthenticated = user ? true : false;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  return <AuthContext.Provider value={{ isAuthenticated, user }}>{children}</AuthContext.Provider>;
}

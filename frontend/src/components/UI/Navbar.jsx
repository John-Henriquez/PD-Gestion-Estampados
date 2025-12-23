import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth.service';
import { useState, useEffect, useRef } from 'react';
import { Typography, Box } from '@mui/material';
import {
  IconMenu2, IconX, IconUser, IconLogout, IconLogin, IconUserPlus,
  IconHome, IconUsers, IconSettings, IconPackage, IconShoppingCart,
  IconClipboardList, IconReceipt, IconPhoto, IconChevronDown, IconChartBar
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext.jsx';

import '../../styles/components/navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const menuRef = useRef(null);
  const adminRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(event.target)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logoutSubmit = () => {
    logout();
    setMenuOpen(false);
    navigate('/auth');
  };

  const mainPath = user?.rol === 'administrador' ? '/dashboard' : '/shop';
  const mainText = user?.rol === 'administrador' ? 'Dashboard' : 'Tienda';
  const mainIcon = user?.rol === 'administrador' ? <IconChartBar size={20} /> : <IconShoppingCart size={20} />;

  const navItems = {
    public: [
      { to: mainPath, text: mainText, icon: mainIcon },
      ...(user?.rol === 'administrador' ? [{ to: '/shop', text: 'Ver Tienda', icon: <IconShoppingCart size={20} /> }] : [])
    ],
    user: [
      { to: '/my-orders', text: 'Mis Pedidos', icon: <IconClipboardList size={20} /> },
    ],
    admin: [
      { to: '/users', text: 'Usuarios', icon: <IconUsers size={20} /> },
      { to: '/inventario', text: 'Inventario', icon: <IconPackage size={20} /> },
      { to: '/gallery', text: 'Galería', icon: <IconPhoto size={20} /> },
      { to: '/admin/orders', text: 'Pedidos', icon: <IconReceipt size={20} /> },
    ],
    guest: [
      { to: '/auth', text: 'Login', icon: <IconLogin size={20} /> },
      { to: '/register', text: 'Registro', icon: <IconUserPlus size={20} /> },
    ]
  };

  return (
    <nav className="navbar">
      {/* 1. LOGO Y MARCA */}
      <div className="navbar__brand" onClick={() => navigate(mainPath)}>
        <img src="/logoMorado.jpg" alt="Logo" className="navbar__logo" />
        <Typography variant="h6" className="navbar__title">Vibra Estampados</Typography>
      </div>

      {/* 2. MENÚ DE ESCRITORIO (CENTRO-IZQUIERDA) */}
      <div className="navbar__desktop-menu">
        <ul className="navbar__list">
          {/* Items Públicos (Dashboard o Tienda) */}
          {navItems.public.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>
                {item.icon} {item.text}
              </NavLink>
            </li>
          ))}

          {isAuthenticated && (
            <>
              {/* Items de Usuario */}
              {navItems.user.map(item => (
                <li key={item.to}>
                  <NavLink to={item.to} className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>
                    {item.icon} {item.text}
                  </NavLink>
                </li>
              ))}
              
              {/* Dropdown de Admin */}
              {user?.rol === 'administrador' && (
                <li className="navbar__dropdown" ref={adminRef}>
                  <button 
                    className={`navbar__dropdown-toggle ${adminOpen ? 'open' : ''}`}
                    onClick={() => setAdminOpen(!adminOpen)}
                  >
                    <IconSettings size={20} /> 
                    <span>Admin</span>
                    <IconChevronDown size={16} className={`arrow ${adminOpen ? 'rotate' : ''}`} />
                  </button>
                  
                  <div className={`navbar__dropdown-menu ${adminOpen ? 'show' : ''}`}>
                    {navItems.admin.map(item => (
                      <NavLink 
                        key={item.to} 
                        to={item.to} 
                        className="navbar__dropdown-link"
                        onClick={() => setAdminOpen(false)}
                      >
                        {item.icon} {item.text}
                      </NavLink>
                    ))}
                  </div>
                </li>
              )}
            </>
          )}

          {/* Items de Invitado */}
          {!isAuthenticated && navItems.guest.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} className="navbar__link">
                {item.icon} {item.text}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. ACCIONES FINALES (DERECHA - LOGOUT) */}
      <div className="navbar__actions">
        {isAuthenticated && (
          <>
            <div className="navbar__user-tag">
              <IconUser size={18} />
              <span>{user?.nombreCompleto?.split(' ')[0]}</span>
            </div>
            <button 
              onClick={logoutSubmit} 
              className="navbar__logout-btn-desktop"
              title="Cerrar Sesión"
            >
              <IconLogout size={24} stroke={2} />
            </button>
          </>
        )}
      </div>

      <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <IconX size={28} /> : <IconMenu2 size={28} />}
      </button>

      <div className={`navbar__mobile-sidebar ${menuOpen ? 'active' : ''}`} ref={menuRef}>
        <div className="navbar__mobile-header">
           <IconUser size={32} />
           <Typography variant="subtitle1">{user?.nombreCompleto || 'Invitado'}</Typography>
        </div>
        
        <ul className="navbar__mobile-list">
          {navItems.public.map(item => (
             <li key={`m-${item.to}`}><NavLink to={item.to} onClick={() => setMenuOpen(false)}>{item.icon} {item.text}</NavLink></li>
          ))}
          
          {isAuthenticated && user?.rol === 'administrador' && (
            <>
              <li className="mobile-label">Administración</li>
              {navItems.admin.map(item => (
                <li key={`ma-${item.to}`}><NavLink to={item.to} onClick={() => setMenuOpen(false)}>{item.icon} {item.text}</NavLink></li>
              ))}
            </>
          )}
        </ul>

        {isAuthenticated ? (
          <button className="navbar__mobile-logout" onClick={logoutSubmit}>
            <IconLogout /> Cerrar Sesión
          </button>
        ) : (
          <div className="navbar__mobile-auth">
            <Button fullWidth variant="contained" onClick={() => {navigate('/auth'); setMenuOpen(false)}}>Login</Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from '../services/auth.service';
import './../styles/components/navbar.css';
import { useState, useEffect, useRef } from "react";
import { Typography } from '@mui/material';
import {
    IconMenu2, IconX, IconUser, IconLogout, IconLogin, IconUserPlus, 
    IconHome, IconUsers, IconSettings, IconPackage, IconShoppingCart, IconClipboardList,
    IconReceipt
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const userRole = user?.rol;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const logoutSubmit = () => {
    try {
      logout();
      navigate('/shop');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const publicItems = [
    { to: "/shop", text: "Tienda", icon: <IconShoppingCart size={20} />},
    { to: "/home", text: "Inicio", icon: <IconHome size={20} /> },
  ];

  const userItems = [
    {to: "/my-orders", text: "Mis Pedidos", icon: <IconClipboardList size={20} /> },
  ];

  const adminItems = [
    { to: "/users", text: "Usuarios", icon: <IconUsers size={20} /> },
    { to: '/inventario', text: 'Inventario', icon: <IconPackage size={20} /> },
    { to: '/admin/orders', text: 'Gestionar Pedidos', icon: <IconReceipt size={20} /> },
  ];

  const guestItems = [
     { to: "/auth", text: "Iniciar Sesión", icon: <IconLogin size={20} /> },
     { to: "/register", text: "Registrarse", icon: <IconUserPlus size={20} /> },
   ];

  return (
    <nav className="navbar" style={{ fontFamily: 'var(--font-family)' }}>
      {/* Información de Usuario o Placeholder */}
      <div className="navbar__user-info">
        {isAuthenticated ? (
          <>
            <IconUser size={24} />
            <span className="navbar__user-name-desktop">{user?.nombreCompleto || 'Usuario'}</span>
          </>
        
        ) : (
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
             Vibra Estampados 
          </Typography>
        )}
      </div>

      {/* Menú para desktop */}
      <div className="navbar__desktop-menu">
        <ul>
          {/* Items Públicos */}
          {publicItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
                {item.icon} {item.text}
              </NavLink>
            </li>
          ))}

          {/* Items de Usuario Logueado */}
          {isAuthenticated && userItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
                {item.icon} {item.text}
              </NavLink>
            </li>
          ))}

          {/* Menú Desplegable Admin */}
          {isAuthenticated && userRole === 'administrador' && (
            <li className="navbar__dropdown">
              <button className="navbar__dropdown-toggle" aria-haspopup="true" aria-expanded="false">
                <IconSettings /> Administración
              </button>
              <div className="navbar__dropdown-menu">
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                  >
                    {item.icon}
                    {item.text}
                  </NavLink>
                ))}
              </div>
            </li>
          )}

          {/* Botones Login/Registro o Logout */}
          {isAuthenticated ? (
            <li>
              <button className="navbar__logout-button" onClick={logoutSubmit}>
                <IconLogout size={20}/>
                Cerrar sesión
              </button>
            </li>
          ) : (
            <> {/* Mostrar botones de login/registro si no está autenticado */}
               {guestItems.map((item) => (
                 <li key={item.to}>
                    <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
                      {item.icon} {item.text}
                    </NavLink>
                 </li>
               ))}
             </>
          )}
        </ul>
      </div>

      {/* Menú móvil */}
      <div className={`navbar__mobile-menu ${menuOpen ? 'active' : ''}`} ref={menuRef}>
        <button className="navbar__close-menu" onClick={() => setMenuOpen(false)}>
          <IconX size={24} />
        </button>

        <ul>
          {/* Items Públicos */}
          {publicItems.map((item) => (
            <li key={`mobile-${item.to}`}>
              <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                {item.icon} {item.text}
              </NavLink>
            </li>
          ))}

          {/* Items Usuario Logueado */}
          {isAuthenticated && userItems.map((item) => (
              <li key={`mobile-${item.to}`}>
                <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                  {item.icon} {item.text}
                </NavLink>
              </li>
           ))}

          {/* Items Admin */}
          {isAuthenticated && userRole === 'administrador' && (
             <>
               <li className="navbar__mobile-separator"><Typography variant="caption" color="textSecondary">Admin</Typography></li>
               {adminItems.map((item) => (
                 <li key={`mobile-admin-${item.to}`}>
                    <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                      {item.icon} {item.text}
                    </NavLink>
                 </li>
               ))}
             </>
          )}
          
          {/* Items Invitado */}
           {!isAuthenticated && (
               <>
                 <li className="navbar__mobile-separator"><Typography variant="caption" color="textSecondary">Acceso</Typography></li>
                 {guestItems.map((item) => (
                     <li key={`mobile-guest-${item.to}`}>
                        <NavLink to={item.to} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`} onClick={() => setMenuOpen(false)}>
                          {item.icon} {item.text}
                        </NavLink>
                     </li>
                 ))}
               </>
           )}
        </ul>

        {/* Botón Logout (solo si está logueado) */}
         {isAuthenticated && (
            <button className="navbar__logout-button" onClick={logoutSubmit}>
              <IconLogout size={20} /> Cerrar sesión
            </button>
         )}
      </div>

      <button className="navbar__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
        {menuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
      </button>
    </nav>
  );
};

export default Navbar;

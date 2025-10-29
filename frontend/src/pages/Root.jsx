import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';

function Root() {
  return (
    <AuthProvider>
      <CartProvider>
        <PageRoot />
      </CartProvider>
    </AuthProvider>
  );
}

function PageRoot() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default Root;

import { Outlet } from 'react-router-dom';
import Navbar from '../components/UI/Navbar.jsx';
import { AuthProvider } from '../context/AuthProvider.jsx';
import { CartProvider } from '../context/CartProvider.jsx';

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

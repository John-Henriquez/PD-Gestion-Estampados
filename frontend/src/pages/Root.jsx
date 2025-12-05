import { Outlet } from 'react-router-dom';
import Navbar from '../components/UI/Navbar.jsx';
import Footer from '../components/UI/Footer.jsx';
import FloatingCartButton from '../components/UI/FloatingCartButton.jsx';
import { AuthProvider } from '../context/AuthProvider.jsx';
import { CartProvider } from '../context/CartProvider.jsx';

export function AppProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </AuthProvider>
  );
}

export function MainLayout() {
  return (
    <>
      <Navbar />
      <div
        className="main-content"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </div>
      <FloatingCartButton />
      <Footer />
    </>
  );
}

export default AppProviders;

import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Users from './pages/Users.jsx';
import Inventory from './pages/Inventario.jsx';
import Register from './pages/Register.jsx';
import Checkout from './pages/Checkout.jsx';
import Shop from './pages/Shop.jsx';
import MyOrders from './pages/MyOrders.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import PackDetail from './pages/PackDetail.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Gallery from './pages/Gallery.jsx';
import Error404 from './pages/Error404.jsx';
import { AppProviders, MainLayout } from './pages/Root.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './styles/index.css';

const router = createBrowserRouter([
  {
    element: <AppProviders />,
    errorElement: <Error404 />,
    children: [
      {
        path: '/auth',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { path: 'home', element: <Home /> },
          {
            path: 'users',
            element: (
              <ProtectedRoute allowedRoles={['administrador']}>
                <Users />
              </ProtectedRoute>
            ),
          },
          {
            path: 'inventario',
            element: (
              <ProtectedRoute allowedRoles={['administrador']}>
                <Inventory />
              </ProtectedRoute>
            ),
          },
          {
            path: 'gallery',
            element: (
              <ProtectedRoute allowedRoles={['administrador']}>
                <Gallery />
              </ProtectedRoute>
            ),
          },
          { path: '/checkout', element: <Checkout /> },
          { path: '/shop', element: <Shop /> },
          { path: '/pack/:packId', element: <PackDetail /> },
          { path: '/product/:itemTypeId', element: <ProductDetail /> },
          { path: '/order-confirmation/:orderId', element: <OrderConfirmation /> },
          {
            path: '/my-orders',
            element: (
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            ),
          },
          {
            path: '/order-details/:id',
            element: (
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: '/admin/orders',
            element: (
              <ProtectedRoute allowedRoles={['administrador']}>
                <AdminOrders />
              </ProtectedRoute>
            ),
          },
          { index: true, element: <Home /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);

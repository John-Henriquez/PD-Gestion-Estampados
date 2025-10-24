import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Users from './pages/Users.jsx';
import Inventory from './pages/Inventario.jsx';
import Register from './pages/Register.jsx';
import Checkout from './pages/Checkout.jsx';
import Shop from './pages/Shop.jsx';
import Error404 from './pages/Error404.jsx';
import Root from './pages/Root.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './styles/index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <Error404 />,
    children: [
      {
        path: '/home',
        element: <Home />
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute allowedRoles={['administrador']}>
            <Users />
          </ProtectedRoute>
        )
      },
      {
        path: '/inventario',
        element: <Inventory />
      },
      {
        path: '/checkout', 
        element: <Checkout />
      },
      {
        path: '/shop', 
        element: <Shop />
      },
    ],
  },
  {
    path: '/auth',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);

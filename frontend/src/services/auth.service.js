import axios from './root.service';
import cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { convertirMinusculas } from '../helpers/formatData';

export async function login(dataUser) {
  try {
    const response = await axios.post('/auth/login', {
      email: dataUser.email,
      password: dataUser.password,
    });
    console.log('Response completo:', response);
    console.log('Response data:', response.data);
    if (response.status === 200) {
      const token = response.data.data.token;
      cookies.set('jwt-auth', token, { path: '/' });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return response.data;
    }
  } catch (error) {
    return error.response?.data;
  }
}

export async function register(data) {
  try {
    const dataRegister = convertirMinusculas(data);
    const { nombreCompleto, email, rut, password } = dataRegister;
    const response = await axios.post('/auth/register', {
      nombreCompleto,
      email,
      rut,
      password,
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
}

export async function logout() {
  try {
    await axios.post('/auth/logout');
    sessionStorage.removeItem('usuario');
    cookies.remove('jwt');
    cookies.remove('jwt-auth');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { login } from '../services/auth.service';
import Form from '../components/UI/Form.jsx';
import useLogin from '../hooks/auth/useLogin.jsx';
import { jwtDecode } from 'jwt-decode';
import './../styles/pages/login.css';
import './../styles/components/form.css';

const Login = () => {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const { errorEmail, errorPassword, errorData, handleInputChange } = useLogin();

  const loginSubmit = async (data) => {
    try {
      const response = await login(data);
      if (response.status === 'Success') {
        const token = response.data.token;
        const decoded = jwtDecode(token);

        const userData = {
          nombreCompleto: decoded.nombreCompleto,
          email: decoded.email,
          rut: decoded.rut,
          rol: decoded.rol,
        };
        loginSuccess(userData);
        navigate('/shop');
      } else if (response.status === 'Client error') {
        errorData(response.details);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <img
          src="/logoClaro.jpg"
          alt="Logo Vibra Estampados"
          className="auth-logo" // Clase para estilizar el logo
        />
        <Form
          title="Iniciar sesión"
          fields={[
            {
              label: 'Correo electrónico',
              name: 'email',
              placeholder: 'ejemplo@dominio.cl',
              fieldType: 'input',
              type: 'email',
              required: true,
              minLength: 5,
              maxLength: 30,
              errorMessageData: errorEmail,
              validate: {
                emailDomain: (value) => value.includes('@'),
              },
              onChange: (e) => handleInputChange('email', e.target.value),
            },
            {
              label: 'Contraseña',
              name: 'password',
              placeholder: '**********',
              fieldType: 'input',
              type: 'password',
              required: true,
              minLength: 7,
              maxLength: 26,
              pattern: /^[a-zA-Z0-9]+$/,
              patternMessage: 'Debe contener solo letras y números',
              errorMessageData: errorPassword,
              onChange: (e) => handleInputChange('password', e.target.value),
            },
          ]}
          buttonText="Iniciar sesión"
          onSubmit={loginSubmit}
          footerContent={
            <p className="login-footer">
              ¿No tienes cuenta?, <a href="/register">¡Regístrate aquí!</a>
            </p>
          }
        />
      </div>
    </main>
  );
};

export default Login;

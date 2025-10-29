import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '../../services/user.service';

const useUsers = () => {
  const [users, setUsers] = useState([]);

  const dataLogged = useCallback((formattedData) => {
    try {
      const usuario = JSON.parse(sessionStorage.getItem('usuario'));
      if (!usuario) return;

      const { rut } = usuario;

      return formattedData.filter((user) => user.rut !== rut);
    } catch (error) {
      console.error('Error:', error);
      return formattedData;
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getUsers();
      const formattedData = response.map((user) => ({
        nombreCompleto: user.nombreCompleto,
        rut: user.rut,
        email: user.email,
        rol: user.rol,
        createdAt: user.createdAt,
      }));

      const filteredData = dataLogged(formattedData);
      setUsers(filteredData);
    } catch (error) {
      console.error('Error: ', error);
    }
  }, [dataLogged]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, fetchUsers, setUsers };
};

export default useUsers;

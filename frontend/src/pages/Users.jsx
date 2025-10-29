import Table from '../components/Table.jsx';
import useUsers from '../hooks/users/useGetUsers.jsx';
import Search from '../components/Search.jsx';
import Popup from '../components/Popup.jsx';
import { Trash2, Pencil } from 'lucide-react';
import { useCallback, useState } from 'react';
import './../styles/pages/users.css';
import useEditUser from '../hooks/users/useEditUser.jsx';
import useDeleteUser from '../hooks/users/useDeleteUser.jsx';

const Users = () => {
  const { users, fetchUsers, setUsers } = useUsers();
  const [filterRut, setFilterRut] = useState('');

  const { handleClickUpdate, handleUpdate, isPopupOpen, setIsPopupOpen, dataUser, setDataUser } =
    useEditUser(setUsers);

  const { handleDelete } = useDeleteUser(fetchUsers, setDataUser);

  const handleRutFilterChange = (e) => {
    setFilterRut(e.target.value);
  };

  const handleSelectionChange = useCallback(
    (selectedUsers) => {
      setDataUser(selectedUsers);
    },
    [setDataUser]
  );

  const columns = [
    { title: 'Nombre', field: 'nombreCompleto', width: 350, responsive: 0 },
    { title: 'Correo electrónico', field: 'email', width: 300, responsive: 3 },
    { title: 'Rut', field: 'rut', width: 150, responsive: 2 },
    { title: 'Rol', field: 'rol', width: 200, responsive: 2 },
    { title: 'Creado', field: 'createdAt', width: 200, responsive: 2 },
  ];

  return (
    <div className="main-container">
      <div className="table-container">
        <div className="top-table">
          <h1 className="title-table">Usuarios</h1>
          <div className="filter-actions">
            <Search
              value={filterRut}
              onChange={handleRutFilterChange}
              placeholder={'Filtrar por rut'}
            />

            <button
              onClick={handleClickUpdate}
              disabled={dataUser.length === 0}
              className="icon-button" // Clase para estilos comunes
            >
              <Pencil
                size={20} // Tamaño estándar
                className={dataUser.length === 0 ? 'icon-disabled' : 'icon-active'}
              />
            </button>

            <button
              className="delete-user-button icon-button"
              disabled={dataUser.length === 0}
              onClick={() => handleDelete(dataUser)}
            >
              <Trash2
                size={20}
                className={dataUser.length === 0 ? 'icon-disabled' : 'icon-active'}
              />
            </button>
          </div>
        </div>
        <Table
          data={users}
          columns={columns}
          filter={filterRut}
          dataToFilter={'rut'}
          initialSortName={'nombreCompleto'}
          onSelectionChange={handleSelectionChange}
        />
      </div>
      <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
    </div>
  );
};

export default Users;

export function isAdmin(role) {
  if (!role) {
    console.warn('Rol no proporcionado para la validación de administrador.');
    return false;
  }
  return role === 'administrador';
}

export function formatearRUT(inputName) {
  document.addEventListener('input', (event) => {
    const input = event.target;
    if (input && input.name === inputName) {
      let rut = input.value.replace(/[^0-9kK]/g, '').toUpperCase();

      if (rut.length > 9) {
        rut = rut.slice(0, 9);
      }

      if (rut.length > 1) {
        const cuerpo = rut.slice(0, -1);
        const dv = rut.slice(-1);
        const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        input.value = `${cuerpoFormateado}-${dv}`;
      } else {
        input.value = rut;
      }
    }
  });
}

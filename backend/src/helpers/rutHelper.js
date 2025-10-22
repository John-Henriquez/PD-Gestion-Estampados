export function validateRut(rut) {
  rut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(rut)) return false;

  let cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1);

  let suma = 0,
    multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(cuerpo.charAt(i));
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  let dvEsperado = 11 - (suma % 11);
  if (dvEsperado === 11) dvEsperado = "0";
  else if (dvEsperado === 10) dvEsperado = "K";
  else dvEsperado = dvEsperado.toString();

  return dv === dvEsperado;
}

export function formatRut(rut) {
  rut = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  let cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1);
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
}

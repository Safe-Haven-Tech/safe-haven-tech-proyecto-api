/**
 * Valida que la fecha de nacimiento sea válida y la edad esté en un rango razonable
 * @param {Date} fecha - Fecha de nacimiento a validar
 * @returns {boolean} - true si la fecha es válida, false en caso contrario
 */
const validarFechaNacimiento = function(fecha) {
  const hoy = new Date();
  const edadMinima = 13; 
  const edadMaxima = 120; 
  
  if (fecha > hoy) {
    return false; 
  }
  
  const edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
    edad--;
  }
  
  return edad >= edadMinima && edad <= edadMaxima;
};

/**
 * Valida que la contraseña cumpla con los requisitos de seguridad
 * @param {string} contraseña - Contraseña a validar
 * @returns {boolean} - true si la contraseña es válida, false en caso contrario
 */
const validarContraseña = function(contraseña) {
  if (contraseña.length < 8 || contraseña.length > 128) {
    return false;
  }
  
  const tieneMayuscula = /[A-Z]/.test(contraseña);
  const tieneMinuscula = /[a-z]/.test(contraseña);
  const tieneNumero = /\d/.test(contraseña);
  
  return tieneMayuscula && tieneMinuscula && tieneNumero;
};

/**
 * Valida que el correo electrónico tenga un formato válido
 * @param {string} correo - Correo electrónico a validar
 * @returns {boolean} - true si el correo es válido, false en caso contrario
 */
const validarCorreo = function(correo) {
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regexCorreo.test(correo);
};


const validarNombre = function(nombre) {
  const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return regexNombre.test(nombre);
};

module.exports = {
  validarFechaNacimiento,
  validarContraseña,
  validarCorreo,
  validarNombre
};

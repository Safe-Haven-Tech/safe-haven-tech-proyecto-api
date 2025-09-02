/**
 * Validaciones específicas para recursos informativos
 */

/**
 * Validar que el título del recurso sea válido
 * @param {string} titulo - Título a validar
 * @returns {boolean} True si es válido
 */
const validarTitulo = (titulo) => {
  if (!titulo || typeof titulo !== 'string') {
    return false;
  }
  
  const tituloLimpio = titulo.trim();
  
  // Debe tener entre 5 y 200 caracteres
  if (tituloLimpio.length < 5 || tituloLimpio.length > 200) {
    return false;
  }
  
  // No debe contener solo espacios o caracteres especiales
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_.,!?()]+$/.test(tituloLimpio)) {
    return false;
  }
  
  return true;
};

/**
 * Validar que el contenido del recurso sea válido
 * @param {string} contenido - Contenido a validar
 * @returns {boolean} True si es válido
 */
const validarContenido = (contenido) => {
  if (!contenido || typeof contenido !== 'string') {
    return false;
  }
  
  const contenidoLimpio = contenido.trim();
  
  // Debe tener entre 50 y 5000 caracteres
  if (contenidoLimpio.length < 50 || contenidoLimpio.length > 5000) {
    return false;
  }
  
  return true;
};

/**
 * Validar que el tópico sea válido
 * @param {string} topico - Tópico a validar
 * @returns {boolean} True si es válido
 */
const validarTopico = (topico) => {
  if (!topico || typeof topico !== 'string') {
    return false;
  }
  
  const topicoLimpio = topico.trim();
  
  // Debe tener entre 3 y 100 caracteres
  if (topicoLimpio.length < 3 || topicoLimpio.length > 100) {
    return false;
  }
  
  // Solo letras, números, espacios y guiones
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$/.test(topicoLimpio)) {
    return false;
  }
  
  return true;
};

/**
 * Validar que la fuente sea válida
 * @param {string} fuente - Fuente a validar
 * @returns {boolean} True si es válida
 */
const validarFuente = (fuente) => {
  if (!fuente || typeof fuente !== 'string') {
    return false;
  }
  
  const fuenteLimpia = fuente.trim();
  
  // Debe tener entre 5 y 200 caracteres
  if (fuenteLimpia.length < 5 || fuenteLimpia.length > 200) {
    return false;
  }
  
  return true;
};

/**
 * Validar que la URL sea válida (si se proporciona)
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válida o no se proporciona
 */
const validarURL = (url) => {
  if (!url) {
    return true; // URL es opcional
  }
  
  if (typeof url !== 'string') {
    return false;
  }
  
  const urlLimpia = url.trim();
  
  // Debe tener entre 10 y 1024 caracteres
  if (urlLimpia.length < 10 || urlLimpia.length > 1024) {
    return false;
  }
  
  // Debe ser una URL válida
  try {
    new URL(urlLimpia);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validar que el tipo de recurso sea válido
 * @param {string} tipo - Tipo a validar
 * @returns {boolean} True si es válido
 */
const validarTipo = (tipo) => {
  const tiposValidos = ['articulo', 'video', 'infografia', 'manual', 'guia', 'otro'];
  return tiposValidos.includes(tipo);
};

/**
 * Validar que las etiquetas sean válidas
 * @param {Array} etiquetas - Etiquetas a validar
 * @returns {boolean} True si son válidas
 */
const validarEtiquetas = (etiquetas) => {
  if (!etiquetas) {
    return true; // Etiquetas son opcionales
  }
  
  if (!Array.isArray(etiquetas)) {
    return false;
  }
  
  // Máximo 10 etiquetas
  if (etiquetas.length > 10) {
    return false;
  }
  
  // Validar cada etiqueta
  for (const etiqueta of etiquetas) {
    if (typeof etiqueta !== 'string') {
      return false;
    }
    
    const etiquetaLimpia = etiqueta.trim();
    
    // Cada etiqueta debe tener entre 2 y 50 caracteres
    if (etiquetaLimpia.length < 2 || etiquetaLimpia.length > 50) {
      return false;
    }
    
    // Solo letras, números, espacios y guiones
    if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$/.test(etiquetaLimpia)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Validar que la calificación sea válida
 * @param {number} calificacion - Calificación a validar
 * @returns {boolean} True si es válida
 */
const validarCalificacion = (calificacion) => {
  if (typeof calificacion !== 'number') {
    return false;
  }
  
  // Debe estar entre 1 y 5
  if (calificacion < 1 || calificacion > 5) {
    return false;
  }
  
  // Debe ser un número entero
  if (!Number.isInteger(calificacion)) {
    return false;
  }
  
  return true;
};

/**
 * Validar datos completos de un recurso informativo
 * @param {Object} datosRecurso - Datos del recurso a validar
 * @returns {Object} Resultado de la validación
 */
const validarRecursoCompleto = (datosRecurso) => {
  const errores = [];
  
  // Validar campos obligatorios
  if (!validarTitulo(datosRecurso.titulo)) {
    errores.push('El título debe tener entre 5 y 200 caracteres y contener solo texto válido');
  }
  
  if (!validarContenido(datosRecurso.contenido)) {
    errores.push('El contenido debe tener entre 50 y 5000 caracteres');
  }
  
  if (!validarTopico(datosRecurso.topico)) {
    errores.push('El tópico debe tener entre 3 y 100 caracteres y contener solo texto válido');
  }
  
  if (!validarFuente(datosRecurso.fuente)) {
    errores.push('La fuente debe tener entre 5 y 200 caracteres');
  }
  
  // Validar campos opcionales
  if (datosRecurso.url && !validarURL(datosRecurso.url)) {
    errores.push('La URL proporcionada no es válida');
  }
  
  if (datosRecurso.tipo && !validarTipo(datosRecurso.tipo)) {
    errores.push('El tipo de recurso no es válido');
  }
  
  if (datosRecurso.etiquetas && !validarEtiquetas(datosRecurso.etiquetas)) {
    errores.push('Las etiquetas no son válidas (máximo 10, entre 2 y 50 caracteres cada una)');
  }
  
  return {
    esValido: errores.length === 0,
    errores
  };
};

/**
 * Validar datos de actualización de un recurso
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Object} Resultado de la validación
 */
const validarActualizacionRecurso = (datosActualizados) => {
  const errores = [];
  
  // Validar cada campo si se proporciona
  if (datosActualizados.titulo !== undefined && !validarTitulo(datosActualizados.titulo)) {
    errores.push('El título debe tener entre 5 y 200 caracteres y contener solo texto válido');
  }
  
  if (datosActualizados.contenido !== undefined && !validarContenido(datosActualizados.contenido)) {
    errores.push('El contenido debe tener entre 50 y 5000 caracteres');
  }
  
  if (datosActualizados.topico !== undefined && !validarTopico(datosActualizados.topico)) {
    errores.push('El tópico debe tener entre 3 y 100 caracteres y contener solo texto válido');
  }
  
  if (datosActualizados.fuente !== undefined && !validarFuente(datosActualizados.fuente)) {
    errores.push('La fuente debe tener entre 5 y 200 caracteres');
  }
  
  if (datosActualizados.url !== undefined && !validarURL(datosActualizados.url)) {
    errores.push('La URL proporcionada no es válida');
  }
  
  if (datosActualizados.tipo !== undefined && !validarTipo(datosActualizados.tipo)) {
    errores.push('El tipo de recurso no es válido');
  }
  
  if (datosActualizados.etiquetas !== undefined && !validarEtiquetas(datosActualizados.etiquetas)) {
    errores.push('Las etiquetas no son válidas (máximo 10, entre 2 y 50 caracteres cada una)');
  }
  
  return {
    esValido: errores.length === 0,
    errores
  };
};

/**
 * Sanitizar datos de un recurso informativo
 * @param {Object} datosRecurso - Datos del recurso a sanitizar
 * @returns {Object} Datos sanitizados
 */
const sanitizarRecurso = (datosRecurso) => {
  const sanitizado = {};
  
  // Sanitizar campos de texto
  if (datosRecurso.titulo) {
    sanitizado.titulo = datosRecurso.titulo.trim();
  }
  
  if (datosRecurso.contenido) {
    sanitizado.contenido = datosRecurso.contenido.trim();
  }
  
  if (datosRecurso.topico) {
    sanitizado.topico = datosRecurso.topico.trim();
  }
  
  if (datosRecurso.fuente) {
    sanitizado.fuente = datosRecurso.fuente.trim();
  }
  
  if (datosRecurso.descripcion) {
    sanitizado.descripcion = datosRecurso.descripcion.trim();
  }
  
  if (datosRecurso.url) {
    sanitizado.url = datosRecurso.url.trim();
  }
  
  if (datosRecurso.archivo) {
    sanitizado.archivo = datosRecurso.archivo.trim();
  }
  
  // Sanitizar etiquetas
  if (datosRecurso.etiquetas && Array.isArray(datosRecurso.etiquetas)) {
    sanitizado.etiquetas = datosRecurso.etiquetas
      .map(etiqueta => etiqueta.trim())
      .filter(etiqueta => etiqueta.length > 0);
  }
  
  // Mantener otros campos
  if (datosRecurso.tipo) sanitizado.tipo = datosRecurso.tipo;
  if (datosRecurso.destacado !== undefined) sanitizado.destacado = datosRecurso.destacado;
  if (datosRecurso.activo !== undefined) sanitizado.activo = datosRecurso.activo;
  
  return sanitizado;
};

module.exports = {
  validarTitulo,
  validarContenido,
  validarTopico,
  validarFuente,
  validarURL,
  validarTipo,
  validarEtiquetas,
  validarCalificacion,
  validarRecursoCompleto,
  validarActualizacionRecurso,
  sanitizarRecurso
};

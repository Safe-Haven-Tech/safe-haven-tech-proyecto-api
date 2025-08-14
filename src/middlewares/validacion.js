const { validarCorreo, validarContraseña, validarNombre } = require('../utils/validaciones');

/**
 * Middleware para validar el registro de usuario
 */
const validarRegistroUsuario = (req, res, next) => {
  try {
    const { correo, contraseña, nombreCompleto, fechaNacimiento } = req.body;
    const errores = [];

    // Validar correo
    if (!correo) {
      errores.push('El correo electrónico es obligatorio');
    } else if (!validarCorreo(correo)) {
      errores.push('El formato del correo electrónico no es válido');
    }

    // Validar contraseña
    if (!contraseña) {
      errores.push('La contraseña es obligatoria');
    } else if (!validarContraseña(contraseña)) {
      errores.push('La contraseña debe tener entre 8 y 128 caracteres, incluyendo al menos una mayúscula, una minúscula y un número');
    }

    // Validar nombre completo
    if (!nombreCompleto) {
      errores.push('El nombre completo es obligatorio');
    } else if (!validarNombre(nombreCompleto)) {
      errores.push('El nombre completo solo puede contener letras, espacios y acentos');
    } else if (nombreCompleto.length < 2 || nombreCompleto.length > 100) {
      errores.push('El nombre completo debe tener entre 2 y 100 caracteres');
    }

    // Validar fecha de nacimiento
    if (!fechaNacimiento) {
      errores.push('La fecha de nacimiento es obligatoria');
    } else {
      const fecha = new Date(fechaNacimiento);
      if (isNaN(fecha.getTime())) {
        errores.push('La fecha de nacimiento debe ser una fecha válida');
      } else if (fecha > new Date()) {
        errores.push('La fecha de nacimiento no puede ser en el futuro');
      }
    }

    // Si hay errores, retornar respuesta de error
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores,
        timestamp: new Date().toISOString()
      });
    }

    // Si todo está bien, continuar
    next();
  } catch (error) {
    console.error('Error en validación de registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar los datos de entrada'
    });
  }
};

/**
 * Middleware para validar actualización de usuario
 */
const validarActualizacionUsuario = (req, res, next) => {
  try {
    const { nombreCompleto, fechaNacimiento } = req.body;
    const errores = [];

    // Validar nombre completo si se proporciona
    if (nombreCompleto !== undefined) {
      if (!validarNombre(nombreCompleto)) {
        errores.push('El nombre completo solo puede contener letras, espacios y acentos');
      } else if (nombreCompleto.length < 2 || nombreCompleto.length > 100) {
        errores.push('El nombre completo debe tener entre 2 y 100 caracteres');
      }
    }

    // Validar fecha de nacimiento si se proporciona
    if (fechaNacimiento !== undefined) {
      const fecha = new Date(fechaNacimiento);
      if (isNaN(fecha.getTime())) {
        errores.push('La fecha de nacimiento debe ser una fecha válida');
      } else if (fecha > new Date()) {
        errores.push('La fecha de nacimiento no puede ser en el futuro');
      }
    }

    // Si hay errores, retornar respuesta de error
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores,
        timestamp: new Date().toISOString()
      });
    }

    // Si todo está bien, continuar
    next();
  } catch (error) {
    console.error('Error en validación de actualización:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar los datos de entrada'
    });
  }
};

/**
 * Middleware para validar ID de MongoDB
 */
const validarIdMongo = (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validar que el ID tenga el formato correcto de MongoDB
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El ID proporcionado no tiene el formato correcto de MongoDB',
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de ID:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar el ID'
    });
  }
};

module.exports = {
  validarRegistroUsuario,
  validarActualizacionUsuario,
  validarIdMongo
};

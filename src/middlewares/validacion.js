const { validarCorreo, validarContraseña, validarNombre } = require('../utils/validaciones');

/**
 * Middleware para validar el registro de usuario
 */
const validarRegistroUsuario = (req, res, next) => {
  try {
    const { correo, contraseña, nombreCompleto, fechaNacimiento, nombreUsuario } = req.body;
    const errores = [];

    if (nombreUsuario !== undefined) {
      if (nombreUsuario.length < 2 || nombreUsuario.length > 20) {
        errores.push('El nombre de usuario debe tener entre 2 y 20 caracteres');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(nombreUsuario)) {
        errores.push('El nombre de usuario solo puede contener letras, números y guion bajo');
      }
    }else{
      errores.push('El nombre de usuario es obligatorio');
    }

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
    const { nombreCompleto, fechaNacimiento, nombreUsuario, pronombres } = req.body;
    const errores = [];

    // nombreUsuario obligatorio
    if (!nombreUsuario || nombreUsuario.trim() === '') {
      errores.push('El nombre de usuario es obligatorio');
    } else {
      if (nombreUsuario.length < 5 || nombreUsuario.length > 20) {
        errores.push('El nombre de usuario debe tener entre 5 y 20 caracteres');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(nombreUsuario)) {
        errores.push('El nombre de usuario solo puede contener letras, números y guion bajo');
      }
    }

    // pronombres opcionales
    if (pronombres) {
      if (pronombres.length > 15) errores.push('Los pronombres no deben exceder 15 caracteres');
      if (!/^[a-zA-Z0-9_ ]+$/.test(pronombres)) {
        errores.push('Los pronombres solo pueden contener letras, números, espacios o guion bajo');
      }
    }

    // nombreCompleto opcional
    if (nombreCompleto) {
      if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nombreCompleto)) {
        errores.push('El nombre completo solo puede contener letras, espacios y acentos');
      } else if (nombreCompleto.length < 2 || nombreCompleto.length > 100) {
        errores.push('El nombre completo debe tener entre 2 y 100 caracteres');
      }
    }

    // fechaNacimiento opcional
    if (fechaNacimiento) {
      const fecha = new Date(fechaNacimiento);
      if (isNaN(fecha.getTime())) {
        errores.push('La fecha de nacimiento debe ser una fecha válida');
      } else if (fecha > new Date()) {
        errores.push('La fecha de nacimiento no puede ser en el futuro');
      }
    }

    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores,
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de actualización:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar los datos de entrada'
    });
  }
};

module.exports = { validarActualizacionUsuario };



const validarImagenUsuario = async (req, res, next) => {
  try {
    if (req.file) {
      const metadata = await sharp(req.file.path).metadata();
      const { width, height } = metadata;

      // Dimensiones recomendadas para ícono tipo Instagram
      if (width < 100 || height < 100 || width > 500 || height > 500) {
        return res.status(400).json({
          error: 'La imagen debe tener entre 100x100 y 500x500 píxeles',
          timestamp: new Date().toISOString()
        });
      }
    }
    next();
  } catch (error) {
    console.error('Error validando imagen:', error);
    res.status(500).json({
      error: 'Error al procesar la imagen',
      detalles: error.message
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

/**
 * Middleware para validar creación/actualización de publicación
 */
const validarPublicacion = (req, res, next) => {
  try {
    const { contenido, tipo, anonimo, multimedia, etiquetasUsuarios, archivosAdjuntos } = req.body;
    const errores = [];

    // Validar contenido
    if (!contenido || contenido.trim().length === 0) {
      errores.push('El contenido de la publicación es obligatorio');
    } else if (contenido.length > 5000) {
      errores.push('El contenido no puede exceder los 5000 caracteres');
    }

    // Validar tipo
    if (!tipo) {
      errores.push('El tipo de publicación es obligatorio');
    } else if (!['foro', 'perfil'].includes(tipo)) {
      errores.push('El tipo debe ser "foro" o "perfil"');
    }

    // Validar anonimo
    if (anonimo !== undefined && typeof anonimo !== 'boolean') {
      errores.push('El campo anonimo debe ser true o false');
    }

    // Validar multimedia (solo para publicaciones de perfil)
    if (multimedia !== undefined) {
      if (!Array.isArray(multimedia)) {
        errores.push('El campo multimedia debe ser un array');
      } else if (multimedia.length > 10) {
        errores.push('No se pueden subir más de 10 archivos multimedia');
      } else {
        multimedia.forEach((url, index) => {
          if (typeof url !== 'string' || url.trim().length === 0) {
            errores.push(`El archivo multimedia en la posición ${index + 1} no es válido`);
          } else if (url.length > 1024) {
            errores.push(`La URL del archivo multimedia en la posición ${index + 1} es demasiado larga`);
          }
        });
      }
    }

    // Validar etiquetas de usuarios (solo para publicaciones de perfil)
    if (etiquetasUsuarios !== undefined) {
      if (!Array.isArray(etiquetasUsuarios)) {
        errores.push('El campo etiquetasUsuarios debe ser un array');
      } else if (etiquetasUsuarios.length > 10) {
        errores.push('No se pueden etiquetar más de 10 usuarios');
      } else {
        etiquetasUsuarios.forEach((id, index) => {
          if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            errores.push(`El ID del usuario etiquetado en la posición ${index + 1} no es válido`);
          }
        });
      }
    }

    // Validar archivos adjuntos (solo para publicaciones de foro)
    if (archivosAdjuntos !== undefined) {
      if (!Array.isArray(archivosAdjuntos)) {
        errores.push('El campo archivosAdjuntos debe ser un array');
      } else if (archivosAdjuntos.length > 5) {
        errores.push('No se pueden adjuntar más de 5 archivos');
      } else {
        archivosAdjuntos.forEach((url, index) => {
          if (typeof url !== 'string' || url.trim().length === 0) {
            errores.push(`El archivo adjunto en la posición ${index + 1} no es válido`);
          } else if (url.length > 1024) {
            errores.push(`La URL del archivo adjunto en la posición ${index + 1} es demasiado larga`);
          }
        });
      }
    }

    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de publicación inválidos',
        detalles: errores,
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de publicación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar los datos de la publicación'
    });
  }
};

/**
 * Middleware para validar comentario
 */
const validarComentario = (req, res, next) => {
  try {
    const { contenido } = req.body;
    const errores = [];

    if (!contenido || contenido.trim().length === 0) {
      errores.push('El contenido del comentario es obligatorio');
    } else if (contenido.length > 1000) {
      errores.push('El contenido del comentario no puede exceder los 1000 caracteres');
    }

    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de comentario inválidos',
        detalles: errores,
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de comentario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar los datos del comentario'
    });
  }
};

/**
 * Middleware para validar actualización de publicación (solo campos editables)
 */
const validarActualizacionPublicacion = (req, res, next) => {
  try {
    const { contenido, etiquetasUsuarios } = req.body;
    const errores = [];

    // Validar contenido
    if (!contenido || contenido.trim().length === 0) {
      errores.push('El contenido de la publicación es obligatorio');
    } else if (contenido.length > 5000) {
      errores.push('El contenido no puede exceder los 5000 caracteres');
    }

    // Validar etiquetas de usuarios (solo para publicaciones de perfil)
    if (etiquetasUsuarios !== undefined) {
      if (!Array.isArray(etiquetasUsuarios)) {
        errores.push('El campo etiquetasUsuarios debe ser un array');
      } else if (etiquetasUsuarios.length > 10) {
        errores.push('No se pueden etiquetar más de 10 usuarios');
      } else {
        etiquetasUsuarios.forEach((id, index) => {
          if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            errores.push(`El ID del usuario etiquetado en la posición ${index + 1} no es válido`);
          }
        });
      }
    }

    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de publicación inválidos',
        detalles: errores,
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de actualización de publicación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar los datos de la publicación'
    });
  }
};

/**
 * Middleware para validar denuncia
 */
const validarDenuncia = (req, res, next) => {
  try {
    const { motivo, descripcion } = req.body;
    const errores = [];

    if (!motivo) {
      errores.push('El motivo de la denuncia es obligatorio');
    } else {
      const motivosValidos = [
        'contenido_inapropiado',
        'spam',
        'acoso',
        'discurso_odio',
        'informacion_falsa',
        'contenido_sexual',
        'violencia',
        'otro'
      ];
      
      if (!motivosValidos.includes(motivo)) {
        errores.push('El motivo de la denuncia no es válido');
      }
    }

    if (descripcion && descripcion.length > 500) {
      errores.push('La descripción no puede exceder los 500 caracteres');
    }

    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de denuncia inválidos',
        detalles: errores,
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    console.error('Error en validación de denuncia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al validar los datos de la denuncia'
    });
  }
};

module.exports = {
  validarRegistroUsuario,
  validarActualizacionUsuario,
  validarIdMongo,
  validarImagenUsuario,
  validarPublicacion,
  validarActualizacionPublicacion,
  validarComentario,
  validarDenuncia
};

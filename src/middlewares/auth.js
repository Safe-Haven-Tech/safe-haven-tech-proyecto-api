const authService = require('../services/authService');
const { config } = require('../config');

/**
 * Middleware para autenticar token JWT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const autenticarToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        detalles: 'Se requiere un token de autenticación'
      });
    }

    // Verificar token
    const decoded = authService.verificarToken(token);
    
    // Agregar información del usuario al request
    req.usuario = {
      userId: decoded.id,
      correo: decoded.correo,
      rol: decoded.rol
    };

    next();

  } catch (error) {
    console.error('❌ Error de autenticación:', error);

    if (error.message === 'Token expirado') {
      return res.status(401).json({
        error: 'Token expirado',
        detalles: 'El token de acceso ha expirado, use el refresh token'
      });
    }

    if (error.message === 'Token inválido' || error.message === 'Tipo de token inválido') {
      return res.status(401).json({
        error: 'Token inválido',
        detalles: 'El token proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error de autenticación',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al verificar el token'
    });
  }
};

/**
 * Middleware para verificar rol específico
 * @param {string|Array} roles - Rol o roles permitidos
 * @returns {Function} Middleware function
 */
const verificarRol = (roles) => {
  return (req, res, next) => {
    try {
      const { rol } = req.usuario;
      
      // Convertir a array si es string
      const rolesPermitidos = Array.isArray(roles) ? roles : [roles];
      
      if (!rolesPermitidos.includes(rol)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          detalles: `Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
        });
      }

      next();

    } catch (error) {
      console.error('❌ Error al verificar rol:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        detalles: 'Error al verificar permisos del usuario'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario es propietario del recurso
 * @param {string} paramName - Nombre del parámetro que contiene el ID del recurso
 * @returns {Function} Middleware function
 */
const verificarPropietario = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      const { userId, rol } = req.usuario;
      const recursoId = req.params[paramName];

      // Administradores tienen acceso total
      if (rol === 'administrador') {
        return next();
      }

      // Verificar si el usuario es propietario del recurso
      if (userId === recursoId) {
        return next();
      }

      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: 'Solo puedes acceder a tus propios recursos'
      });

    } catch (error) {
      console.error('❌ Error al verificar propietario:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        detalles: 'Error al verificar permisos del usuario'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario está activo
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const verificarUsuarioActivo = async (req, res, next) => {
  try {
    const { userId } = req.usuario;

    // Obtener información actualizada del usuario
    const usuario = await authService.obtenerInformacionUsuario(req.headers.authorization?.split(' ')[1]);

    if (!usuario.activo || usuario.estado !== 'activo') {
      return res.status(403).json({
        error: 'Usuario inactivo',
        detalles: 'Tu cuenta está inactiva o suspendida'
      });
    }

    next();

  } catch (error) {
    console.error('❌ Error al verificar usuario activo:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al verificar el estado del usuario'
    });
  }
};

/**
 * Middleware para autenticación opcional (útil para endpoints que pueden funcionar con o sin token)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
const autenticacionOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = authService.verificarToken(token);
        req.usuario = {
          userId: decoded.id,
          correo: decoded.correo,
          rol: decoded.rol
        };
      } catch (error) {
        // Si el token es inválido, continuar sin usuario autenticado
        console.log('⚠️ Token inválido en autenticación opcional, continuando sin usuario');
      }
    }

    next();

  } catch (error) {
    // En caso de error, continuar sin usuario autenticado
    console.log('⚠️ Error en autenticación opcional, continuando sin usuario');
    next();
  }
};

/**
 * Middleware para verificar permisos específicos
 * @param {string} accion - Acción a realizar (create, read, update, delete)
 * @param {string} recurso - Tipo de recurso
 * @returns {Function} Middleware function
 */
const verificarPermisos = (accion, recurso) => {
  return (req, res, next) => {
    try {
      const { userId, rol } = req.usuario;
      const recursoId = req.params.id || req.body.id;

      // Verificar permisos usando el servicio
      const tienePermisos = authService.validarPermisos(
        { _id: userId, rol },
        recursoId,
        accion
      );

      if (!tienePermisos) {
        return res.status(403).json({
          error: 'Acceso denegado',
          detalles: `No tienes permisos para ${accion} este ${recurso}`
        });
      }

      next();

    } catch (error) {
      console.error('❌ Error al verificar permisos:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        detalles: 'Error al verificar permisos del usuario'
      });
    }
  };
};

module.exports = {
  autenticarToken,
  verificarRol,
  verificarPropietario,
  verificarUsuarioActivo,
  autenticacionOpcional,
  verificarPermisos
};

const authService = require('../services/authService');
const { config } = require('../config');

/**
 * @desc    Login de usuario
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Validar campos requeridos
    if (!correo || !contraseña) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        detalles: 'correo y contraseña son obligatorios'
      });
    }

    // Autenticar usuario
    const resultado = await authService.autenticarUsuario(correo, contraseña);

    res.json({
      mensaje: 'Login exitoso',
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en login:', error);

    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({
        error: 'Autenticación fallida',
        detalles: error.message
      });
    }

    if (error.message === 'Usuario inactivo o suspendido') {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token requerido',
        detalles: 'El refresh token es obligatorio'
      });
    }

    // Refrescar token
    const resultado = await authService.refrescarToken(refreshToken);

    res.json({
      mensaje: 'Token refrescado exitosamente',
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al refrescar token:', error);

    if (error.message === 'Refresh token expirado' || error.message === 'Refresh token inválido') {
      return res.status(401).json({
        error: 'Token inválido',
        detalles: error.message
      });
    }

    if (error.message === 'Usuario no válido') {
      return res.status(403).json({
        error: 'Usuario no válido',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Logout de usuario
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const { userId } = req.usuario; // Viene del middleware de autenticación

    // Cerrar sesión
    await authService.cerrarSesion(userId);

    res.json({
      mensaje: 'Logout exitoso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Cambiar contraseña
 * @route   POST /api/auth/cambiar-contraseña
 * @access  Private
 */
const cambiarContraseña = async (req, res) => {
  try {
    const { userId } = req.usuario;
    const { contraseñaActual, nuevaContraseña } = req.body;

    // Validar campos requeridos
    if (!contraseñaActual || !nuevaContraseña) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        detalles: 'contraseñaActual y nuevaContraseña son obligatorios'
      });
    }

    // Cambiar contraseña
    const usuarioActualizado = await authService.cambiarContraseña(
      userId, 
      contraseñaActual, 
      nuevaContraseña
    );

    res.json({
      mensaje: 'Contraseña cambiada exitosamente',
      usuario: usuarioActualizado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);

    if (error.message === 'Contraseña actual incorrecta') {
      return res.status(400).json({
        error: 'Contraseña incorrecta',
        detalles: error.message
      });
    }

    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Verificar token
 * @route   GET /api/auth/verificar
 * @access  Private
 */
const verificarToken = async (req, res) => {
  try {
    const { userId, correo, rol } = req.usuario;

    res.json({
      mensaje: 'Token válido',
      usuario: {
        id: userId,
        correo,
        rol
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al verificar token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener perfil del usuario autenticado
 * @route   GET /api/auth/perfil
 * @access  Private
 */
const obtenerPerfil = async (req, res) => {
  try {
    const { userId } = req.usuario;

    // Obtener información completa del usuario
    const usuario = await authService.obtenerInformacionUsuario(req.headers.authorization?.split(' ')[1]);

    res.json({
      mensaje: 'Perfil obtenido exitosamente',
      usuario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);

    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  cambiarContraseña,
  verificarToken,
  obtenerPerfil
};

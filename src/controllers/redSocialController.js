const redSocialService = require('../services/redSocialService');
const { config } = require('../config');

// ==================== SEGUIDORES ====================

/**
 * @desc    Seguir a un usuario
 * @route   POST /api/red-social/seguir/:usuarioId
 * @access  Private
 */
const seguirUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await redSocialService.seguirUsuario(usuarioActualId, usuarioId);

    res.json({
      mensaje: resultado.mensaje,
      seguidores: resultado.seguidores,
      seguidos: resultado.seguidos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al seguir usuario:', error);

    if (error.message === 'No puedes seguirte a ti mismo') {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    if (error.message === 'No puedes seguir a un usuario que has bloqueado' || 
        error.message === 'No puedes seguir a este usuario') {
      return res.status(403).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    if (error.message === 'Ya estás siguiendo a este usuario') {
      return res.status(409).json({
        error: 'Usuario ya seguido',
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
 * @desc    Dejar de seguir a un usuario
 * @route   DELETE /api/red-social/seguir/:usuarioId
 * @access  Private
 */
const dejarDeSeguirUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await redSocialService.dejarDeSeguirUsuario(usuarioActualId, usuarioId);

    res.json({
      mensaje: resultado.mensaje,
      seguidores: resultado.seguidores,
      seguidos: resultado.seguidos,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al dejar de seguir usuario:', error);

    if (error.message === 'No estás siguiendo a este usuario') {
      return res.status(400).json({
        error: 'Acción no permitida',
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
 * @desc    Obtener seguidores de un usuario
 * @route   GET /api/red-social/seguidores/:usuarioId
 * @access  Private
 */
const obtenerSeguidores = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { pagina = 1, limite = 20 } = req.query;

    const resultado = await redSocialService.obtenerSeguidores(usuarioId, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener seguidores:', error);

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
 * @desc    Obtener usuarios seguidos
 * @route   GET /api/red-social/seguidos/:usuarioId
 * @access  Private
 */
const obtenerSeguidos = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { pagina = 1, limite = 20 } = req.query;

    const resultado = await redSocialService.obtenerSeguidos(usuarioId, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener seguidos:', error);

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

// ==================== BLOQUEOS ====================

/**
 * @desc    Bloquear a un usuario
 * @route   POST /api/red-social/bloquear/:usuarioId
 * @access  Private
 */
const bloquearUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await redSocialService.bloquearUsuario(usuarioActualId, usuarioId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al bloquear usuario:', error);

    if (error.message === 'No puedes bloquearte a ti mismo') {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    if (error.message === 'Ya tienes bloqueado a este usuario') {
      return res.status(409).json({
        error: 'Usuario ya bloqueado',
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
 * @desc    Desbloquear a un usuario
 * @route   DELETE /api/red-social/bloquear/:usuarioId
 * @access  Private
 */
const desbloquearUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await redSocialService.desbloquearUsuario(usuarioActualId, usuarioId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al desbloquear usuario:', error);

    if (error.message === 'Este usuario no está bloqueado') {
      return res.status(400).json({
        error: 'Acción no permitida',
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
 * @desc    Obtener usuarios bloqueados
 * @route   GET /api/red-social/bloqueados
 * @access  Private
 */
const obtenerUsuariosBloqueados = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const { pagina = 1, limite = 20 } = req.query;

    const resultado = await redSocialService.obtenerUsuariosBloqueados(usuarioActualId, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener usuarios bloqueados:', error);

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

// ==================== NOTIFICACIONES ====================

/**
 * @desc    Obtener notificaciones del usuario
 * @route   GET /api/red-social/notificaciones
 * @access  Private
 */
const obtenerNotificaciones = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const { pagina = 1, limite = 20 } = req.query;

    const resultado = await redSocialService.obtenerNotificaciones(usuarioActualId, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Marcar notificación como leída
 * @route   PATCH /api/red-social/notificaciones/:notificacionId/leer
 * @access  Private
 */
const marcarNotificacionComoLeida = async (req, res) => {
  try {
    const { notificacionId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await redSocialService.marcarNotificacionComoLeida(notificacionId, usuarioActualId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al marcar notificación como leída:', error);

    if (error.message === 'Notificación no encontrada') {
      return res.status(404).json({
        error: 'Notificación no encontrada',
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
 * @desc    Marcar todas las notificaciones como leídas
 * @route   PATCH /api/red-social/notificaciones/leer-todas
 * @access  Private
 */
const marcarTodasLasNotificacionesComoLeidas = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;

    const resultado = await redSocialService.marcarTodasLasNotificacionesComoLeidas(usuarioActualId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al marcar todas las notificaciones como leídas:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

// ==================== REACCIONES ====================

/**
 * @desc    Reaccionar a una publicación
 * @route   POST /api/red-social/reaccionar/:publicacionId
 * @access  Private
 */
const reaccionarAPublicacion = async (req, res) => {
  try {
    const { publicacionId } = req.params;
    const { tipo } = req.body;
    const usuarioActualId = req.usuario.userId;

    if (!tipo) {
      return res.status(400).json({
        error: 'Tipo de reacción requerido',
        detalles: 'Debes especificar el tipo de reacción'
      });
    }

    const resultado = await redSocialService.reaccionarAPublicacion(publicacionId, usuarioActualId, tipo);

    res.json({
      mensaje: resultado.mensaje,
      reaccion: resultado.reaccion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al reaccionar a publicación:', error);

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'No tienes permisos para ver esta publicación') {
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
 * @desc    Quitar reacción de una publicación
 * @route   DELETE /api/red-social/reaccionar/:publicacionId
 * @access  Private
 */
const quitarReaccionDePublicacion = async (req, res) => {
  try {
    const { publicacionId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await redSocialService.quitarReaccionDePublicacion(publicacionId, usuarioActualId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al quitar reacción:', error);

    if (error.message === 'No tienes una reacción en esta publicación') {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

// ==================== FEED ====================

/**
 * @desc    Obtener feed del usuario
 * @route   GET /api/red-social/feed
 * @access  Private
 */
const obtenerFeed = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const { pagina = 1, limite = 20 } = req.query;

    const resultado = await redSocialService.obtenerFeed(usuarioActualId, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener feed:', error);

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

// ==================== BÚSQUEDA ====================

/**
 * @desc    Buscar usuarios
 * @route   GET /api/red-social/buscar/usuarios
 * @access  Private
 */
const buscarUsuarios = async (req, res) => {
  try {
    const { termino, pagina = 1, limite = 20 } = req.query;

    if (!termino) {
      return res.status(400).json({
        error: 'Término de búsqueda requerido',
        detalles: 'Debes proporcionar un término de búsqueda'
      });
    }

    const resultado = await redSocialService.buscarUsuarios(termino, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al buscar usuarios:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Buscar publicaciones
 * @route   GET /api/red-social/buscar/publicaciones
 * @access  Private
 */
const buscarPublicaciones = async (req, res) => {
  try {
    const { termino, pagina = 1, limite = 20 } = req.query;

    if (!termino) {
      return res.status(400).json({
        error: 'Término de búsqueda requerido',
        detalles: 'Debes proporcionar un término de búsqueda'
      });
    }

    const resultado = await redSocialService.buscarPublicaciones(termino, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al buscar publicaciones:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

module.exports = {
  // Seguidores
  seguirUsuario,
  dejarDeSeguirUsuario,
  obtenerSeguidores,
  obtenerSeguidos,
  
  // Bloqueos
  bloquearUsuario,
  desbloquearUsuario,
  obtenerUsuariosBloqueados,
  
  // Notificaciones
  obtenerNotificaciones,
  marcarNotificacionComoLeida,
  marcarTodasLasNotificacionesComoLeidas,
  
  // Reacciones
  reaccionarAPublicacion,
  quitarReaccionDePublicacion,
  
  // Feed
  obtenerFeed,
  
  // Búsqueda
  buscarUsuarios,
  buscarPublicaciones
};

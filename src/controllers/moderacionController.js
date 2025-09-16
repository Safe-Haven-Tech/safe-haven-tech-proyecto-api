const publicacionesService = require('../services/publicacionesService');
const comentariosService = require('../services/comentariosService');
const { config } = require('../config');

/**
 * @desc    Moderar una publicación
 * @route   PATCH /api/moderacion/publicaciones/:id
 * @access  Private (solo administradores)
 */
const moderarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, accion } = req.body;
    const moderadorId = req.usuario.userId;

    if (!motivo) {
      return res.status(400).json({
        error: 'Motivo requerido',
        detalles: 'El motivo de la moderación es obligatorio'
      });
    }

    if (!['ocultar', 'marcar'].includes(accion)) {
      return res.status(400).json({
        error: 'Acción inválida',
        detalles: 'La acción debe ser "ocultar" o "marcar"'
      });
    }

    const publicacion = await publicacionesService.moderarPublicacion(
      id,
      moderadorId,
      motivo,
      accion
    );

    res.json({
      mensaje: `Publicación ${accion === 'ocultar' ? 'ocultada' : 'marcada como moderada'} exitosamente`,
      publicacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al moderar publicación:', error);

    if (error.message === 'No existe una publicación con el ID proporcionado') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
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
 * @desc    Moderar un comentario
 * @route   PATCH /api/moderacion/comentarios/:id
 * @access  Private (solo administradores)
 */
const moderarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, accion } = req.body;
    const moderadorId = req.usuario.userId;

    if (!motivo) {
      return res.status(400).json({
        error: 'Motivo requerido',
        detalles: 'El motivo de la moderación es obligatorio'
      });
    }

    if (!['ocultar', 'marcar'].includes(accion)) {
      return res.status(400).json({
        error: 'Acción inválida',
        detalles: 'La acción debe ser "ocultar" o "marcar"'
      });
    }

    const comentario = await comentariosService.moderarComentario(
      id,
      moderadorId,
      motivo,
      accion
    );

    res.json({
      mensaje: `Comentario ${accion === 'ocultar' ? 'ocultado' : 'marcado como moderado'} exitosamente`,
      comentario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al moderar comentario:', error);

    if (error.message === 'No existe un comentario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Comentario no encontrado',
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
 * @desc    Obtener denuncias
 * @route   GET /api/moderacion/denuncias
 * @access  Private (solo administradores)
 */
const obtenerDenuncias = async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 10,
      estado,
      motivo,
      fechaDesde,
      fechaHasta
    } = req.query;

    const filtros = {
      estado,
      motivo,
      fechaDesde,
      fechaHasta
    };

    const resultado = await publicacionesService.obtenerDenuncias(filtros, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener denuncias:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Resolver una denuncia
 * @route   PATCH /api/moderacion/denuncias/:id
 * @access  Private (solo administradores)
 */
const resolverDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;
    const moderadorId = req.usuario.userId;

    if (!estado) {
      return res.status(400).json({
        error: 'Estado requerido',
        detalles: 'El estado de resolución es obligatorio'
      });
    }

    if (!['resuelta', 'rechazada'].includes(estado)) {
      return res.status(400).json({
        error: 'Estado inválido',
        detalles: 'El estado debe ser "resuelta" o "rechazada"'
      });
    }

    const denuncia = await publicacionesService.resolverDenuncia(
      id,
      moderadorId,
      estado,
      observaciones
    );

    res.json({
      mensaje: `Denuncia ${estado} exitosamente`,
      denuncia,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al resolver denuncia:', error);

    if (error.message === 'No existe una denuncia con el ID proporcionado') {
      return res.status(404).json({
        error: 'Denuncia no encontrada',
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
 * @desc    Obtener comentarios moderados
 * @route   GET /api/moderacion/comentarios
 * @access  Private (solo administradores)
 */
const obtenerComentariosModerados = async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 10,
      moderado,
      visible,
      usuarioId
    } = req.query;

    const filtros = {
      moderado: moderado !== undefined ? moderado === 'true' : undefined,
      visible: visible !== undefined ? visible === 'true' : undefined,
      usuarioId
    };

    const resultado = await comentariosService.obtenerComentariosModerados(filtros, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener comentarios moderados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

module.exports = {
  moderarPublicacion,
  moderarComentario,
  obtenerDenuncias,
  resolverDenuncia,
  obtenerComentariosModerados
};

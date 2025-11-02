const postulacionesService = require('../services/postulacionesService');
const { config } = require('../config');
const Postulacion = require('../models/PostulacionProfesional');
const Usuario = require('../models/Usuario');

/**
 * @desc    Crear una nueva postulación a profesional (sin archivos)
 * @route   POST /api/postulaciones/profesional
 * @access  Private (solo usuarios con rol 'usuario')
 */
const crearPostulacion = async (req, res) => {
  try {
    const usuarioId = req.usuario.userId;

    // aceptar el payload completo
    const {
      nombreCompleto,
      correo,
      telefono,
      ubicacion,
      biografia,
      infoProfesional,
      motivacion,
      experiencia,
      especialidad,
      etiquetas
    } = req.body;

    // Validaciones mínimas
    if (!motivacion || String(motivacion).trim().length < 50) {
      return res.status(400).json({
        error: 'Validación fallida',
        detalles: 'La motivación debe tener al menos 50 caracteres'
      });
    }

    const postulacion = await postulacionesService.crearPostulacion(usuarioId, {
      nombreCompleto,
      correo,
      telefono,
      ubicacion,
      biografia,
      infoProfesional,
      motivacion,
      experiencia,
      especialidad,
      etiquetas
    });

    res.status(201).json({
      mensaje: 'Postulación creada exitosamente. Ahora puedes subir tus documentos',
      postulacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al crear postulación:', error);

    if (error.message.includes('Ya tienes una postulación pendiente')) {
      return res.status(409).json({
        error: 'Postulación duplicada',
        detalles: error.message
      });
    }

    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Error de validación',
        detalles: errores
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Subir documentos a una postulación existente
 * @route   POST /api/postulaciones/profesional/:id/documentos
 * @access  Private (usuario propietario de la postulación)
 */
const subirDocumentos = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    console.log('📤 Subiendo documentos a postulación:', id);
    console.log('📋 Archivos recibidos:', req.files ? req.files.length : 0);

    // Validar que se hayan subido archivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Archivos requeridos',
        detalles: 'Debes adjuntar al menos un archivo'
      });
    }

    const postulacion = await postulacionesService.subirDocumentos(id, usuarioId, req.files);

    res.json({
      mensaje: 'Documentos subidos exitosamente',
      postulacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al subir documentos:', error);

    if (error.message === 'No existe una postulación con el ID proporcionado') {
      return res.status(404).json({
        error: 'Postulación no encontrada',
        detalles: error.message
      });
    }

    if (error.message.includes('No tienes permisos')) {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message.includes('Solo se pueden subir documentos')) {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener todas las postulaciones (con filtros y paginación)
 * @route   GET /api/postulaciones/profesional
 * @access  Private (solo administradores)
 */
const obtenerPostulaciones = async (req, res) => {
  try {
    const { pagina = 1, limite = 10, estado, usuarioId } = req.query;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (usuarioId) filtros.usuarioId = usuarioId;

    const resultado = await postulacionesService.obtenerPostulaciones(
      filtros,
      parseInt(pagina),
      parseInt(limite)
    );

    res.json({
      mensaje: 'Postulaciones obtenidas exitosamente',
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener postulaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener una postulación por ID
 * @route   GET /api/postulaciones/profesional/:id
 * @access  Private (administradores o el usuario que postuló)
 */
const obtenerPostulacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const postulacion = await postulacionesService.obtenerPostulacionPorId(id);

    // Verificar permisos: solo el usuario que postuló o un administrador
    const esAdmin = req.usuario.rol === 'administrador';
    const esPropio = postulacion.usuarioId._id.toString() === req.usuario.userId;

    if (!esAdmin && !esPropio) {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: 'No tienes permisos para ver esta postulación'
      });
    }

    res.json({
      mensaje: 'Postulación obtenida exitosamente',
      postulacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener postulación:', error);

    if (error.message === 'No existe una postulación con el ID proporcionado') {
      return res.status(404).json({
        error: 'Postulación no encontrada',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Aprobar una postulación
 * @route   PATCH /api/postulaciones/profesional/:id/aprobar
 * @access  Private (solo administradores)
 */
const aprobarPostulacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const adminId = req.usuario.userId;

    const resultado = await postulacionesService.aprobarPostulacion(
      id,
      adminId,
      observaciones
    );

    res.json({
      mensaje: 'Postulación aprobada exitosamente. El usuario ahora es profesional',
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al aprobar postulación:', error);

    if (error.message === 'No existe una postulación con el ID proporcionado') {
      return res.status(404).json({
        error: 'Postulación no encontrada',
        detalles: error.message
      });
    }

    if (error.message.includes('Solo se pueden aprobar')) {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    if (error.message.includes('sin documentos adjuntos')) {
      return res.status(400).json({
        error: 'Documentos requeridos',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Rechazar una postulación
 * @route   PATCH /api/postulaciones/profesional/:id/rechazar
 * @access  Private (solo administradores)
 */
const rechazarPostulacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoRechazo } = req.body;
    const adminId = req.usuario.userId;

    if (!motivoRechazo || motivoRechazo.trim().length === 0) {
      return res.status(400).json({
        error: 'Motivo requerido',
        detalles: 'Debes proporcionar un motivo para rechazar la postulación'
      });
    }

    const postulacion = await postulacionesService.rechazarPostulacion(
      id,
      adminId,
      motivoRechazo
    );

    res.json({
      mensaje: 'Postulación rechazada',
      postulacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al rechazar postulación:', error);

    if (error.message === 'No existe una postulación con el ID proporcionado') {
      return res.status(404).json({
        error: 'Postulación no encontrada',
        detalles: error.message
      });
    }

    if (error.message.includes('Solo se pueden rechazar')) {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Eliminar una postulación rechazada
 * @route   DELETE /api/postulaciones/profesional/:id
 * @access  Private (usuario que postuló)
 */
const eliminarPostulacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    await postulacionesService.eliminarPostulacion(id, usuarioId);

    res.json({
      mensaje: 'Postulación eliminada exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al eliminar postulación:', error);

    if (error.message === 'No existe una postulación con el ID proporcionado') {
      return res.status(404).json({
        error: 'Postulación no encontrada',
        detalles: error.message
      });
    }

    if (error.message.includes('No tienes permisos')) {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message.includes('Solo se pueden eliminar')) {
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

/**
 * @desc    Obtener mis postulaciones
 * @route   GET /api/postulaciones/profesional/mis-postulaciones
 * @access  Private
 */
const obtenerMisPostulaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario.userId;
    const { pagina = 1, limite = 10 } = req.query;

    const resultado = await postulacionesService.obtenerPostulaciones(
      { usuarioId },
      parseInt(pagina),
      parseInt(limite)
    );

    res.json({
      mensaje: 'Mis postulaciones obtenidas exitosamente',
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener mis postulaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener estadísticas de postulaciones
 * @route   GET /api/postulaciones/profesional/estadisticas
 * @access  Private (solo administradores)
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await postulacionesService.obtenerEstadisticas();

    res.json({
      mensaje: 'Estadísticas obtenidas exitosamente',
      estadisticas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * ADMIN CONTROLS (usados por rutas /admin dentro de postulaciones)
 * - listPostulaciones
 * - getPostulacionById
 * - decidirPostulacion
 */

/**
 * GET /api/postulaciones/admin
 * Query: estado, q, page, limit
 */
const listPostulaciones = async (req, res) => {
  try {
    const { estado, q, page = 1, limit = 15 } = req.query;
    const pg = Math.max(1, Number(page) || 1);
    const lim = Math.max(1, Math.min(100, Number(limit) || 15));

    const filter = {};
    if (estado) filter.estado = estado;

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      const usuarios = await Usuario.find({
        $or: [{ nombreCompleto: regex }, { correo: regex }]
      }).select('_id');
      const userIds = usuarios.map(u => u._id);

      filter.$or = [
        { usuarioId: { $in: userIds } },
        { motivacion: regex },
        { especialidad: regex }
      ];
    }

    const total = await Postulacion.countDocuments(filter);
    const postulaciones = await Postulacion.find(filter)
      .sort({ createdAt: -1 })
      .skip((pg - 1) * lim)
      .limit(lim)
      .populate('usuarioId', 'nombreCompleto correo fotoPerfil');

    res.json({
      data: postulaciones,
      meta: {
        page: pg,
        limit: lim,
        total,
        pages: Math.ceil(total / lim) || 1
      }
    });
  } catch (err) {
    console.error('Error listPostulaciones:', err);
    res.status(500).json({ error: 'Error listando postulaciones', detalles: err.message });
  }
};

/**
 * GET /api/postulaciones/admin/:id
 */
const getPostulacionById = async (req, res) => {
  try {
    const { id } = req.params;
    const postulacion = await Postulacion.findById(id).populate('usuarioId', '-contraseña');
    if (!postulacion) return res.status(404).json({ error: 'Postulación no encontrada' });
    res.json({ data: postulacion });
  } catch (err) {
    console.error('Error getPostulacionById:', err);
    res.status(500).json({ error: 'Error obteniendo la postulación', detalles: err.message });
  }
};

/**
 * PATCH /api/postulaciones/admin/:id/decidir
 * body: { accion: 'aceptar'|'denegar', motivo?: string }
 */
const decidirPostulacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, motivo } = req.body;
    const adminId = req.usuario.userId;

    const postulacion = await Postulacion.findById(id);
    if (!postulacion) return res.status(404).json({ error: 'Postulación no encontrada' });
    if (postulacion.estado !== 'pendiente') {
      return res.status(400).json({ error: 'La postulación ya fue revisada' });
    }

    if (accion === 'aceptar') {
      // reutilizar el servicio de aprobación
      const resultado = await postulacionesService.aprobarPostulacion(id, adminId, motivo || '');
      return res.json({ message: 'Postulación aprobada', data: resultado });
    }

    if (accion === 'denegar' || accion === 'rechazar') {
      // si requiere motivo, validar aquí (motivo opcional según tu elección)
      if (!motivo || String(motivo).trim().length === 0) {
        // permitir vacío si el flujo lo admite; aquí lo permitimos pero se almacena vacío
        // si quieres forzar motivo, descomenta el siguiente bloque:
        // return res.status(400).json({ error: 'Motivo requerido para denegar' });
      }
      const resultado = await postulacionesService.rechazarPostulacion(id, adminId, motivo || '');
      return res.json({ message: 'Postulación rechazada', data: resultado });
    }

    return res.status(400).json({ error: 'Acción inválida. Usa "aceptar" o "denegar".' });
  } catch (err) {
    console.error('Error decidirPostulacion:', err);
    res.status(500).json({ error: 'Error actualizando estado de la postulación', detalles: err.message });
  }
};

module.exports = {
  crearPostulacion,
  subirDocumentos,
  obtenerPostulaciones,
  obtenerPostulacionPorId,
  aprobarPostulacion,
  rechazarPostulacion,
  eliminarPostulacion,
  obtenerMisPostulaciones,
  obtenerEstadisticas,
  // admin exports
  listPostulaciones,
  getPostulacionById,
  decidirPostulacion
};

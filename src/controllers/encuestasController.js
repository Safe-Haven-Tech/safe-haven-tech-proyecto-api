const encuestasService = require('../services/encuestasService');
const { config } = require('../config');

/**
 * @desc    Crear una nueva encuesta (solo administradores)
 * @route   POST /api/encuestas
 * @access  Private (solo administradores)
 */
const crearEncuesta = async (req, res) => {
  try {
    const { titulo, descripcion, preguntas, categoria, tiempoEstimado } = req.body;
    const usuarioId = req.usuario.userId;

    // Validar campos requeridos
    if (!titulo || !preguntas || !Array.isArray(preguntas) || preguntas.length === 0) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        detalles: 'titulo y preguntas son obligatorios'
      });
    }

    // Validar estructura de preguntas
    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];
      if (!pregunta.enunciado || !pregunta.opciones || !Array.isArray(pregunta.opciones)) {
        return res.status(400).json({
          error: 'Estructura de pregunta inválida',
          detalles: `La pregunta ${i + 1} debe tener enunciado y opciones válidas`
        });
      }
      
      if (pregunta.opciones.length < 2) {
        return res.status(400).json({
          error: 'Opciones insuficientes',
          detalles: `La pregunta "${pregunta.enunciado}" debe tener al menos 2 opciones`
        });
      }
    }

    const datosEncuesta = {
      titulo,
      descripcion,
      preguntas,
      categoria,
      tiempoEstimado,
      creadoPor: usuarioId
    };

    const encuesta = await encuestasService.crearEncuesta(datosEncuesta);

    res.status(201).json({
      mensaje: 'Encuesta creada exitosamente',
      encuesta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al crear encuesta:', error);

    if (error.message === 'Solo los administradores pueden crear encuestas') {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message === 'Las preguntas deben tener orden único') {
      return res.status(400).json({
        error: 'Error de validación',
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
 * @desc    Obtener todas las encuestas activas
 * @route   GET /api/encuestas
 * @access  Public
 */
const obtenerEncuestas = async (req, res) => {
  try {
    const { categoria, busqueda } = req.query;
    const filtros = {};
    
    if (categoria) filtros.categoria = categoria;
    if (busqueda) filtros.busqueda = busqueda;

    const encuestas = await encuestasService.obtenerEncuestas(filtros);

    res.status(200).json({
      mensaje: 'Encuestas obtenidas exitosamente',
      total: encuestas.length,
      encuestas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener encuestas:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener una encuesta por ID
 * @route   GET /api/encuestas/:id
 * @access  Public
 */
const obtenerEncuestaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const encuesta = await encuestasService.obtenerEncuestaPorId(id);

    res.status(200).json({
      mensaje: 'Encuesta obtenida exitosamente',
      encuesta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener encuesta:', error);

    if (error.message === 'Encuesta no encontrada') {
      return res.status(404).json({
        error: 'Encuesta no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'La encuesta no está activa') {
      return res.status(400).json({
        error: 'Encuesta inactiva',
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
 * @desc    Actualizar una encuesta (solo administradores)
 * @route   PUT /api/encuestas/:id
 * @access  Private (solo administradores)
 */
const actualizarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    const usuarioId = req.usuario.userId;

    const encuesta = await encuestasService.actualizarEncuesta(id, datosActualizados, usuarioId);

    res.status(200).json({
      mensaje: 'Encuesta actualizada exitosamente',
      encuesta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al actualizar encuesta:', error);

    if (error.message === 'Solo los administradores pueden actualizar encuestas') {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message === 'Encuesta no encontrada') {
      return res.status(404).json({
        error: 'Encuesta no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'Las preguntas deben tener orden único') {
      return res.status(400).json({
        error: 'Error de validación',
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
 * @desc    Desactivar una encuesta (solo administradores)
 * @route   PUT /api/encuestas/:id/desactivar
 * @access  Private (solo administradores)
 */
const desactivarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    const encuesta = await encuestasService.desactivarEncuesta(id, usuarioId);

    res.status(200).json({
      mensaje: 'Encuesta desactivada exitosamente',
      encuesta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al desactivar encuesta:', error);

    if (error.message === 'Solo los administradores pueden desactivar encuestas') {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message === 'Encuesta no encontrada') {
      return res.status(404).json({
        error: 'Encuesta no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'La encuesta ya está desactivada') {
      return res.status(400).json({
        error: 'Operación no permitida',
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
 * @desc    Activar una encuesta (solo administradores)
 * @route   PUT /api/encuestas/:id/activar
 * @access  Private (solo administradores)
 */
const activarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    const encuesta = await encuestasService.activarEncuesta(id, usuarioId);

    res.status(200).json({
      mensaje: 'Encuesta activada exitosamente',
      encuesta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al activar encuesta:', error);

    if (error.message === 'Solo los administradores pueden activar encuestas') {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message === 'Encuesta no encontrada') {
      return res.status(404).json({
        error: 'Encuesta no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'La encuesta ya está activa') {
      return res.status(400).json({
        error: 'Operación no permitida',
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
 * @desc    Iniciar una encuesta para un usuario
 * @route   POST /api/encuestas/:id/iniciar
 * @access  Private
 */
const iniciarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    const {nuevaRespuesta, esNueva} = await encuestasService.iniciarEncuesta(id, usuarioId);

    if(esNueva){
      res.status(200).json({
        mensaje: 'Encuesta iniciada exitosamente',
          respuesta: nuevaRespuesta,
          timestamp: new Date().toISOString()
        });
    }else{
      res.status(400).json({
        mensaje: 'Encuesta ya iniciada',
        respuesta: nuevaRespuesta,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error al iniciar encuesta:', error);

    if (error.message === 'Encuesta no encontrada') {
      return res.status(404).json({
        error: 'Encuesta no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'La encuesta no está activa') {
      return res.status(400).json({
        error: 'Encuesta inactiva',
        detalles: error.message
      });
    }

    if (error.message === 'Ya has completado esta encuesta') {
      return res.status(400).json({
        error: 'Encuesta ya completada',
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
 * @desc    Guardar respuesta parcial de encuesta
 * @route   PUT /api/encuestas/respuestas/:respuestaId/parcial
 * @access  Private
 */
const guardarRespuestaParcial = async (req, res) => {
  try {
    const { respuestaId } = req.params;
    const { respuestas } = req.body;
    const usuarioId = req.usuario.userId;

    if (!respuestas || !Array.isArray(respuestas)) {
      return res.status(400).json({
        error: 'Campo requerido faltante',
        detalles: 'respuestas debe ser un array válido'
      });
    }

    const respuesta = await encuestasService.guardarRespuestaParcial(respuestaId, respuestas, usuarioId);

    res.status(200).json({
      mensaje: 'Respuesta parcial guardada exitosamente',
      respuesta,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al guardar respuesta parcial:', error);

    if (error.message === 'Respuesta de encuesta no encontrada') {
      return res.status(404).json({
        error: 'Respuesta no encontrada',
        detalles: error.message
      });
    }

    if (error.message.includes('No tienes permisos')) {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message.includes('No se puede modificar')) {
      return res.status(400).json({
        error: 'Operación no permitida',
        detalles: error.message
      });
    }

    if (error.message.includes('es obligatoria')) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes',
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
 * @desc    Completar encuesta
 * @route   PUT /api/encuestas/respuestas/:respuestaId/completar
 * @access  Private
 */
const completarEncuesta = async (req, res) => {
  try {
    const { respuestaId } = req.params;
    const { respuestas } = req.body;
    const usuarioId = req.usuario.userId;

    if (!respuestas || !Array.isArray(respuestas)) {
      return res.status(400).json({
        error: 'Campo requerido faltante',
        detalles: 'respuestas debe ser un array válido'
      });
    }

    const respuesta = await encuestasService.completarEncuesta(respuestaId, respuestas, usuarioId);

    res.status(200).json({
      mensaje: 'Encuesta completada exitosamente',
      respuesta,
      pdfUrl: respuesta.resultadoPDF,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al completar encuesta:', error);

    if (error.message === 'Respuesta de encuesta no encontrada') {
      return res.status(404).json({
        error: 'Respuesta no encontrada',
        detalles: error.message
      });
    }

    if (error.message.includes('No tienes permisos')) {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

    if (error.message.includes('ya está completada')) {
      return res.status(400).json({
        error: 'Encuesta ya completada',
        detalles: error.message
      });
    }

    if (error.message.includes('es obligatoria')) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes',
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
 * @desc    Obtener respuestas de encuesta de un usuario
 * @route   GET /api/encuestas/respuestas/usuario
 * @access  Private
 */
const obtenerRespuestasUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.userId;
    const { estado, encuestaId } = req.query;
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (encuestaId) filtros.encuestaId = encuestaId;

    const respuestas = await encuestasService.obtenerRespuestasUsuario(usuarioId, filtros);

    res.status(200).json({
      mensaje: 'Respuestas obtenidas exitosamente',
      total: respuestas.length,
      respuestas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener respuestas del usuario:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener estadísticas de una encuesta (solo administradores)
 * @route   GET /api/encuestas/:id/estadisticas
 * @access  Private (solo administradores)
 */
const obtenerEstadisticasEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    const estadisticas = await encuestasService.obtenerEstadisticasEncuesta(id, usuarioId);

    res.status(200).json({
      mensaje: 'Estadísticas obtenidas exitosamente',
      encuestaId: id,
      estadisticas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);

    if (error.message === 'Solo los administradores pueden ver estadísticas') {
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

module.exports = {
  crearEncuesta,
  obtenerEncuestas,
  obtenerEncuestaPorId,
  actualizarEncuesta,
  desactivarEncuesta,
  activarEncuesta,
  iniciarEncuesta,
  guardarRespuestaParcial,
  completarEncuesta,
  obtenerRespuestasUsuario,
  obtenerEstadisticasEncuesta
};

const encuestasService = require('../services/encuestasService');
const { generarPDFEncuesta } = require('../utils/pdfGenerator');
const RespuestaEncuesta = require('../models/RespuestaEncuesta');
const { config } = require('../config');

// Función auxiliar para calcular puntajes
const calcularPuntajeRespuesta = (pregunta, respuesta) => {
  if (!pregunta || respuesta === undefined || respuesta === null) {
    return 0;
  }

  // Si las opciones son objetos con valor y puntaje
  if (pregunta.tipo === 'opciones' && Array.isArray(pregunta.opciones)) {
    // Verificar si las opciones son objetos
    if (pregunta.opciones.length > 0 && typeof pregunta.opciones[0] === 'object') {
      const opcion = pregunta.opciones.find(o => o.valor === respuesta);
      return opcion?.puntaje || 0;
    }
    
    // Si las opciones son strings simples, asignar puntaje por índice
    if (pregunta.opciones.length > 0 && typeof pregunta.opciones[0] === 'string') {
      const indice = pregunta.opciones.findIndex(opcion => opcion === respuesta);
      if (indice === -1) return 0;
      
      // Asignar puntajes según el tipo de pregunta
      if (pregunta.tipo === 'escala' || pregunta.categoria === 'Autoestima y autoconcepto') {
        // Para escalas de violencia/riesgo: "Nunca"=0, "Raramente"=1, "A veces"=2, "Frecuentemente"=3, "Siempre"=4
        return indice;
      }
      
      // Para otros tipos, mantener el índice como puntaje
      return indice;
    }
  }

  // Para escalas donde las opciones son strings simples
  if (pregunta.tipo === 'escala' && Array.isArray(pregunta.opciones)) {
    if (typeof pregunta.opciones[0] === 'string') {
      const indice = pregunta.opciones.findIndex(opcion => opcion === respuesta);
      return indice >= 0 ? indice : 0;
    }
  }

  // Para preguntas de texto libre u otros tipos
  return 0;
};

// Función auxiliar para calcular rangos dinámicos basados en el número de preguntas
const calcularRangosDinamicos = (totalPreguntas, maxPuntajePorPregunta = 4) => {
  const puntajeMaximo = totalPreguntas * maxPuntajePorPregunta;
  
  // Calcular rangos como porcentajes del puntaje máximo
  const rangoMedio = Math.ceil(puntajeMaximo * 0.25);    // 25% del máximo
  const rangoAlto = Math.ceil(puntajeMaximo * 0.50);     // 50% del máximo  
  const rangoCritico = Math.ceil(puntajeMaximo * 0.75);  // 75% del máximo
  
  return {
    medio: rangoMedio,
    alto: rangoAlto,
    critico: rangoCritico,
    maximo: puntajeMaximo
  };
};

// Función auxiliar para determinar nivel de riesgo
const determinarNivelRiesgo = (puntaje, encuesta) => {
  // Si la encuesta tiene rangos definidos, usarlos
  if (encuesta.riesgoCritico || encuesta.riesgoAlto || encuesta.riesgoMedio) {
    if (encuesta.riesgoCritico && puntaje >= encuesta.riesgoCritico) return 'crítico';
    if (encuesta.riesgoAlto && puntaje >= encuesta.riesgoAlto) return 'alto';
    if (encuesta.riesgoMedio && puntaje >= encuesta.riesgoMedio) return 'medio';
    return 'bajo';
  }
  
  // Si no hay rangos definidos, calcular dinámicamente
  const totalPreguntas = encuesta.preguntas ? encuesta.preguntas.length : 0;
  if (totalPreguntas === 0) return 'bajo';
  
  const rangos = calcularRangosDinamicos(totalPreguntas);
  
  if (puntaje >= rangos.critico) return 'crítico';
  if (puntaje >= rangos.alto) return 'alto';
  if (puntaje >= rangos.medio) return 'medio';
  return 'bajo';
};

/**
 * @desc    Crear una nueva encuesta (solo administradores)
 * @route   POST /api/encuestas
 * @access  Private (solo administradores)
 */
const crearEncuesta = async (req, res) => {
  try {
    const { titulo, descripcion, preguntas, categoria, tiempoEstimado, recomendacionesPorNivel } = req.body;
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
      creadoPor: usuarioId,
      recomendacionesPorNivel: recomendacionesPorNivel || []
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
    const { categoria, busqueda, activa } = req.query; 
    const filtros = {};
    if (categoria) filtros.categoria = categoria;
    if (busqueda) filtros.busqueda = busqueda;
    if (activa !== undefined) filtros.activa = activa; 

    const resultado = await encuestasService.obtenerEncuestas(filtros);

    res.status(200).json({
      mensaje: 'Encuestas obtenidas exitosamente',
      total: resultado.encuestas.length,
      encuestas: resultado.encuestas,
      paginacion: resultado.paginacion,
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
    
    console.log('📝 Actualizando encuesta:', id);
    console.log('📊 Niveles a actualizar:', datosActualizados.recomendacionesPorNivel?.length || 0);

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
 * @desc    Eliminar una encuesta (solo administradores)
 * @route   DELETE /api/encuestas/:id
 * @access  Private (solo administradores)
 */
const eliminarEncuesta = async (req, res) => {
  try {
    const { id } = req.params;
    await encuestasService.eliminarEncuesta(id);
    res.status(200).json({ mensaje: 'Encuesta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar la encuesta', error: error.message });
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
 * @desc    Completar encuesta directamente (sin iniciar antes)
 * @route   POST /api/encuestas/:id/completar
 * @route   POST /api/encuestas/:id/completar-sin-auth
 * @access  Public / Private
 */
const completarEncuestaDirecta = async (req, res) => {
  try {
    const { id: encuestaId } = req.params;
    const { respuestas } = req.body;
    const usuarioId = req.usuario?.userId || null;

    if (!respuestas || !Array.isArray(respuestas)) {
      return res.status(400).json({
        error: 'Campo requerido faltante',
        detalles: 'respuestas debe ser un array válido'
      });
    }

    // Verificar que la encuesta existe y está activa
    const encuesta = await encuestasService.obtenerEncuestaPorId(encuestaId);
    if (!encuesta) {
      return res.status(404).json({
        error: 'Encuesta no encontrada'
      });
    }

    // Iniciar y completar en un solo paso
    const { nuevaRespuesta } = await encuestasService.iniciarEncuesta(encuestaId, usuarioId);
    
    if (!nuevaRespuesta || !nuevaRespuesta._id) {
      throw new Error('Error al iniciar la encuesta');
    }
    
    const { respuesta: respuestaCompletada, pdfBuffer } = await encuestasService.completarEncuesta(
      nuevaRespuesta._id.toString(),
      respuestas,
      usuarioId
    );

    // Devolver la URL de Cloudinary para que el frontend abra el PDF desde ahí
    res.status(200).json({
      mensaje: 'Encuesta completada exitosamente',
      pdfUrl: respuestaCompletada.resultadoPDF, // URL de Cloudinary
      respuesta: {
        id: respuestaCompletada._id,
        puntajeTotal: respuestaCompletada.puntajeTotal,
        nivelRiesgo: respuestaCompletada.nivelRiesgo,
        recomendaciones: respuestaCompletada.recomendaciones
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al completar encuesta directa:', error);
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
    const { id } = req.params; // encuestaId
    const { respuestas } = req.body;
    const usuarioId = req.usuario?.userId || null;

    // Validación de input
    if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json({ 
        error: 'Campo requerido faltante', 
        detalles: 'respuestas debe ser un array válido y no vacío' 
      });
    }

    // Obtener encuesta
    const encuesta = await encuestasService.obtenerEncuestaPorId(id);
    if (!encuesta) {
      return res.status(404).json({ 
        error: 'Encuesta no encontrada', 
        detalles: `No se encontró la encuesta con ID ${id}` 
      });
    }

    if (!encuesta.preguntas || encuesta.preguntas.length === 0) {
      return res.status(400).json({
        error: 'Encuesta inválida',
        detalles: 'La encuesta no tiene preguntas definidas'
      });
    }

    // Completar respuestas con tipo, enunciado y puntaje
    const respuestasCompletas = respuestas.map(r => {
      const pregunta = encuesta.preguntas.find(p => p.orden === r.preguntaOrden);
      if (!pregunta) {
        throw new Error(`Pregunta con orden ${r.preguntaOrden} no encontrada`);
      }

      const puntaje = calcularPuntajeRespuesta(pregunta, r.respuesta);

      return { 
        ...r, 
        preguntaTipo: pregunta.tipo, 
        preguntaEnunciado: pregunta.enunciado, 
        puntaje 
      };
    });

    // Validar preguntas obligatorias
    const preguntasObligatorias = encuesta.preguntas.filter(p => p.obligatoria);
    for (const pregunta of preguntasObligatorias) {
      const r = respuestasCompletas.find(x => x.preguntaOrden === pregunta.orden);
      if (!r || r.respuesta === undefined || r.respuesta === '' || (Array.isArray(r.respuesta) && r.respuesta.length === 0)) {
        return res.status(400).json({
          error: 'Campos obligatorios faltantes',
          detalles: `La pregunta "${pregunta.enunciado}" es obligatoria`
        });
      }
    }

    // Calcular puntaje total y nivel de riesgo
    const puntajeTotal = respuestasCompletas.reduce((acc, r) => acc + (r.puntaje || 0), 0);

    // Determinar nivel de riesgo usando rangos dinámicos o predefinidos
    const nivelRiesgo = determinarNivelRiesgo(puntajeTotal, encuesta);

    // Generar recomendaciones
    const recomendaciones = encuestasService.generarRecomendaciones
      ? encuestasService.generarRecomendaciones(puntajeTotal, nivelRiesgo, encuesta)
      : [];

    const respuestaFinal = { 
      respuestas: respuestasCompletas, 
      fechaCompletado: new Date(), 
      puntajeTotal, 
      nivelRiesgo, 
      recomendaciones 
    };

    // Guardar en BD solo si el usuario está autenticado
    if (usuarioId) {
      const nuevaRespuesta = new RespuestaEncuesta({ 
        usuarioId, 
        encuestaId: id, 
        ...respuestaFinal, 
        estado: 'completada' 
      });
      await nuevaRespuesta.save({ validateBeforeSave: false });
    }

    // Generar PDF
    if (!encuesta.titulo) {
      return res.status(500).json({
        error: 'Error interno',
        detalles: 'Encuesta inválida para generar PDF'
      });
    }

    const pdfBuffer = await generarPDFEncuesta(respuestaFinal, encuesta);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Encuesta_${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al completar encuesta unificada:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error interno del servidor', 
        detalles: error.message 
      });
    }
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

/**
 * @desc    Completar encuesta sin autenticación (generar PDF sin guardar en BD)
 * @route   POST /api/encuestas/:id/completar-sin-auth
 * @access  Public
 */
const completarEncuestaSinAuth = async (req, res) => {
  try {
    const { id } = req.params; // id de la encuesta
    const { respuestas } = req.body;

    if (!respuestas || !Array.isArray(respuestas)) {
      return res.status(400).json({
        error: 'Campo requerido faltante',
        detalles: 'respuestas debe ser un array válido'
      });
    }

    // Obtener encuesta
    const encuesta = await encuestasService.obtenerEncuestaPorId(id);

    // Completar cada respuesta con tipo, enunciado y puntaje
    const respuestasCompletas = respuestas.map(r => {
      const pregunta = encuesta.preguntas.find(p => p.orden === r.preguntaOrden);
      if (!pregunta) {
        throw new Error(`Pregunta con orden ${r.preguntaOrden} no encontrada en la encuesta`);
      }

      // Asignar puntaje usando la nueva función
      const puntaje = calcularPuntajeRespuesta(pregunta, r.respuesta);

      return {
        ...r,
        preguntaTipo: pregunta.tipo,
        preguntaEnunciado: pregunta.enunciado,
        puntaje
      };
    });

    // Validar preguntas obligatorias
    const preguntasObligatorias = encuesta.preguntas.filter(p => p.obligatoria);
    for (const pregunta of preguntasObligatorias) {
      const r = respuestasCompletas.find(x => x.preguntaOrden === pregunta.orden);
      if (!r || r.respuesta === undefined || r.respuesta === '' || (Array.isArray(r.respuesta) && r.respuesta.length === 0)) {
        return res.status(400).json({
          error: 'Campos obligatorios faltantes',
          detalles: `La pregunta "${pregunta.enunciado}" es obligatoria`
        });
      }
    }

    // Calcular puntaje total
    const puntajeTotal = respuestasCompletas.reduce((acc, r) => acc + (r.puntaje || 0), 0);

    // Determinar nivel de riesgo usando rangos dinámicos o predefinidos
    const nivelRiesgo = determinarNivelRiesgo(puntajeTotal, encuesta);

    // Generar recomendaciones
    const recomendaciones = encuestasService.generarRecomendaciones
      ? encuestasService.generarRecomendaciones(puntajeTotal, nivelRiesgo, encuesta)
      : [];

    // Crear objeto temporal para PDF
    const respuestaTemporal = {
      respuestas: respuestasCompletas,
      fechaCompletado: new Date(),
      puntajeTotal,
      nivelRiesgo,
      recomendaciones
    };

    // Generar PDF
    const pdfBuffer = await generarPDFEncuesta(respuestaTemporal, encuesta);

    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Encuesta_${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al completar encuesta sin auth:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Error interno del servidor',
        detalles: error.message
      });
    }
  }
};



module.exports = {
  crearEncuesta,
  obtenerEncuestas,
  obtenerEncuestaPorId,
  actualizarEncuesta,
  desactivarEncuesta,
  eliminarEncuesta,
  activarEncuesta,
  completarEncuesta,
  completarEncuestaDirecta,
  obtenerRespuestasUsuario,
  obtenerEstadisticasEncuesta,
  completarEncuestaSinAuth,
};
const Encuesta = require('../models/Encuesta');
const RespuestaEncuesta = require('../models/RespuestaEncuesta');
const Usuario = require('../models/Usuario');
const { cloudinary } = require('../config/cloudinary');
const { generarPDFEncuesta, generarPDFEstadisticas} = require('../utils/pdfGenerator');
const { configurarCloudinary, verificarConexion } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Crear una nueva encuesta
 * @param   {Object} datosEncuesta - Datos de la encuesta
 * @returns {Object} Encuesta creada
 */
const crearEncuesta = async (datosEncuesta) => {
  try {
    // Validar que el usuario sea administrador
    const usuario = await Usuario.findById(datosEncuesta.creadoPor);
    if (!usuario || usuario.rol !== 'administrador') {
      throw new Error('Solo los administradores pueden crear encuestas');
    }

    // Validar que las preguntas tengan orden único
    const ordenes = datosEncuesta.preguntas.map(p => p.orden);
    const ordenesUnicos = [...new Set(ordenes)];
    if (ordenes.length !== ordenesUnicos.length) {
      throw new Error('Las preguntas deben tener orden único');
    }

    // Ordenar preguntas por orden
    datosEncuesta.preguntas.sort((a, b) => a.orden - b.orden);

    const encuesta = new Encuesta(datosEncuesta);
    await encuesta.save();

    return encuesta;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Obtener todas las encuestas activas
 * @param   {Object} filtros - Filtros de búsqueda
 * @returns {Array} Lista de encuestas
 */
const obtenerEncuestas = async (filtros = {}) => {
  try {
    const query = { activa: true };
    
    if (filtros.categoria) {
      query.categoria = filtros.categoria;
    }
    
    if (filtros.busqueda) {
      query.$or = [
        { titulo: { $regex: filtros.busqueda, $options: 'i' } },
        { descripcion: { $regex: filtros.busqueda, $options: 'i' } }
      ];
    }

    const encuestas = await Encuesta.find(query)
      .populate('creadoPor', 'nombreCompleto nombreUsuario')
      .sort({ fechaCreacion: -1 });

    return encuestas;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Obtener una encuesta por ID
 * @param   {string} encuestaId - ID de la encuesta
 * @returns {Object} Encuesta encontrada
 */
const obtenerEncuestaPorId = async (encuestaId) => {
  try {
    const encuesta = await Encuesta.findById(encuestaId)
      .populate('creadoPor', 'nombreCompleto nombreUsuario');
    
    if (!encuesta) {
      throw new Error('Encuesta no encontrada');
    }

    if (!encuesta.activa) {
      throw new Error('La encuesta no está activa');
    }

    return encuesta;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Actualizar una encuesta
 * @param   {string} encuestaId - ID de la encuesta
 * @param   {Object} datosActualizados - Datos a actualizar
 * @param   {string} usuarioId - ID del usuario que actualiza
 * @returns {Object} Encuesta actualizada
 */
const actualizarEncuesta = async (encuestaId, datosActualizados, usuarioId) => {
  try {
    // Validar que el usuario sea administrador
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario || usuario.rol !== 'administrador') {
      throw new Error('Solo los administradores pueden actualizar encuestas');
    }

    // Validar que la encuesta exista
    const encuesta = await Encuesta.findById(encuestaId);
    if (!encuesta) {
      throw new Error('Encuesta no encontrada');
    }

    // Si se actualizan las preguntas, validar orden único
    if (datosActualizados.preguntas) {
      const ordenes = datosActualizados.preguntas.map(p => p.orden);
      const ordenesUnicos = [...new Set(ordenes)];
      if (ordenes.length !== ordenesUnicos.length) {
        throw new Error('Las preguntas deben tener orden único');
      }
      
      // Ordenar preguntas por orden
      datosActualizados.preguntas.sort((a, b) => a.orden - b.orden);
    }

    const encuestaActualizada = await Encuesta.findByIdAndUpdate(
      encuestaId,
      { ...datosActualizados, fechaModificacion: new Date() },
      { new: true, runValidators: true }
    );

    return encuestaActualizada;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Desactivar una encuesta
 * @param   {string} encuestaId - ID de la encuesta
 * @param   {string} usuarioId - ID del usuario que desactiva
 * @returns {Object} Encuesta desactivada
 */
const desactivarEncuesta = async (encuestaId, usuarioId) => {
  try {
    // Validar que el usuario sea administrador
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario || usuario.rol !== 'administrador') {
      throw new Error('Solo los administradores pueden desactivar encuestas');
    }

    // Validar que la encuesta exista
    const encuesta = await Encuesta.findById(encuestaId);
    if (!encuesta) {
      throw new Error('Encuesta no encontrada');
    }

    // Verificar que no esté ya desactivada
    if (!encuesta.activa) {
      throw new Error('La encuesta ya está desactivada');
    }

    // Desactivar la encuesta
    const encuestaDesactivada = await Encuesta.findByIdAndUpdate(
      encuestaId,
      { activa: false, fechaModificacion: new Date() },
      { new: true }
    );

    console.log(`✅ Encuesta "${encuesta.titulo}" desactivada por ${usuario.nombreCompleto}`);
    return encuestaDesactivada;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Activar una encuesta
 * @param   {string} encuestaId - ID de la encuesta
 * @param   {string} usuarioId - ID del usuario que activa
 * @returns {Object} Encuesta activada
 */
const activarEncuesta = async (encuestaId, usuarioId) => {
  try {
    // Validar que el usuario sea administrador
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario || usuario.rol !== 'administrador') {
      throw new Error('Solo los administradores pueden activar encuestas');
    }

    // Validar que la encuesta exista
    const encuesta = await Encuesta.findById(encuestaId);
    if (!encuesta) {
      throw new Error('Encuesta no encontrada');
    }

    // Verificar que no esté ya activa
    if (encuesta.activa) {
      throw new Error('La encuesta ya está activa');
    }

    // Activar la encuesta
    const encuestaActivada = await Encuesta.findByIdAndUpdate(
      encuestaId,
      { activa: true, fechaModificacion: new Date() },
      { new: true }
    );

    console.log(`✅ Encuesta "${encuesta.titulo}" activada por ${usuario.nombreCompleto}`);
    return encuestaActivada;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Iniciar una encuesta para un usuario
 * @param   {string} encuestaId - ID de la encuesta
 * @param   {string} usuarioId - ID del usuario
 * @returns {Object} Respuesta de encuesta iniciada
 */
const iniciarEncuesta = async (encuestaId, usuarioId) => {
  try {
    // Validar que la encuesta exista y esté activa
    const encuesta = await obtenerEncuestaPorId(encuestaId);
    
    // Verificar si ya existe una respuesta en progreso (solo para usuarios autenticados)
    if (usuarioId) {
      const respuestaExistente = await RespuestaEncuesta.findOne({
        usuarioId,
        encuestaId,
        estado: { $in: ['en_progreso', 'completada'] }
      });

      if (respuestaExistente) {
        if (respuestaExistente.estado === 'en_progreso') {
          return {nuevaRespuesta: respuestaExistente, esNueva: false}; // Retornar la respuesta en progreso
        }
      }
    }

    // Crear una nueva respuesta de encuesta
    const nuevaRespuesta = new RespuestaEncuesta({
      usuarioId,
      encuestaId,
      copiaEncuesta: {
        titulo: encuesta.titulo,
        descripcion: encuesta.descripcion,
        categoria: encuesta.categoria,
        version: encuesta.version,
        preguntas: encuesta.preguntas
      },
      estado: 'en_progreso'
    });

    await nuevaRespuesta.save();

    return {nuevaRespuesta, esNueva: true};
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Guardar respuesta parcial de encuesta
 * @param   {string} respuestaId - ID de la respuesta
 * @param   {Array} respuestas - Array de respuestas
 * @param   {string} usuarioId - ID del usuario
 * @returns {Object} Respuesta actualizada
 */
const guardarRespuestaParcial = async (respuestaId, respuestas, usuarioId) => {
  try {
    const respuesta = await RespuestaEncuesta.findById(respuestaId);
    
    if (!respuesta) {
      throw new Error('Respuesta de encuesta no encontrada');
    }

    if (respuesta.usuarioId.toString() !== usuarioId) {
      throw new Error('No tienes permisos para modificar esta respuesta');
    }

    if (respuesta.estado === 'completada') {
      throw new Error('No se puede modificar una encuesta ya completada');
    }

    // Validar que las respuestas correspondan a las preguntas
    const encuesta = await obtenerEncuestaPorId(respuesta.encuestaId);
    const preguntasObligatorias = encuesta.preguntas.filter(p => p.obligatoria);
    
    for (const pregunta of preguntasObligatorias) {
      const respuestaEncontrada = respuestas.find(r => r.preguntaOrden === pregunta.orden);
      if (!respuestaEncontrada || !respuestaEncontrada.respuesta) {
        throw new Error(`La pregunta "${pregunta.enunciado}" es obligatoria`);
      }
    }

    // Actualizar respuestas
    respuesta.respuestas = respuestas;
    respuesta.fechaModificacion = new Date();
    
    await respuesta.save();

    return respuesta;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Completar encuesta
 * @param   {string} respuestaId - ID de la respuesta
 * @param   {Array} respuestas - Array de respuestas finales
 * @param   {string} usuarioId - ID del usuario
 * @returns {Object} Respuesta completada con PDF
 */
const completarEncuesta = async (respuestaId, respuestas, usuarioId) => {
  try {
    const respuesta = await RespuestaEncuesta.findById(respuestaId);
    
    if (!respuesta) {
      throw new Error('Respuesta de encuesta no encontrada');
    }

    // Validar permisos (solo si hay usuario autenticado)
    if (usuarioId && respuesta.usuarioId) {
      if (respuesta.usuarioId.toString() !== usuarioId.toString()) {
        throw new Error('No tienes permisos para completar esta respuesta');
      }
    }

    if (respuesta.estado === 'completada') {
      throw new Error('La encuesta ya está completada');
    }

    // Validar respuestas obligatorias
    const encuesta = await obtenerEncuestaPorId(respuesta.encuestaId);
    const preguntasObligatorias = encuesta.preguntas.filter(p => p.obligatoria);
    
    for (const pregunta of preguntasObligatorias) {
      const respuestaEncontrada = respuestas.find(r => r.preguntaOrden === pregunta.orden);
      if (!respuestaEncontrada || !respuestaEncontrada.respuesta) {
        throw new Error(`La pregunta "${pregunta.enunciado}" es obligatoria`);
      }
    }

    // Enriquecer respuestas con información de las preguntas
    const respuestasEnriquecidas = respuestas.map(resp => {
      const pregunta = encuesta.preguntas.find(p => p.orden === resp.preguntaOrden);
      return {
        preguntaOrden: resp.preguntaOrden,
        respuesta: resp.respuesta,
        preguntaEnunciado: pregunta?.enunciado || '',
        preguntaTipo: pregunta?.tipo || 'escala',
        preguntaOpciones: pregunta?.opciones || []
      };
    });

    respuesta.respuestas = respuestasEnriquecidas;
    await respuesta.marcarCompletada(encuesta);

    // Generar PDF con los resultados
    const pdfBuffer = await generarPDFEncuesta(respuesta, encuesta);
    const pdfUrl = await subirPDFCloudinary(pdfBuffer, `encuesta_${respuestaId}`);
    respuesta.resultadoPDF = pdfUrl;

    await respuesta.save();

    // Devolver la respuesta junto con el buffer del PDF
    return { respuesta, pdfBuffer };
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Obtener respuestas de encuesta de un usuario
 * @param   {string} usuarioId - ID del usuario
 * @param   {Object} filtros - Filtros adicionales
 * @returns {Array} Lista de respuestas
 */
const obtenerRespuestasUsuario = async (usuarioId, filtros = {}) => {
  try {
    const query = { usuarioId };
    
    if (filtros.estado) {
      query.estado = filtros.estado;
    }
    
    if (filtros.encuestaId) {
      query.encuestaId = filtros.encuestaId;
    }

    const respuestas = await RespuestaEncuesta.find(query)
      .populate('encuestaId', 'titulo descripcion categoria')
      .sort({ fecha: -1 });

    return respuestas;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Obtener estadísticas de una encuesta (solo administradores)
 * @param   {string} encuestaId - ID de la encuesta
 * @param   {string} usuarioId - ID del usuario administrador
 * @returns {Object} Estadísticas de la encuesta
 */
const obtenerEstadisticasEncuesta = async (encuestaId, usuarioId) => {
  try {
    // Validar que el usuario sea administrador
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario || usuario.rol !== 'administrador') {
      throw new Error('Solo los administradores pueden ver estadísticas');
    }

    const encuesta = await obtenerEncuestaPorId(encuestaId);

    if(!encuesta){
      throw new Error('Encuesta no encontrada');
    }

    const respuestas = await RespuestaEncuesta.find({
      encuestaId,
      estado: 'completada'
    });

    const estadisticas = {
      totalRespuestas: respuestas.length,
      promedioPuntaje: 0,
      distribucionRiesgo: {
        bajo: 0,
        medio: 0,
        alto: 0,
        crítico: 0
      },
      tiempoPromedio: 0,
      fechaPrimeraRespuesta: null,
      fechaUltimaRespuesta: null
    };

    if (respuestas.length > 0) {
      let puntajeTotal = 0;
      let tiempoTotal = 0;
      let fechas = [];

      respuestas.forEach(respuesta => {
        puntajeTotal += respuesta.puntajeTotal || 0;
        tiempoTotal += respuesta.tiempoCompletado || 0;
        fechas.push(respuesta.fechaCompletado);
        
        if (respuesta.nivelRiesgo) {
          estadisticas.distribucionRiesgo[respuesta.nivelRiesgo]++;
        }
      });

      estadisticas.promedioPuntaje = puntajeTotal / respuestas.length;
      estadisticas.tiempoPromedio = tiempoTotal / respuestas.length;
      estadisticas.fechaPrimeraRespuesta = Math.min(...fechas);
      estadisticas.fechaUltimaRespuesta = Math.max(...fechas);
    }


    const pdfBuffer = await generarPDFEstadisticas(estadisticas, encuesta);
    const pdfUrl = await subirPDFCloudinary(pdfBuffer, `estadisticas_${encuestaId}`);
    estadisticas.pdfUrl = pdfUrl;

    return estadisticas;
  } catch (error) {
    throw error;
  }
};

/**
 * @desc    Subir PDF a Cloudinary (función auxiliar)
 * @param   {Buffer} pdfBuffer - Buffer del PDF
 * @param   {string} nombreArchivo - Nombre del archivo
 * @returns {string} URL del PDF subido
 */
const subirPDFCloudinary = async (pdfBuffer, nombreArchivo) => {
  try {
    // Verificar si Cloudinary está configurado
    if (!configurarCloudinary()) {
      throw new Error('Cloudinary no está configurado correctamente');
    }

    // Verificar conexión
    const conexionOk = await verificarConexion();
    if (!conexionOk) {
      throw new Error('No se puede conectar con Cloudinary');
    }

    // Generar nombre único para el archivo
    const tempPath = path.join(__dirname, `../tmp/${nombreArchivo}`);
    fs.writeFileSync(tempPath, pdfBuffer);

    const fecha = new Date();
    const formato = fecha.toLocaleDateString("es-CL").replace(/\//g, "-"); 
    
    // Subir a Cloudinary (configuración original que funcionaba)
    const resultado = await cloudinary.uploader.upload(tempPath, {
      resource_type: 'auto',
      folder: 'safehaven/encuestas',
      public_id: `${nombreArchivo}_${formato}`,
      format: 'pdf'
    });

    console.log(`✅ PDF subido a Cloudinary: ${resultado.secure_url}`);
    console.log(`   📁 Carpeta: safehaven/encuestas`);
    console.log(`   🏷️ Public ID: ${resultado.public_id}`);
    console.log(`   📊 Tamaño: ${(resultado.bytes / 1024).toFixed(2)} KB`);

    fs.unlinkSync(tempPath);
    
    return resultado.secure_url;
    
  } catch (error) {
    console.error('❌ Error al subir PDF a Cloudinary:', error);
    
    // Si falla Cloudinary, generar URL local como fallback
    console.warn('⚠️ Generando URL local como fallback');
    return `http://localhost:3000/api/encuestas/pdf/${nombreArchivo}`;
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

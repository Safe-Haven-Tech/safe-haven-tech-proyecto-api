const mongoose = require('mongoose');
const PostulacionProfesional = require('../models/PostulacionProfesional');
const Usuario = require('../models/Usuario');
const { subirArchivoPostulacion, eliminarArchivosPostulacion } = require('../utils/cloudinaryPostulaciones');

/**
 * Servicio para el manejo de postulaciones a profesional
 */
class PostulacionesService {

  /**
   * Crear una nueva postulación (sin archivos)
   * @param {String} usuarioId - ID del usuario que postula
   * @param {Object} datos - Datos de la postulación (motivacion, experiencia, especialidad)
   * @returns {Object} Postulación creada
   */
async crearPostulacion(usuarioId, datos) {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) throw new Error('No existe un usuario con el ID proporcionado');

  if (usuario.rol === 'profesional') {
    throw new Error('No puedes postularte si ya eres un profesional');
  }

  const postulacionPendiente = await PostulacionProfesional.findOne({
    usuarioId,
    estado: 'pendiente'
  });

  if (postulacionPendiente) {
    throw new Error('Ya tienes una postulación pendiente. Espera a que sea revisada');
  }

  // normalizar campos entrantes
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
  } = datos || {};

  const postulacion = new PostulacionProfesional({
    usuarioId,
    nombreCompleto: nombreCompleto || usuario.nombreCompleto || usuario.nombreUsuario || '',
    correo: correo || usuario.correo || '',
    telefono: telefono || usuario.telefono || '',
    ubicacion: ubicacion || {},
    biografia: biografia || '',
    infoProfesional: infoProfesional || {},
    motivacion: motivacion || '',
    experiencia: experiencia || '',
    especialidad: especialidad || '',
    etiquetas: Array.isArray(etiquetas) ? etiquetas : (etiquetas ? String(etiquetas).split(',').map(s => s.trim()).filter(Boolean) : []),
    archivos: [],
    estado: 'pendiente'
  });

  await postulacion.save();
  await postulacion.populate('usuarioId', 'nombreCompleto correo nombreUsuario fotoPerfil');

  console.log(`✅ Postulación creada exitosamente para usuario: ${usuario.correo}`);
  return postulacion;
}

  /**
   * Subir documentos a una postulación existente
   * @param {String} postulacionId - ID de la postulación
   * @param {String} usuarioId - ID del usuario que sube los archivos
   * @param {Array} archivos - Archivos subidos (multer)
   * @returns {Object} Postulación actualizada
   */
  async subirDocumentos(postulacionId, usuarioId, archivos) {
    const postulacion = await PostulacionProfesional.findById(postulacionId);
    if (!postulacion) throw new Error('No existe una postulación con el ID proporcionado');

    if (postulacion.usuarioId.toString() !== usuarioId) {
      throw new Error('No tienes permisos para subir documentos a esta postulación');
    }

    if (postulacion.estado !== 'pendiente') {
      throw new Error('Solo se pueden subir documentos a postulaciones pendientes');
    }

    if (!archivos || archivos.length === 0) {
      throw new Error('Debes adjuntar al menos un archivo');
    }

    if (postulacion.archivos && postulacion.archivos.length > 0) {
      console.log(`🗑️ Eliminando ${postulacion.archivos.length} archivos anteriores`);
      await eliminarArchivosPostulacion(postulacion.archivos);
    }

    const archivosSubidos = [];
    try {
      for (const archivo of archivos) {
        const tipoArchivo = 'otro';
        const { url, publicId } = await subirArchivoPostulacion(
          archivo.path,
          usuarioId,
          tipoArchivo
        );

        archivosSubidos.push({
          tipo: tipoArchivo,
          nombre: archivo.originalname,
          url,
          publicId
        });
      }
    } catch (error) {
      if (archivosSubidos.length > 0) {
        await eliminarArchivosPostulacion(archivosSubidos);
      }
      throw new Error(`Error al procesar archivos: ${error.message}`);
    }

    postulacion.archivos = archivosSubidos;
    await postulacion.save();
    await postulacion.populate('usuarioId', 'nombreCompleto correo nombreUsuario');

    console.log(`✅ ${archivosSubidos.length} documentos subidos a postulación ${postulacionId}`);
    return postulacion;
  }

  /**
   * Obtener todas las postulaciones con filtros
   * @param {Object} filtros - Filtros de búsqueda
   * @param {Number} pagina - Número de página
   * @param {Number} limite - Límite de resultados por página
   * @returns {Object} Lista de postulaciones y paginación
   */
  async obtenerPostulaciones(filtros = {}, pagina = 1, limite = 10) {
    const query = {};
    if (filtros.estado) query.estado = filtros.estado;
    if (filtros.usuarioId) query.usuarioId = filtros.usuarioId;

    const skip = (pagina - 1) * limite;

    const postulaciones = await PostulacionProfesional.find(query)
      .populate('usuarioId', 'nombreCompleto correo nombreUsuario fotoPerfil')
      .populate('revisadoPor', 'nombreCompleto correo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limite);

    const total = await PostulacionProfesional.countDocuments(query);

    return {
      postulaciones,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        totalPaginas: Math.ceil(total / limite)
      }
    };
  }

  /**
   * Obtener una postulación por ID
   * @param {String} postulacionId - ID de la postulación
   * @returns {Object} Postulación encontrada
   */
  async obtenerPostulacionPorId(postulacionId) {
    const postulacion = await PostulacionProfesional.findById(postulacionId)
      .populate('usuarioId', 'nombreCompleto correo nombreUsuario fotoPerfil fechaNacimiento genero')
      .populate('revisadoPor', 'nombreCompleto correo');

    if (!postulacion) throw new Error('No existe una postulación con el ID proporcionado');

    return postulacion;
  }

  /**
   * Aprobar una postulación (transaccional)
   * @param {String} postulacionId
   * @param {String} adminId
   * @param {String} observaciones
   * @returns {Object} { postulacion, usuario }
   */
  async aprobarPostulacion(postulacionId, adminId, observaciones = '') {
    const session = await mongoose.startSession();
    let resultado = null;

    try {
      await session.withTransaction(async () => {
        const postulacion = await PostulacionProfesional.findById(postulacionId).session(session);
        if (!postulacion) throw new Error('No existe una postulación con el ID proporcionado');
        if (postulacion.estado !== 'pendiente') throw new Error('Solo se pueden aprobar postulaciones pendientes');
        if (!postulacion.archivos || postulacion.archivos.length === 0) {
          throw new Error('No se puede aprobar una postulación sin documentos adjuntos');
        }

        postulacion.estado = 'aprobada';
        postulacion.revisadoPor = adminId;
        postulacion.fechaRevision = new Date();
        postulacion.observaciones = observaciones;
        await postulacion.save({ session });

        const usuario = await Usuario.findByIdAndUpdate(
          postulacion.usuarioId,
          { rol: 'profesional' },
          { new: true, session }
        ).select('-contraseña');

        // poblar usuario en postulacion para retorno limpio
        await postulacion.populate('usuarioId', 'nombreCompleto correo nombreUsuario');

        resultado = { postulacion, usuario };
        console.log(`✅ Postulación aprobada (id=${postulacionId}). Usuario ${usuario?.correo || postulacion.usuarioId} actualizado a 'profesional'`);
      });

      return resultado;
    } catch (err) {
      console.error('Error en aprobarPostulacion (transaction):', err);
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Rechazar una postulación (transaccional)
   * @param {String} postulacionId
   * @param {String} adminId
   * @param {String} motivoRechazo
   * @returns {Object} postulacion rechazada
   */
  async rechazarPostulacion(postulacionId, adminId, motivoRechazo) {
    const session = await mongoose.startSession();
    try {
      let returned = null;
      await session.withTransaction(async () => {
        const postulacion = await PostulacionProfesional.findById(postulacionId).session(session);
        if (!postulacion) throw new Error('No existe una postulación con el ID proporcionado');
        if (postulacion.estado !== 'pendiente') throw new Error('Solo se pueden rechazar postulaciones pendientes');

        if (!motivoRechazo || motivoRechazo.trim().length === 0) {
          throw new Error('Debes proporcionar un motivo para rechazar la postulación');
        }

        postulacion.estado = 'rechazada';
        postulacion.revisadoPor = adminId;
        postulacion.fechaRevision = new Date();
        postulacion.motivoRechazo = String(motivoRechazo).trim();

        await postulacion.save({ session });
        await postulacion.populate('usuarioId', 'nombreCompleto correo nombreUsuario');

        returned = postulacion;
        console.log(`✅ Postulación rechazada (id=${postulacionId}) motivo: ${postulacion.motivoRechazo}`);
      });

      return returned;
    } catch (err) {
      console.error('Error en rechazarPostulacion (transaction):', err);
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * Eliminar una postulación (solo las rechazadas o del propio usuario)
   * @param {String} postulacionId
   * @param {String} usuarioId
   * @returns {Boolean}
   */
  async eliminarPostulacion(postulacionId, usuarioId) {
    const postulacion = await PostulacionProfesional.findById(postulacionId);
    if (!postulacion) throw new Error('No existe una postulación con el ID proporcionado');

    if (postulacion.estado !== 'rechazada') {
      throw new Error('Solo se pueden eliminar postulaciones rechazadas');
    }

    if (postulacion.usuarioId.toString() !== usuarioId.toString()) {
      throw new Error('No tienes permisos para eliminar esta postulación');
    }

    if (postulacion.archivos && postulacion.archivos.length > 0) {
      await eliminarArchivosPostulacion(postulacion.archivos);
    }

    await PostulacionProfesional.findByIdAndDelete(postulacionId);
    console.log(`✅ Postulación eliminada: ${postulacionId}`);
    return true;
  }

  /**
   * Obtener estadísticas de postulaciones
   * @returns {Object}
   */
  async obtenerEstadisticas() {
    const total = await PostulacionProfesional.countDocuments();
    const pendientes = await PostulacionProfesional.countDocuments({ estado: 'pendiente' });
    const aprobadas = await PostulacionProfesional.countDocuments({ estado: 'aprobada' });
    const rechazadas = await PostulacionProfesional.countDocuments({ estado: 'rechazada' });

    return {
      total,
      pendientes,
      aprobadas,
      rechazadas,
      tasaAprobacion: total > 0 ? ((aprobadas / total) * 100).toFixed(2) : 0
    };
  }
}

module.exports = new PostulacionesService();
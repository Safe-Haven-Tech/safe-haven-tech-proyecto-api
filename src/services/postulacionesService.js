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
    // Verificar que el usuario existe y es de rol 'usuario'
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error('No existe un usuario con el ID proporcionado');
    }

    if (usuario.rol !== 'usuario') {
      throw new Error('Solo los usuarios con rol "usuario" pueden postular a profesional');
    }

    // Verificar que no tenga una postulación pendiente
    const postulacionPendiente = await PostulacionProfesional.findOne({
      usuarioId,
      estado: 'pendiente'
    });

    if (postulacionPendiente) {
      throw new Error('Ya tienes una postulación pendiente. Espera a que sea revisada');
    }

    // Crear la postulación sin archivos
    const postulacion = new PostulacionProfesional({
      usuarioId,
      motivacion: datos.motivacion,
      experiencia: datos.experiencia || '',
      especialidad: datos.especialidad || '',
      archivos: [],
      estado: 'pendiente'
    });

    await postulacion.save();

    // Poblar información del usuario
    await postulacion.populate('usuarioId', 'nombreCompleto correo nombreUsuario');

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
    // Obtener la postulación
    const postulacion = await PostulacionProfesional.findById(postulacionId);
    
    if (!postulacion) {
      throw new Error('No existe una postulación con el ID proporcionado');
    }

    // Verificar que sea el dueño de la postulación
    if (postulacion.usuarioId.toString() !== usuarioId) {
      throw new Error('No tienes permisos para subir documentos a esta postulación');
    }

    // Solo se pueden subir documentos a postulaciones pendientes
    if (postulacion.estado !== 'pendiente') {
      throw new Error('Solo se pueden subir documentos a postulaciones pendientes');
    }

    // Verificar que se hayan subido archivos
    if (!archivos || archivos.length === 0) {
      throw new Error('Debes adjuntar al menos un archivo');
    }

    // Eliminar archivos anteriores de Cloudinary si existen
    if (postulacion.archivos && postulacion.archivos.length > 0) {
      console.log(`🗑️ Eliminando ${postulacion.archivos.length} archivos anteriores`);
      await eliminarArchivosPostulacion(postulacion.archivos);
    }

    // Subir nuevos archivos a Cloudinary
    const archivosSubidos = [];
    try {
      for (const archivo of archivos) {
        const tipoArchivo = 'otro'; // Tipo por defecto
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
      // Si hay error, eliminar los archivos que se hayan subido
      if (archivosSubidos.length > 0) {
        await eliminarArchivosPostulacion(archivosSubidos);
      }
      throw new Error(`Error al procesar archivos: ${error.message}`);
    }

    // Actualizar la postulación con los nuevos archivos
    postulacion.archivos = archivosSubidos;
    await postulacion.save();

    // Poblar información del usuario
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

    // Filtro por estado
    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    // Filtro por usuario
    if (filtros.usuarioId) {
      query.usuarioId = filtros.usuarioId;
    }

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

    if (!postulacion) {
      throw new Error('No existe una postulación con el ID proporcionado');
    }

    return postulacion;
  }

  /**
   * Aprobar una postulación
   * @param {String} postulacionId - ID de la postulación
   * @param {String} adminId - ID del administrador que aprueba
   * @param {String} observaciones - Observaciones del administrador
   * @returns {Object} Postulación aprobada y usuario actualizado
   */
  async aprobarPostulacion(postulacionId, adminId, observaciones = '') {
    const postulacion = await PostulacionProfesional.findById(postulacionId);

    if (!postulacion) {
      throw new Error('No existe una postulación con el ID proporcionado');
    }

    if (postulacion.estado !== 'pendiente') {
      throw new Error('Solo se pueden aprobar postulaciones pendientes');
    }

    // Verificar que tenga archivos adjuntos
    if (!postulacion.archivos || postulacion.archivos.length === 0) {
      throw new Error('No se puede aprobar una postulación sin documentos adjuntos');
    }

    // Actualizar postulación
    postulacion.estado = 'aprobada';
    postulacion.revisadoPor = adminId;
    postulacion.fechaRevision = new Date();
    postulacion.observaciones = observaciones;

    await postulacion.save();

    // Actualizar rol del usuario a profesional
    const usuario = await Usuario.findByIdAndUpdate(
      postulacion.usuarioId,
      { rol: 'profesional' },
      { new: true }
    ).select('-contraseña');

    console.log(`✅ Postulación aprobada. Usuario ${usuario.correo} es ahora profesional`);

    return {
      postulacion: await postulacion.populate('usuarioId', 'nombreCompleto correo nombreUsuario'),
      usuario
    };
  }

  /**
   * Rechazar una postulación
   * @param {String} postulacionId - ID de la postulación
   * @param {String} adminId - ID del administrador que rechaza
   * @param {String} motivoRechazo - Motivo del rechazo
   * @returns {Object} Postulación rechazada
   */
  async rechazarPostulacion(postulacionId, adminId, motivoRechazo) {
    const postulacion = await PostulacionProfesional.findById(postulacionId);

    if (!postulacion) {
      throw new Error('No existe una postulación con el ID proporcionado');
    }

    if (postulacion.estado !== 'pendiente') {
      throw new Error('Solo se pueden rechazar postulaciones pendientes');
    }

    if (!motivoRechazo || motivoRechazo.trim().length === 0) {
      throw new Error('Debes proporcionar un motivo para rechazar la postulación');
    }

    // Actualizar postulación
    postulacion.estado = 'rechazada';
    postulacion.revisadoPor = adminId;
    postulacion.fechaRevision = new Date();
    postulacion.motivoRechazo = motivoRechazo;

    await postulacion.save();

    console.log(`✅ Postulación rechazada para usuario: ${postulacion.usuarioId}`);

    return await postulacion.populate('usuarioId', 'nombreCompleto correo nombreUsuario');
  }

  /**
   * Eliminar una postulación (solo las rechazadas o del propio usuario)
   * @param {String} postulacionId - ID de la postulación
   * @param {String} usuarioId - ID del usuario que solicita eliminar
   * @returns {Boolean} true si se eliminó correctamente
   */
  async eliminarPostulacion(postulacionId, usuarioId) {
    const postulacion = await PostulacionProfesional.findById(postulacionId);

    if (!postulacion) {
      throw new Error('No existe una postulación con el ID proporcionado');
    }

    // Solo se pueden eliminar postulaciones rechazadas
    if (postulacion.estado !== 'rechazada') {
      throw new Error('Solo se pueden eliminar postulaciones rechazadas');
    }

    // Verificar que sea el usuario dueño de la postulación
    if (postulacion.usuarioId.toString() !== usuarioId.toString()) {
      throw new Error('No tienes permisos para eliminar esta postulación');
    }

    // Eliminar archivos de Cloudinary
    if (postulacion.archivos && postulacion.archivos.length > 0) {
      await eliminarArchivosPostulacion(postulacion.archivos);
    }

    // Eliminar postulación
    await PostulacionProfesional.findByIdAndDelete(postulacionId);

    console.log(`✅ Postulación eliminada: ${postulacionId}`);
    return true;
  }

  /**
   * Obtener estadísticas de postulaciones
   * @returns {Object} Estadísticas generales
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

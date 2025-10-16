const publicacionesService = require('../services/publicacionesService');
const comentariosService = require('../services/comentariosService');
const { config } = require('../config');
const { subirMultiplesArchivos, eliminarMultiplesArchivos } = require('../utils/cloudinaryPublicaciones');

/**
 * @desc    Crear una nueva publicación (solo JSON, sin archivos)
 * @route   POST /api/publicaciones
 * @access  Private
 */
const crearPublicacion = async (req, res) => {
  try {
    // Obtener datos del JSON
    const { contenido, tipo, anonimo, etiquetasUsuarios, topico } = req.body;
    const autorId = req.usuario.userId;

    // Validar campos requeridos
    if (!contenido || !tipo) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        detalles: 'contenido y tipo son obligatorios'
      });
    }

    // Validar tipo de publicación
    if (!['foro', 'perfil'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo de publicación inválido',
        detalles: 'El tipo debe ser "foro" o "perfil"'
      });
    }

    // Validar tópico si es foro
    if (tipo === 'foro' && !topico) {
      return res.status(400).json({
        error: 'Campo requerido faltante',
        detalles: 'El tópico es obligatorio para publicaciones de foro'
      });
    }

    const publicacion = await publicacionesService.crearPublicacion({
      autorId,
      contenido,
      tipo,
      anonimo: anonimo || false,
      multimedia: [],
      etiquetasUsuarios: etiquetasUsuarios || [],
      archivosAdjuntos: [],
      topico: tipo === 'foro' ? topico : undefined
    });

    res.status(201).json({
      mensaje: 'Publicación creada exitosamente',
      publicacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al crear publicación:', error);

    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Subir archivos a una publicación existente
 * @route   POST /api/publicaciones/:id/upload
 * @access  Private
 */
const subirArchivosAPublicacion = async (req, res) => {
  try {
    console.log('🔍 Debug - Iniciando subirArchivosAPublicacion');
    console.log('🔍 Debug - req.params:', req.params);
    console.log('🔍 Debug - req.files:', req.files);
    console.log('🔍 Debug - req.file:', req.file);
    console.log('🔍 Debug - Content-Type:', req.headers['content-type']);
    
    const { id } = req.params;
    const usuarioId = req.usuario.userId;
    const esAdmin = req.usuario.rol === 'administrador';

    // Obtener la publicación actual
    const publicacionActual = await publicacionesService.obtenerPublicacionPorId(id, usuarioId, esAdmin);

    // Verificar permisos
    if (publicacionActual.autorId._id.toString() !== usuarioId && !esAdmin) {
      return res.status(403).json({
        error: 'Sin permisos',
        detalles: 'No tienes permisos para subir archivos a esta publicación'
      });
    }

    let multimedia = publicacionActual.multimedia || [];
    let archivosAdjuntos = publicacionActual.archivosAdjuntos || [];

    // Procesar archivos según el tipo de publicación
    console.log('🔍 Debug - req.files:', req.files);
    console.log('🔍 Debug - tipo publicación:', publicacionActual.tipo);
    console.log('🔍 Debug - cantidad archivos:', req.files ? req.files.length : 0);
    
    if (req.files && req.files.length > 0) {
      console.log('🔍 Debug - Procesando archivos...');
      if (publicacionActual.tipo === 'perfil') {
        console.log('🔍 Debug - Subiendo multimedia...');
        // Subir archivos multimedia a Cloudinary
        const archivosSubidos = await subirMultiplesArchivos(
          req.files, 
          usuarioId, 
          'multimedia'
        );
        console.log('🔍 Debug - Archivos multimedia subidos:', archivosSubidos);
        multimedia = [...multimedia, ...archivosSubidos.map(archivo => archivo.url)];
      } else if (publicacionActual.tipo === 'foro') {
        console.log('🔍 Debug - Subiendo adjuntos...');
        // Subir archivos adjuntos a Cloudinary
        const archivosSubidos = await subirMultiplesArchivos(
          req.files, 
          usuarioId, 
          'adjuntos'
        );
        console.log('🔍 Debug - Archivos adjuntos subidos:', archivosSubidos);
        archivosAdjuntos = [...archivosAdjuntos, ...archivosSubidos.map(archivo => archivo.url)];
      }
    } else {
      console.log('❌ Debug - No hay archivos para procesar');
    }

    // Actualizar la publicación con los nuevos archivos
    const publicacion = await publicacionesService.actualizarPublicacion(
      id,
      { 
        multimedia, 
        archivosAdjuntos 
      },
      usuarioId,
      esAdmin
    );

    res.json({
      mensaje: 'Archivos subidos exitosamente',
      publicacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al subir archivos a publicación:', error);

    // Limpiar archivos subidos en caso de error
    if (req.files && req.files.length > 0) {
      try {
        const publicIds = req.files.map(file => file.publicId).filter(id => id);
        if (publicIds.length > 0) {
          await eliminarMultiplesArchivos(publicIds);
        }
      } catch (cleanupError) {
        console.error('Error limpiando archivos:', cleanupError);
      }
    }

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};


/**
 * @desc    Obtener todas las publicaciones
 * @route   GET /api/publicaciones
 * @access  Public
 */
const obtenerPublicaciones = async (req, res) => {
  try {
    const { pagina = 1, limite = 10, tipo, busqueda, topico } = req.query;
    const usuarioId = req.usuario ? req.usuario.userId : null;
    const esAdmin = req.usuario ? req.usuario.rol === 'admin' : false;

    
    const publicaciones = await publicacionesService.obtenerPublicaciones(
      { tipo, busqueda, topico }, // solo filtros
      parseInt(pagina),
      parseInt(limite),
      usuarioId,
      esAdmin
    );

    res.json(publicaciones);
  } catch (error) {
    console.error('❌ Error al obtener publicaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
}

/**
 * @desc    Obtener publicación por ID
 * @route   GET /api/publicaciones/:id
 * @access  Public
 */
const obtenerPublicacionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario ? req.usuario.userId : null;
    const esAdmin = req.usuario ? req.usuario.rol === 'admin' : false;
    const publicacion = await publicacionesService.obtenerPublicacionPorId(id, usuarioId, esAdmin);
    res.json(publicacion);
  } catch (error) {
    console.error('❌ Error al obtener publicación:', error);
    
    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'No tienes permisos para ver esta publicación') {
      return res.status(403).json({
        error: 'Sin permisos',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Actualizar publicación (solo campos de texto, sin archivos)
 * @route   PUT /api/publicaciones/:id
 * @access  Private (autor o administrador)
 */
const actualizarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    // Obtener datos del JSON
    const { contenido, etiquetasUsuarios, topico } = req.body;
    const usuarioId = req.usuario.userId;
    const esAdmin = req.usuario.rol === 'administrador';

    // Validar campos requeridos
    if (!contenido) {
      return res.status(400).json({
        error: 'Campo requerido faltante',
        detalles: 'contenido es obligatorio'
      });
    }

    // Si se envía topico, agregarlo al update
    const updateData = { 
      contenido, 
      etiquetasUsuarios: etiquetasUsuarios || []
    };
    if (typeof topico !== 'undefined') {
      updateData.topico = topico;
    }

    const publicacion = await publicacionesService.actualizarPublicacion(
      id,
      updateData,
      usuarioId,
      esAdmin
    );

    res.json({
      mensaje: 'Publicación actualizada exitosamente',
      publicacion,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al actualizar publicación:', error);

    if (error.message === 'No tienes permisos para actualizar esta publicación') {
      return res.status(403).json({
        error: 'Sin permisos',
        detalles: error.message
      });
    }

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Eliminar publicación
 * @route   DELETE /api/publicaciones/:id
 * @access  Private (autor o administrador)
 */
const eliminarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;
    const esAdmin = req.usuario.rol === 'administrador';

    const resultado = await publicacionesService.eliminarPublicacion(id, usuarioId, esAdmin);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al eliminar publicación:', error);

    if (error.message === 'No tienes permisos para eliminar esta publicación') {
      return res.status(403).json({
        error: 'Sin permisos',
        detalles: error.message
      });
    }

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Dar like a una publicación
 * @route   POST /api/publicaciones/:id/like
 * @access  Private
 */
const darLike = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    const publicacion = await publicacionesService.darLike(id, usuarioId);

    res.json({
      mensaje: 'Like agregado exitosamente',
      likes: publicacion.likes, 
      likesCount: publicacion.likes.length, 
      yaDioLike: publicacion.likes.some(uid => uid.toString() === usuarioId.toString()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al dar like:', error);

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Reaccionar a una publicación
 * @route   POST /api/publicaciones/:id/reaccionar
 * @access  Private
 */
const reaccionarAPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body;
    const usuarioId = req.usuario.userId;

    if (!tipo) {
      return res.status(400).json({
        error: 'Tipo de reacción requerido',
        detalles: 'Debes especificar el tipo de reacción'
      });
    }

    const resultado = await publicacionesService.reaccionarAPublicacion(id, usuarioId, tipo);

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
      detalles: error.message
    });
  }
};

/**
 * @desc    Quitar reacción de una publicación
 * @route   DELETE /api/publicaciones/:id/reaccionar
 * @access  Private
 */
const quitarReaccionDePublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    const resultado = await publicacionesService.quitarReaccionDePublicacion(id, usuarioId);

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
      detalles: error.message
    });
  }
};

/**
 * @desc    Quitar like de una publicación
 * @route   DELETE /api/publicaciones/:id/like
 * @access  Private
 */
const quitarLike = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.userId;

    const publicacion = await publicacionesService.quitarLike(id, usuarioId);

    res.json({
      mensaje: 'Like quitado exitosamente',
      likes: publicacion.likes,
      likesCount: publicacion.likes.length,
      yaDioLike: publicacion.likes.some(uid => uid.toString() === usuarioId.toString()),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al quitar like:', error);

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};


/**
 * @desc    Crear comentario en una publicación
 * @route   POST /api/publicaciones/:id/comentarios
 * @access  Private
 */
const crearComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const usuarioId = req.usuario.userId;

    const comentario = await comentariosService.crearComentario({
      publicacionId: id,
      usuarioId,
      contenido
    });

    res.status(201).json({
      mensaje: 'Comentario creado exitosamente',
      comentario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al crear comentario:', error);

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Obtener comentarios de una publicación
 * @route   GET /api/publicaciones/:id/comentarios
 * @access  Public
 */
const obtenerComentarios = async (req, res) => {
  try {
    const { id } = req.params;
    const { pagina = 1, limite = 20 } = req.query;

    const comentarios = await comentariosService.obtenerComentarios(id, parseInt(pagina), parseInt(limite));

    res.json(comentarios);
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Denunciar una publicación
 * @route   POST /api/publicaciones/:id/denunciar
 * @access  Private
 */
const denunciarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, descripcion } = req.body;
    const usuarioId = req.usuario.userId;

    const denuncia = await publicacionesService.crearDenuncia({
      publicacionId: id,
      usuarioId,
      motivo,
      descripcion
    });

    res.status(201).json({
      mensaje: 'Denuncia enviada exitosamente',
      denuncia,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al denunciar publicación:', error);

    if (error.message === 'Publicación no encontrada') {
      return res.status(404).json({
        error: 'Publicación no encontrada',
        detalles: error.message
      });
    }

    if (error.message === 'Ya has denunciado esta publicación') {
      return res.status(400).json({
        error: 'Denuncia duplicada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

// ...existing code...

/**
 * @desc    Eliminar comentario de una publicación
 * @route   DELETE /api/publicaciones/:id/comentarios/:comentarioId
 * @access  Private (autor del comentario o administrador)
 */
const eliminarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;
    const usuarioId = req.usuario.userId;
    const esAdmin = req.usuario.rol === 'administrador';

    
    const resultado = await comentariosService.eliminarComentario(comentarioId, usuarioId, esAdmin);

    res.json({
      mensaje: resultado.mensaje || 'Comentario eliminado exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al eliminar comentario:', error);

    if (error.message === 'Comentario no encontrado') {
      return res.status(404).json({
        error: 'Comentario no encontrado',
        detalles: error.message
      });
    }
    if (error.message === 'No tienes permisos para eliminar este comentario') {
      return res.status(403).json({
        error: 'Sin permisos',
        detalles: error.message
      });
    }
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};


/**
 * @desc    Obtener publicaciones de un usuario (opcionalmente filtradas por tipo)
 * @route   GET /api/publicaciones/usuario/:usuarioId
 * @access  Public
 */
const obtenerPublicacionesPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { tipo, topico } = req.query;
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 20;

    const publicaciones = await publicacionesService.obtenerPublicacionesPorUsuario(
      usuarioId,
      tipo,
      pagina,
      limite,
      topico
    );

    res.json({ posts: publicaciones });
  } catch (error) {
    console.error('❌ Error al obtener publicaciones por usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

module.exports = {
  crearPublicacion,
  subirArchivosAPublicacion,
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  actualizarPublicacion,
  eliminarPublicacion,
  darLike,
  quitarLike,
  reaccionarAPublicacion,
  quitarReaccionDePublicacion,
  crearComentario,
  obtenerComentarios,
  denunciarPublicacion,
  eliminarComentario,
  obtenerPublicacionesPorUsuario
};
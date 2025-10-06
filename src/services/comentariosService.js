const Comentario = require('../models/Comentario');
const Publicacion = require('../models/Publicacion');
const Usuario = require('../models/Usuario');
const Notificacion = require('../models/Notificacion');

/**
 * Crear un nuevo comentario
 */
const crearComentario = async (datosComentario) => {
  const { publicacionId, usuarioId, contenido } = datosComentario;

  // Verificar que la publicación existe
  const publicacion = await Publicacion.findById(publicacionId);
  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  // Verificar que el usuario existe y está activo
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario || !usuario.activo || usuario.estado !== 'activo') {
    throw new Error('El usuario no puede crear comentarios en este momento');
  }

  const comentario = new Comentario({
    publicacionId,
    usuarioId,
    contenido
  });

  await comentario.save();
  await comentario.populate('usuarioId', 'nombreCompleto fotoPerfil');

  // Crear notificación para el autor de la publicación
  if (publicacion.autorId.toString() !== usuarioId.toString()) {
    await Notificacion.crearNotificacion(
      publicacion.autorId,
      usuarioId,
      'respuesta',
      `${usuario.nombreCompleto} comentó en tu publicación`,
      `/publicacion/${publicacionId}`
    );
  }
  
  return comentario;
};

/**
 * Obtener comentarios de una publicación
 */
const obtenerComentarios = async (publicacionId, pagina = 1, limite = 20) => {
  const skip = (pagina - 1) * limite;

  const comentarios = await Comentario.find({ 
    publicacionId,
    visible: true,
    moderado: false
  })
    .populate('usuarioId', 'nombreCompleto fotoPerfil')
    .sort({ fecha: -1 })
    .skip(skip)
    .limit(limite);

  const total = await Comentario.countDocuments({ 
    publicacionId,
    visible: true,
    moderado: false
  });

  return {
    comentarios,
    paginacion: {
      pagina,
      limite,
      total,
      paginas: Math.ceil(total / limite)
    }
  };
};

/**
 * Obtener un comentario por ID
 */
const obtenerComentarioPorId = async (id) => {
  const comentario = await Comentario.findById(id)
    .populate('usuarioId', 'nombreCompleto fotoPerfil');

  if (!comentario) {
    throw new Error('No existe un comentario con el ID proporcionado');
  }

  return comentario;
};

/**
 * Actualizar un comentario
 */
const actualizarComentario = async (id, contenido, usuarioId, esAdmin = false) => {
  const comentario = await Comentario.findById(id);
  
  if (!comentario) {
    throw new Error('No existe un comentario con el ID proporcionado');
  }

  // Verificar permisos
  if (!esAdmin && comentario.usuarioId.toString() !== usuarioId.toString()) {
    throw new Error('No tienes permisos para actualizar este comentario');
  }

  comentario.contenido = contenido;
  await comentario.save();

  return comentario;
};

/**
 * Eliminar un comentario
 */
const eliminarComentario = async (id, usuarioId, esAdmin = false) => {
  const comentario = await Comentario.findById(id);
  
  if (!comentario) {
    throw new Error('No existe un comentario con el ID proporcionado');
  }

  // Verificar permisos
  if (!esAdmin && comentario.usuarioId.toString() !== usuarioId.toString()) {
    throw new Error('No tienes permisos para eliminar este comentario');
  }

  await Comentario.findByIdAndDelete(id);

  return { mensaje: 'Comentario eliminado exitosamente' };
};

/**
 * Moderar un comentario
 */
const moderarComentario = async (id, moderadorId, motivo, accion) => {
  const comentario = await Comentario.findById(id);
  
  if (!comentario) {
    throw new Error('No existe un comentario con el ID proporcionado');
  }

  const actualizacion = {
    moderado: true,
    moderadoPor: moderadorId,
    moderadoEn: new Date(),
    motivoModeracion: motivo
  };

  if (accion === 'ocultar') {
    actualizacion.visible = false;
  }

  const comentarioModerado = await Comentario.findByIdAndUpdate(
    id,
    actualizacion,
    { new: true }
  ).populate('usuarioId', 'nombreCompleto fotoPerfil');

  return comentarioModerado;
};

/**
 * Obtener comentarios moderados (para administradores)
 */
const obtenerComentariosModerados = async (filtros = {}, pagina = 1, limite = 10) => {
  const { moderado, visible, usuarioId } = filtros;
  
  const query = {};
  
  if (moderado !== undefined) query.moderado = moderado;
  if (visible !== undefined) query.visible = visible;
  if (usuarioId) query.usuarioId = usuarioId;

  const skip = (pagina - 1) * limite;

  const comentarios = await Comentario.find(query)
    .populate('usuarioId', 'nombreCompleto correo')
    .populate('publicacionId', 'contenido tipo')
    .populate('moderadoPor', 'nombreCompleto')
    .sort({ fecha: -1 })
    .skip(skip)
    .limit(limite);

  const total = await Comentario.countDocuments(query);

  return {
    comentarios,
    paginacion: {
      pagina,
      limite,
      total,
      paginas: Math.ceil(total / limite)
    }
  };
};

module.exports = {
  crearComentario,
  obtenerComentarios,
  obtenerComentarioPorId,
  actualizarComentario,
  eliminarComentario,
  moderarComentario,
  obtenerComentariosModerados
};

const Publicacion = require('../models/Publicacion');
const Comentario = require('../models/Comentario');
const Denuncia = require('../models/Denuncia');
const Usuario = require('../models/Usuario');
const Reaccion = require('../models/Reaccion');
const Notificacion = require('../models/Notificacion');
const { eliminarMultiplesArchivos } = require('../utils/cloudinaryPublicaciones');

/**
 * Extraer public_id de URL de Cloudinary
 */
const extraerPublicIdDeUrl = (url) => {
  try {
    // URL de Cloudinary: https://res.cloudinary.com/account/image/upload/v1234567890/folder/public_id.ext
    const match = url.match(/\/upload\/[^\/]+\/(.+)$/);
    if (match && match[1]) {
      // Remover la extensión del archivo
      return match[1].replace(/\.[^/.]+$/, '');
    }
    return null;
  } catch (error) {
    console.error('Error extrayendo public_id:', error);
    return null;
  }
};

/**
 * Crear una nueva publicación
 */
const crearPublicacion = async (datosPublicacion) => {
  const {
    autorId,
    contenido,
    tipo,
    anonimo = false,
    multimedia = [],
    etiquetasUsuarios = [],
    archivosAdjuntos = [],
    topico // <-- Agregado
  } = datosPublicacion;

  // Validar que el autor existe
  const autor = await Usuario.findById(autorId);
  if (!autor) {
    throw new Error('No existe un usuario con el ID proporcionado');
  }

  // Validar que el usuario no esté bloqueado
  if (!autor.activo || autor.estado === 'suspendido' || autor.estado === 'eliminado') {
    throw new Error('El usuario no puede crear publicaciones en este momento');
  }

  // Validar etiquetas de usuarios
  if (etiquetasUsuarios.length > 0) {
    const usuariosEtiquetados = await Usuario.find({
      _id: { $in: etiquetasUsuarios },
      activo: true,
      estado: 'activo'
    });
    
    if (usuariosEtiquetados.length !== etiquetasUsuarios.length) {
      throw new Error('Algunos usuarios etiquetados no existen o no están activos');
    }
  }

  const publicacion = new Publicacion({
    autorId,
    contenido,
    tipo,
    anonimo,
    multimedia,
    etiquetasUsuarios,
    archivosAdjuntos,
    topico // <-- Agregado
  });

  await publicacion.save();
  await publicacion.populate('autorId', 'nombreCompleto fotoPerfil anonimo');
  
  return publicacion;
};

/**
 * Obtener publicaciones con filtros y paginación
 */
const obtenerPublicaciones = async (filtros = {}, pagina = 1, limite = 10, usuarioId = null, esAdmin = false) => {
  const {
    tipo,
    autorId,
    anonimo,
    moderada,
    visible,
    busqueda,
    ordenarPor = 'fecha',
    orden = 'desc',
    topico 
  } = filtros;

  const query = {};

  // Aplicar filtros
  if (tipo) query.tipo = tipo;
  if (autorId) query.autorId = autorId;
  if (anonimo !== undefined) query.anonimo = anonimo;
  if (moderada !== undefined) query.moderada = moderada;
  if (visible !== undefined) query.visible = visible;
  if (topico) query.topico = topico; 

  if (busqueda) {
    query.contenido = { $regex: busqueda, $options: 'i' };
  }

  const sortOptions = {};
  sortOptions[ordenarPor] = orden === 'desc' ? -1 : 1;

  const skip = (pagina - 1) * limite;

  // Traer todas las publicaciones que cumplen los filtros básicos
  const publicaciones = await Publicacion.find(query)
    .populate('autorId', 'nombreCompleto nombreUsuario fotoPerfil anonimo visibilidadPerfil seguidores bloqueados')
    .populate('etiquetasUsuarios', 'nombreCompleto fotoPerfil')
    .populate({
      path: 'comentarios',
      options: { sort: { fecha: -1 }, limit: 2 }, 
      populate: {
        path: 'usuarioId',
        select: 'nombreCompleto fotoPerfil anonimo'
      }
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(limite);

  // Filtrar publicaciones según privacidad del perfil y bloqueos
  const publicacionesFiltradas = publicaciones.filter(publicacion => {
    // Los administradores pueden ver todas las publicaciones
    if (esAdmin) {
      return true;
    }

    // Si el autor ha bloqueado al usuario actual, no mostrar la publicación
    if (
      usuarioId &&
      Array.isArray(publicacion.autorId.bloqueados) &&
      publicacion.autorId.bloqueados.some(bloqueadoId => bloqueadoId.toString() === usuarioId.toString())
    ) {
      return false;
    }

    // Si no hay usuario autenticado, solo mostrar perfiles públicos
    if (!usuarioId) {
      return publicacion.autorId.visibilidadPerfil === 'publico';
    }

    // Si el usuario es el autor, puede ver su propia publicación (aunque su perfil sea privado)
    if (publicacion.autorId._id.toString() === usuarioId.toString()) {
      return true;
    }

    // Si el perfil es público, mostrar la publicación
    if (publicacion.autorId.visibilidadPerfil === 'publico') {
      return true;
    }

    // Si el perfil es privado, verificar si el usuario es seguidor
    if (publicacion.autorId.visibilidadPerfil === 'privado') {
      return publicacion.autorId.seguidores.some(seguidor => 
        seguidor.toString() === usuarioId.toString()
      );
    }

    return false;
  });

  // El total debe reflejar solo las publicaciones visibles para el usuario
  const total = publicacionesFiltradas.length;

  return {
    publicaciones: publicacionesFiltradas,
    paginacion: {
      pagina,
      limite,
      total,
      paginas: Math.ceil(total / limite)
    }
  };
};

/**
 * Obtener una publicación por ID
 */
const obtenerPublicacionPorId = async (id, usuarioId = null, esAdmin = false) => {
  const publicacion = await Publicacion.findById(id)
    .populate('autorId', 'nombreCompleto nombreUsuario fotoPerfil anonimo visibilidadPerfil seguidores')
    .populate('etiquetasUsuarios', 'nombreCompleto fotoPerfil')
    .populate({
      path: 'comentarios',
      populate: { path: 'usuarioId', select: 'nombreCompleto nombreUsuario fotoPerfil anonimo' }
    });

  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  // Los administradores pueden ver todas las publicaciones
  if (esAdmin) {
    return publicacion;
  }

  // Verificar privacidad del perfil del autor
  if (!usuarioId) {
    if (publicacion.autorId.visibilidadPerfil !== 'publico') {
      throw new Error('No tienes permisos para ver esta publicación');
    }
    return publicacion;
  }

  // El autor puede ver su propia publicación
  if (publicacion.autorId._id.toString() === usuarioId.toString()) {
    return publicacion;
  }

  // Si el perfil es público, cualquier usuario puede ver
  if (publicacion.autorId.visibilidadPerfil === 'publico') {
    return publicacion;
  }

  // Si el perfil es privado, solo seguidores pueden ver
  if (publicacion.autorId.visibilidadPerfil === 'privado') {
    const esSeguidor = publicacion.autorId.seguidores.some(seguidor =>
      seguidor.toString() === usuarioId.toString()
    );
    if (!esSeguidor) {
      throw new Error('No tienes permisos para ver esta publicación');
    }
    return publicacion;
  }

  throw new Error('No tienes permisos para ver esta publicación');
};
/**
 * Actualizar una publicación
 */
const actualizarPublicacion = async (id, datosActualizacion, usuarioId, esAdmin = false) => {
  const publicacion = await Publicacion.findById(id);
  
  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  // Verificar permisos
  if (!esAdmin && publicacion.autorId.toString() !== usuarioId.toString()) {
    throw new Error('No tienes permisos para actualizar esta publicación');
  }

  // Si se están reemplazando archivos, eliminar los antiguos de Cloudinary
  if (datosActualizacion.multimedia !== undefined || datosActualizacion.archivosAdjuntos !== undefined) {
    try {
      const archivosParaEliminar = [];
      
      // Si se reemplaza multimedia, eliminar los antiguos
      if (datosActualizacion.multimedia !== undefined && publicacion.multimedia) {
        publicacion.multimedia.forEach(url => {
          const publicId = extraerPublicIdDeUrl(url);
          if (publicId) archivosParaEliminar.push(publicId);
        });
      }
      
      // Si se reemplazan archivos adjuntos, eliminar los antiguos
      if (datosActualizacion.archivosAdjuntos !== undefined && publicacion.archivosAdjuntos) {
        publicacion.archivosAdjuntos.forEach(url => {
          const publicId = extraerPublicIdDeUrl(url);
          if (publicId) archivosParaEliminar.push(publicId);
        });
      }
      
      // Eliminar archivos antiguos de Cloudinary
      if (archivosParaEliminar.length > 0) {
        await eliminarMultiplesArchivos(archivosParaEliminar);
        console.log(`✅ Eliminados ${archivosParaEliminar.length} archivos antiguos de Cloudinary`);
      }
    } catch (error) {
      console.error('❌ Error eliminando archivos antiguos de Cloudinary:', error);
      // No lanzar error, solo logear
    }
  }

  // Campos que se pueden actualizar
  const camposPermitidos = ['contenido', 'multimedia', 'etiquetasUsuarios', 'archivosAdjuntos', 'topico'];
  const actualizacion = {};

  for (const campo of camposPermitidos) {
    if (datosActualizacion[campo] !== undefined) {
      actualizacion[campo] = datosActualizacion[campo];
    }
  }

  const publicacionActualizada = await Publicacion.findByIdAndUpdate(
    id,
    actualizacion,
    { new: true, runValidators: true }
  ).populate('autorId', 'nombreCompleto fotoPerfil anonimo')
   .populate('etiquetasUsuarios', 'nombreCompleto fotoPerfil');

  return publicacionActualizada;
};

/**
 * Eliminar una publicación
 */
const eliminarPublicacion = async (id, usuarioId, esAdmin = false) => {
  const publicacion = await Publicacion.findById(id);
  
  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  // Verificar permisos
  if (!esAdmin && publicacion.autorId.toString() !== usuarioId.toString()) {
    throw new Error('No tienes permisos para eliminar esta publicación');
  }

  // Eliminar archivos de Cloudinary
  try {
    const archivosParaEliminar = [];
    
    // Agregar archivos multimedia
    if (publicacion.multimedia && publicacion.multimedia.length > 0) {
      publicacion.multimedia.forEach(url => {
        // Extraer public_id de la URL de Cloudinary
        const publicId = extraerPublicIdDeUrl(url);
        if (publicId) archivosParaEliminar.push(publicId);
      });
    }
    
    // Agregar archivos adjuntos
    if (publicacion.archivosAdjuntos && publicacion.archivosAdjuntos.length > 0) {
      publicacion.archivosAdjuntos.forEach(url => {
        // Extraer public_id de la URL de Cloudinary
        const publicId = extraerPublicIdDeUrl(url);
        if (publicId) archivosParaEliminar.push(publicId);
      });
    }
    
    // Eliminar archivos de Cloudinary
    if (archivosParaEliminar.length > 0) {
      await eliminarMultiplesArchivos(archivosParaEliminar);
      console.log(`✅ Eliminados ${archivosParaEliminar.length} archivos de Cloudinary`);
    }
  } catch (error) {
    console.error('❌ Error eliminando archivos de Cloudinary:', error);
    // No lanzar error, solo logear para no interrumpir la eliminación
  }

  // Eliminar comentarios asociados
  await Comentario.deleteMany({ publicacionId: id });
  
  // Eliminar denuncias asociadas
  await Denuncia.deleteMany({ publicacionId: id });

  // Eliminar la publicación
  await Publicacion.findByIdAndDelete(id);

  return { mensaje: 'Publicación eliminada exitosamente' };
};

/**
 * Dar like a una publicación
 */
const darLike = async (id, usuarioId) => {
  const publicacion = await Publicacion.findById(id);

  if (!publicacion) throw new Error('Publicación no encontrada');

  // Inicializar likes si está undefined
  if (!Array.isArray(publicacion.likes)) {
    publicacion.likes = [];
  }

  // Si el usuario ya dio like, no hacer nada
  if (publicacion.likes.some(uid => uid.toString() === usuarioId.toString())) {
    throw new Error('Ya diste like a esta publicación');
  }

  // Agregar el ID del usuario al array de likes
  publicacion.likes.push(usuarioId);
  await publicacion.save();

  return publicacion;
};

/**
 * Reaccionar a una publicación
 */
const reaccionarAPublicacion = async (id, usuarioId, tipoReaccion) => {
  const publicacion = await Publicacion.findById(id);
  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  // Verificar que el usuario puede ver la publicación
  if (!publicacion.puedeVer(usuarioId)) {
    throw new Error('No tienes permisos para ver esta publicación');
  }

  // Buscar reacción existente
  let reaccion = await Reaccion.findOne({
    publicacionId: id,
    usuarioId
  });

  if (reaccion) {
    // Si ya existe, actualizar el tipo
    reaccion.tipo = tipoReaccion;
    await reaccion.save();
  } else {
    // Crear nueva reacción
    reaccion = await Reaccion.create({
      publicacionId: id,
      usuarioId,
      tipo: tipoReaccion
    });

    // Actualizar contador de likes en la publicación
    await Publicacion.findByIdAndUpdate(id, {
      $inc: { likes: 1 }
    });
  }

  // Crear notificación para el autor de la publicación
  if (publicacion.autorId.toString() !== usuarioId.toString()) {
    const usuario = await Usuario.findById(usuarioId);
    await Notificacion.crearNotificacion(
      publicacion.autorId,
      usuarioId,
      'reaccion',
      `${usuario.nombreCompleto} reaccionó a tu publicación`,
      `/publicacion/${id}`
    );
  }

  return {
    mensaje: 'Reacción agregada exitosamente',
    reaccion
  };
};

/**
 * Quitar reacción de una publicación
 */
const quitarReaccionDePublicacion = async (id, usuarioId) => {
  const reaccion = await Reaccion.findOneAndDelete({
    publicacionId: id,
    usuarioId
  });

  if (!reaccion) {
    throw new Error('No tienes una reacción en esta publicación');
  }

  // Actualizar contador de likes en la publicación
  await Publicacion.findByIdAndUpdate(id, {
    $inc: { likes: -1 }
  });

  return {
    mensaje: 'Reacción eliminada exitosamente'
  };
};

/**
 * Quitar like de una publicación
 */
const quitarLike = async (id, usuarioId) => {
  const publicacion = await Publicacion.findById(id);

  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  // Eliminar el ID del usuario del array de likes
  publicacion.likes = publicacion.likes.filter(
    uid => uid.toString() !== usuarioId.toString()
  );
  await publicacion.save();

  return publicacion;
};
/**
 * Moderar una publicación
 */
const moderarPublicacion = async (id, moderadorId, motivo, accion) => {
  const publicacion = await Publicacion.findById(id);
  
  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  const actualizacion = {
    moderada: true,
    moderadaPor: moderadorId,
    moderadaEn: new Date(),
    motivoModeracion: motivo
  };

  if (accion === 'ocultar') {
    actualizacion.visible = false;
  }

  const publicacionModerada = await Publicacion.findByIdAndUpdate(
    id,
    actualizacion,
    { new: true }
  ).populate('autorId', 'nombreCompleto fotoPerfil anonimo');

  return publicacionModerada;
};

/**
 * Crear una denuncia
 */
const crearDenuncia = async (datosDenuncia) => {
  const { publicacionId, usuarioId, motivo, descripcion } = datosDenuncia;

  // Verificar que la publicación existe
  const publicacion = await Publicacion.findById(publicacionId);
  if (!publicacion) {
    throw new Error('No existe una publicación con el ID proporcionado');
  }

  // Verificar que el usuario no sea el autor
  if (publicacion.autorId.toString() === usuarioId.toString()) {
    throw new Error('No puedes denunciar tu propia publicación');
  }

  const denuncia = new Denuncia({
    publicacionId,
    usuarioId,
    motivo,
    descripcion
  });

  await denuncia.save();
  return denuncia;
};

/**
 * Obtener denuncias
 */
const obtenerDenuncias = async (filtros = {}, pagina = 1, limite = 10) => {
  const { estado, motivo, fechaDesde, fechaHasta } = filtros;
  
  const query = {};
  
  if (estado) query.estado = estado;
  if (motivo) query.motivo = motivo;
  if (fechaDesde || fechaHasta) {
    query.fecha = {};
    if (fechaDesde) query.fecha.$gte = new Date(fechaDesde);
    if (fechaHasta) query.fecha.$lte = new Date(fechaHasta);
  }

  const skip = (pagina - 1) * limite;

  const denuncias = await Denuncia.find(query)
    .populate('publicacionId', 'contenido tipo autorId')
    .populate('usuarioId', 'nombreCompleto correo')
    .populate('resueltaPor', 'nombreCompleto')
    .sort({ fecha: -1 })
    .skip(skip)
    .limit(limite);

  const total = await Denuncia.countDocuments(query);

  return {
    denuncias,
    paginacion: {
      pagina,
      limite,
      total,
      paginas: Math.ceil(total / limite)
    }
  };
};

/**
 * Resolver una denuncia
 */
const resolverDenuncia = async (denunciaId, moderadorId, estado, observaciones) => {
  const denuncia = await Denuncia.findById(denunciaId);
  
  if (!denuncia) {
    throw new Error('No existe una denuncia con el ID proporcionado');
  }

  denuncia.estado = estado;
  denuncia.resueltaPor = moderadorId;
  denuncia.resueltaEn = new Date();
  denuncia.observaciones = observaciones;

  await denuncia.save();
  return denuncia;
};

async function obtenerPublicacionesPorUsuario(usuarioId, tipo, pagina = 1, limite = 20, topico) {
  const filtro = { autorId: usuarioId };
  if (tipo) filtro.tipo = tipo;
  if (topico) filtro.topico = topico;

  return await Publicacion.find(filtro)
    .sort({ createdAt: -1 })
    .skip((pagina - 1) * limite)
    .limit(limite)
    .lean();
}

module.exports = {
  crearPublicacion,
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  actualizarPublicacion,
  eliminarPublicacion,
  darLike,
  quitarLike,
  reaccionarAPublicacion,
  quitarReaccionDePublicacion,
  moderarPublicacion,
  crearDenuncia,
  obtenerPublicacionesPorUsuario,
  obtenerDenuncias,
  resolverDenuncia
};
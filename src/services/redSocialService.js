const Usuario = require('../models/Usuario');
const Publicacion = require('../models/Publicacion');
const Comentario = require('../models/Comentario');
const Notificacion = require('../models/Notificacion');
const Chat = require('../models/Chat');
const MensajeChat = require('../models/MensajeChat');
const Reaccion = require('../models/Reaccion');
const Denuncia = require('../models/Denuncia');

/**
 * Servicio para manejar funcionalidades de red social
 */

// ==================== SEGUIDORES ====================

/**
 * Seguir a un usuario
 */
const seguirUsuario = async (usuarioId, usuarioASeguirId) => {
  try {
    // Validar que no se siga a sí mismo
    if (usuarioId.toString() === usuarioASeguirId.toString()) {
      throw new Error('No puedes seguirte a ti mismo');
    }

    // Obtener ambos usuarios
    const usuario = await Usuario.findById(usuarioId);
    const usuarioASeguir = await Usuario.findById(usuarioASeguirId);

    if (!usuario || !usuarioASeguir) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el usuario a seguir no esté bloqueado
    if (usuario.bloqueados.includes(usuarioASeguirId)) {
      throw new Error('No puedes seguir a un usuario que has bloqueado');
    }

    // Verificar que el usuario a seguir no te haya bloqueado
    if (usuarioASeguir.bloqueados.includes(usuarioId)) {
      throw new Error('No puedes seguir a este usuario');
    }

    // Verificar que no se esté siguiendo ya
    if (usuario.seguidos.includes(usuarioASeguirId)) {
      throw new Error('Ya estás siguiendo a este usuario');
    }

    // Verificar si el usuario a seguir tiene perfil privado
    if (usuarioASeguir.visibilidadPerfil === 'privado') {
      // Verificar si ya hay una solicitud pendiente
      const solicitudExistente = usuarioASeguir.solicitudesSeguidores.find(
        solicitud => solicitud.usuarioId.toString() === usuarioId.toString() && solicitud.estado === 'pendiente'
      );

      if (solicitudExistente) {
        throw new Error('Ya tienes una solicitud de seguimiento pendiente con este usuario');
      }

      // Crear solicitud de seguimiento
      const nuevaSolicitud = {
        usuarioId: usuarioId,
        fechaSolicitud: new Date(),
        estado: 'pendiente'
      };
      
      usuarioASeguir.solicitudesSeguidores.push(nuevaSolicitud);

      await usuarioASeguir.save();

      // Crear notificación de solicitud
      await Notificacion.crearNotificacion(
        usuarioASeguirId,
        usuarioId,
        'solicitud_seguimiento',
        `${usuario.nombreCompleto} quiere seguirte`,
        `/perfil/${usuarioId}`
      );

      return {
        mensaje: 'Solicitud de seguimiento enviada. El usuario debe aceptarla.',
        tipo: 'solicitud_enviada'
      };
    } else {
      // Perfil público - seguir directamente
      usuario.seguidos.push(usuarioASeguirId);
      usuarioASeguir.seguidores.push(usuarioId);

      await Promise.all([usuario.save(), usuarioASeguir.save()]);

      // Crear notificación
      await Notificacion.crearNotificacion(
        usuarioASeguirId,
        usuarioId,
        'nuevo_seguidor',
        `${usuario.nombreCompleto} comenzó a seguirte`,
        `/perfil/${usuarioId}`
      );

      return {
        mensaje: 'Usuario seguido exitosamente',
        seguidores: usuarioASeguir.seguidores.length,
        seguidos: usuario.seguidos.length,
        tipo: 'seguido_directamente'
      };
    }

  } catch (error) {
    throw error;
  }
};

/**
 * Dejar de seguir a un usuario
 */
const dejarDeSeguirUsuario = async (usuarioId, usuarioADejarDeSeguirId) => {
  try {
    const usuario = await Usuario.findById(usuarioId);
    const usuarioADejarDeSeguir = await Usuario.findById(usuarioADejarDeSeguirId);

    if (!usuario || !usuarioADejarDeSeguir) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que se esté siguiendo
    if (!usuario.seguidos.includes(usuarioADejarDeSeguirId)) {
      throw new Error('No estás siguiendo a este usuario');
    }

    // Remover de seguidos y seguidores
    usuario.seguidos = usuario.seguidos.filter(id => id.toString() !== usuarioADejarDeSeguirId.toString());
    usuarioADejarDeSeguir.seguidores = usuarioADejarDeSeguir.seguidores.filter(id => id.toString() !== usuarioId.toString());

    await Promise.all([usuario.save(), usuarioADejarDeSeguir.save()]);

    return {
      mensaje: 'Usuario dejado de seguir exitosamente',
      seguidores: usuarioADejarDeSeguir.seguidores.length,
      seguidos: usuario.seguidos.length
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Obtener seguidores de un usuario
 */
const obtenerSeguidores = async (usuarioId, pagina = 1, limite = 20) => {
  try {
    const usuario = await Usuario.findById(usuarioId)
      .populate({
        path: 'seguidores',
        select: 'nombreCompleto fotoPerfil nombreUsuario anonimo visibilidadPerfil activo',
        options: {
          skip: (pagina - 1) * limite,
          limit: limite
        }
      });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const total = usuario.seguidores.length;
    const totalPaginas = Math.ceil(total / limite);

    return {
      seguidores: usuario.seguidores,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Obtener usuarios seguidos
 */
const obtenerSeguidos = async (usuarioId, pagina = 1, limite = 20) => {
  try {
    const usuario = await Usuario.findById(usuarioId)
      .populate({
        path: 'seguidos',
        select: 'nombreCompleto fotoPerfil nombreUsuario anonimo visibilidadPerfil activo',
        options: {
          skip: (pagina - 1) * limite,
          limit: limite
        }
      });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const total = usuario.seguidos.length;
    const totalPaginas = Math.ceil(total / limite);

    return {
      seguidos: usuario.seguidos,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

// ==================== BLOQUEOS ====================

/**
 * Bloquear a un usuario
 */
const bloquearUsuario = async (usuarioId, usuarioABloquearId) => {
  try {
    // Validar que no se bloquee a sí mismo
    if (usuarioId.toString() === usuarioABloquearId.toString()) {
      throw new Error('No puedes bloquearte a ti mismo');
    }

    const usuario = await Usuario.findById(usuarioId);
    const usuarioABloquear = await Usuario.findById(usuarioABloquearId);

    if (!usuario || !usuarioABloquear) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que no esté bloqueado ya
    if (usuario.bloqueados.includes(usuarioABloquearId)) {
      throw new Error('Ya tienes bloqueado a este usuario');
    }

    // Bloquear usuario
    usuario.bloqueados.push(usuarioABloquearId);

    // Si se estaban siguiendo mutuamente, dejar de seguir
    if (usuario.seguidos.includes(usuarioABloquearId)) {
      usuario.seguidos = usuario.seguidos.filter(id => id.toString() !== usuarioABloquearId.toString());
      usuarioABloquear.seguidores = usuarioABloquear.seguidores.filter(id => id.toString() !== usuarioId.toString());
    }

    if (usuarioABloquear.seguidos.includes(usuarioId)) {
      usuarioABloquear.seguidos = usuarioABloquear.seguidos.filter(id => id.toString() !== usuarioId.toString());
      usuario.seguidores = usuario.seguidores.filter(id => id.toString() !== usuarioABloquearId.toString());
    }

    await Promise.all([usuario.save(), usuarioABloquear.save()]);

    return {
      mensaje: 'Usuario bloqueado exitosamente'
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Desbloquear a un usuario
 */
const desbloquearUsuario = async (usuarioId, usuarioADesbloquearId) => {
  try {
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que esté bloqueado
    if (!usuario.bloqueados.includes(usuarioADesbloquearId)) {
      throw new Error('Este usuario no está bloqueado');
    }

    // Desbloquear usuario
    usuario.bloqueados = usuario.bloqueados.filter(id => id.toString() !== usuarioADesbloquearId.toString());
    await usuario.save();

    return {
      mensaje: 'Usuario desbloqueado exitosamente'
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Obtener usuarios bloqueados
 */
const obtenerUsuariosBloqueados = async (usuarioId, pagina = 1, limite = 20) => {
  try {
    const usuario = await Usuario.findById(usuarioId)
      .populate({
        path: 'bloqueados',
        select: 'nombreCompleto fotoPerfil nombreUsuario',
        options: {
          skip: (pagina - 1) * limite,
          limit: limite
        }
      });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const total = usuario.bloqueados.length;
    const totalPaginas = Math.ceil(total / limite);

    return {
      bloqueados: usuario.bloqueados,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

// ==================== NOTIFICACIONES ====================

/**
 * Obtener notificaciones de un usuario
 */
const obtenerNotificaciones = async (usuarioId, pagina = 1, limite = 20) => {
  try {
    const notificaciones = await Notificacion.find({ usuarioId })
      .sort({ fecha: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .populate('usuarioId', 'nombreCompleto fotoPerfil');

    const total = await Notificacion.countDocuments({ usuarioId });
    const totalPaginas = Math.ceil(total / limite);

    return {
      notificaciones,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Marcar notificación como leída
 */
const marcarNotificacionComoLeida = async (notificacionId, usuarioId) => {
  try {
    const notificacion = await Notificacion.findOne({
      _id: notificacionId,
      usuarioId: usuarioId
    });

    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }

    await notificacion.marcarComoLeida();

    return {
      mensaje: 'Notificación marcada como leída'
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Marcar todas las notificaciones como leídas
 */
const marcarTodasLasNotificacionesComoLeidas = async (usuarioId) => {
  try {
    await Notificacion.updateMany(
      { usuarioId, leida: false },
      { leida: true }
    );

    return {
      mensaje: 'Todas las notificaciones marcadas como leídas'
    };

  } catch (error) {
    throw error;
  }
};

// ==================== REACCIONES ====================

/**
 * Reaccionar a una publicación (solo like)
 */
const reaccionarAPublicacion = async (publicacionId, usuarioId) => {
  try {
    const publicacion = await Publicacion.findById(publicacionId);
    if (!publicacion) {
      throw new Error('Publicación no encontrada');
    }

    // Verificar que el usuario puede ver la publicación
    if (!publicacion.puedeVer(usuarioId)) {
      throw new Error('No tienes permisos para ver esta publicación');
    }

    // Buscar reacción existente
    let reaccion = await Reaccion.findOne({
      publicacionId,
      usuarioId
    });

    if (reaccion) {
      // Si ya existe, no hacer nada (ya tiene like)
      return {
        mensaje: 'Ya tienes un like en esta publicación',
        reaccion
      };
    }

    // Crear nueva reacción (solo like)
    reaccion = await Reaccion.create({
      publicacionId,
      usuarioId,
      tipo: 'like'
    });

    // Actualizar contador de likes en la publicación
    await Publicacion.findByIdAndUpdate(publicacionId, {
      $inc: { likes: 1 }
    });

    // Crear notificación para el autor de la publicación
    if (publicacion.autorId.toString() !== usuarioId.toString()) {
      const usuario = await Usuario.findById(usuarioId);
      await Notificacion.crearNotificacion(
        publicacion.autorId,
        usuarioId,
        'reaccion',
        `${usuario.nombreCompleto} le dio like a tu publicación`,
        `/publicacion/${publicacionId}`
      );
    }

    return {
      mensaje: 'Like agregado exitosamente',
      reaccion
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Quitar reacción de una publicación
 */
const quitarReaccionDePublicacion = async (publicacionId, usuarioId) => {
  try {
    const reaccion = await Reaccion.findOneAndDelete({
      publicacionId,
      usuarioId
    });

    if (!reaccion) {
      throw new Error('No tienes una reacción en esta publicación');
    }

    // Actualizar contador de likes en la publicación
    await Publicacion.findByIdAndUpdate(publicacionId, {
      $inc: { likes: -1 }
    });

    return {
      mensaje: 'Reacción eliminada exitosamente'
    };

  } catch (error) {
    throw error;
  }
};

// ==================== FEED ====================

/**
 * Obtener feed del usuario (publicaciones de usuarios seguidos)
 */
const obtenerFeed = async (usuarioId, pagina = 1, limite = 20) => {
  try {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener IDs de usuarios seguidos
    const usuariosSeguidos = usuario.seguidos;

    // Obtener publicaciones de usuarios seguidos y del propio usuario
    const publicaciones = await Publicacion.find({
      autorId: { $in: [...usuariosSeguidos, usuarioId] },
      visible: true,
      moderada: false
    })
      .populate('autorId', 'nombreCompleto fotoPerfil nombreUsuario anonimo')
      .sort({ fecha: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite);

    const total = await Publicacion.countDocuments({
      autorId: { $in: [...usuariosSeguidos, usuarioId] },
      visible: true,
      moderada: false
    });

    const totalPaginas = Math.ceil(total / limite);

    return {
      publicaciones,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

// ==================== BÚSQUEDA ====================

/**
 * Buscar usuarios
 */
const buscarUsuarios = async (termino, pagina = 1, limite = 20, usuarioActualId = null) => {
  try {
    const regex = new RegExp(termino, 'i');
    
    // Construir filtros de búsqueda
    const filtros = {
      $or: [
        { nombreCompleto: regex },
        { nombreUsuario: regex }
      ],
      activo: true,
      anonimo: false
    };
    
    // Excluir al usuario actual si se proporciona su ID
    if (usuarioActualId) {
      filtros._id = { $ne: usuarioActualId };
    }
    
    const usuarios = await Usuario.find(filtros)
      .select('nombreCompleto fotoPerfil nombreUsuario visibilidadPerfil anonimo seguidores')
      .sort({ nombreCompleto: 1 })
      .skip((pagina - 1) * limite)
      .limit(limite);

    // Aplicar restricciones de visualización usando la función auxiliar
    const usuariosService = require('./usuariosService');
    const usuariosFiltrados = usuarios.map(usuario => 
      usuariosService.aplicarRestriccionesVisualizacion(usuario, usuarioActualId, false)
    );

    const total = await Usuario.countDocuments(filtros);

    const totalPaginas = Math.ceil(total / limite);

    return {
      usuarios: usuariosFiltrados,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Buscar publicaciones
 */
const buscarPublicaciones = async (termino, pagina = 1, limite = 20) => {
  try {
    const regex = new RegExp(termino, 'i');
    
    const publicaciones = await Publicacion.find({
      contenido: regex,
      visible: true,
      moderada: false
    })
      .populate('autorId', 'nombreCompleto fotoPerfil nombreUsuario anonimo')
      .sort({ fecha: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite);

    const total = await Publicacion.countDocuments({
      contenido: regex,
      visible: true,
      moderada: false
    });

    const totalPaginas = Math.ceil(total / limite);

    return {
      publicaciones,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

// ==================== SOLICITUDES DE SEGUIMIENTO ====================

/**
 * Obtener solicitudes de seguimiento pendientes
 */
const obtenerSolicitudesSeguidores = async (usuarioId, pagina = 1, limite = 20) => {
  try {
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Filtrar solo las solicitudes pendientes
    const solicitudesPendientes = usuario.solicitudesSeguidores.filter(
      solicitud => solicitud.estado === 'pendiente'
    );

    // Aplicar paginación
    const inicio = (pagina - 1) * limite;
    const fin = inicio + limite;
    const solicitudesPagina = solicitudesPendientes.slice(inicio, fin);

    // Populate los usuarios de las solicitudes paginadas
    const solicitudesConUsuarios = await Promise.all(
      solicitudesPagina.map(async (solicitud) => {
        const usuarioSolicitante = await Usuario.findById(solicitud.usuarioId)
          .select('nombreCompleto fotoPerfil nombreUsuario');
        
        return {
          _id: solicitud._id,
          solicitante: usuarioSolicitante,
          fechaSolicitud: solicitud.fechaSolicitud,
          estado: solicitud.estado
        };
      })
    );

    const total = solicitudesPendientes.length;
    const totalPaginas = Math.ceil(total / limite);

    return {
      solicitudes: solicitudesConUsuarios,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalElementos: total,
        elementosPorPagina: limite
      }
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Aceptar solicitud de seguimiento
 */
const aceptarSolicitudSeguimiento = async (usuarioId, solicitanteId) => {
  try {
    const usuario = await Usuario.findById(usuarioId);
    const solicitante = await Usuario.findById(solicitanteId);

    if (!usuario || !solicitante) {
      throw new Error('Usuario no encontrado');
    }

    // Buscar la solicitud pendiente
    const solicitud = usuario.solicitudesSeguidores.find(
      s => s.usuarioId.toString() === solicitanteId.toString() && s.estado === 'pendiente'
    );

    if (!solicitud) {
      throw new Error('No se encontró una solicitud pendiente de este usuario');
    }

    // Marcar solicitud como aceptada
    solicitud.estado = 'aceptada';

    // Agregar a seguidos y seguidores
    if (!solicitante.seguidos.includes(usuarioId)) {
      solicitante.seguidos.push(usuarioId);
    }
    if (!usuario.seguidores.includes(solicitanteId)) {
      usuario.seguidores.push(solicitanteId);
    }

    await Promise.all([usuario.save(), solicitante.save()]);

    // Crear notificación de aceptación
    await Notificacion.crearNotificacion(
      solicitanteId,
      usuarioId,
      'solicitud_aceptada',
      `${usuario.nombreCompleto} aceptó tu solicitud de seguimiento`,
      `/perfil/${usuarioId}`
    );

    return {
      mensaje: 'Solicitud de seguimiento aceptada',
      seguidores: usuario.seguidores.length,
      seguidos: solicitante.seguidos.length
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Rechazar solicitud de seguimiento
 */
const rechazarSolicitudSeguimiento = async (usuarioId, solicitanteId) => {
  try {
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Buscar la solicitud pendiente
    const solicitud = usuario.solicitudesSeguidores.find(
      s => s.usuarioId.toString() === solicitanteId.toString() && s.estado === 'pendiente'
    );

    if (!solicitud) {
      throw new Error('No se encontró una solicitud pendiente de este usuario');
    }

    // Marcar solicitud como rechazada
    solicitud.estado = 'rechazada';

    await usuario.save();

    return {
      mensaje: 'Solicitud de seguimiento rechazada'
    };

  } catch (error) {
    throw error;
  }
};

module.exports = {
  // Seguidores
  seguirUsuario,
  dejarDeSeguirUsuario,
  obtenerSeguidores,
  obtenerSeguidos,
  
  // Solicitudes de seguimiento
  obtenerSolicitudesSeguidores,
  aceptarSolicitudSeguimiento,
  rechazarSolicitudSeguimiento,
  
  // Bloqueos
  bloquearUsuario,
  desbloquearUsuario,
  obtenerUsuariosBloqueados,
  
  // Notificaciones
  obtenerNotificaciones,
  marcarNotificacionComoLeida,
  marcarTodasLasNotificacionesComoLeidas,
  
  // Reacciones
  reaccionarAPublicacion,
  quitarReaccionDePublicacion,
  
  // Feed
  obtenerFeed,
  
  // Búsqueda
  buscarUsuarios,
  buscarPublicaciones
};

const Chat = require('../models/Chat');
const MensajeChat = require('../models/MensajeChat');
const Usuario = require('../models/Usuario');
const Notificacion = require('../models/Notificacion');
const multerChat = require('../utils/multerChat');

/**
 * Servicio para manejar funcionalidades de chat
 */

/**
 * Crear un nuevo chat entre dos usuarios
 */
const crearChat = async (usuarioId1, usuarioId2) => {
  try {
    // Verificar que ambos usuarios existen
    const usuarios = await Usuario.find({
      _id: { $in: [usuarioId1, usuarioId2] },
      activo: true
    });

    if (usuarios.length !== 2) {
      throw new Error('Uno o ambos usuarios no existen o no están activos');
    }

    // Verificar que no existe ya un chat entre estos usuarios
    const chatExistente = await Chat.findOne({
      participantes: { $all: [usuarioId1, usuarioId2] }
    });

    if (chatExistente) {
      return chatExistente;
    }

    // Crear nuevo chat
    const chat = new Chat({
      participantes: [usuarioId1, usuarioId2]
    });

    await chat.save();
    await chat.populate('participantes', 'nombreCompleto fotoPerfil nombreUsuario');

    return chat;

  } catch (error) {
    throw error;
  }
};

/**
 * Obtener chats de un usuario
 */
const obtenerChats = async (usuarioId, pagina = 1, limite = 20) => {
  try {
    const chats = await Chat.find({
      participantes: usuarioId,
      activo: true
    })
      .populate('participantes', 'nombreCompleto fotoPerfil nombreUsuario')
      .sort({ ultimoMensaje: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite);

    const total = await Chat.countDocuments({
      participantes: usuarioId,
      activo: true
    });

    const totalPaginas = Math.ceil(total / limite);

    return {
      chats,
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
 * Obtener un chat específico
 */
const obtenerChatPorId = async (chatId, usuarioId) => {
  try {
    const chat = await Chat.findOne({
      _id: chatId,
      participantes: usuarioId,
      activo: true
    }).populate('participantes', 'nombreCompleto fotoPerfil nombreUsuario');

    if (!chat) {
      throw new Error('Chat no encontrado o no tienes acceso a él');
    }

    return chat;

  } catch (error) {
    throw error;
  }
};

/**
 * Enviar un mensaje en un chat
 */
const enviarMensaje = async (chatId, emisorId, contenido, esTemporal = false, expiraEn = null, archivosAdjuntos = []) => {
  try {
    // Verificar que el chat existe y el usuario participa en él
    const chat = await Chat.findOne({
      _id: chatId,
      participantes: emisorId,
      activo: true
    });

    if (!chat) {
      throw new Error('Chat no encontrado o no tienes acceso a él');
    }

    // Validar mensaje temporal
    if (esTemporal && expiraEn) {
      const ahora = new Date();
      const fechaExpiracion = new Date(expiraEn);
      const unDia = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
      
      // Verificar que la fecha de expiración sea en el futuro
      if (fechaExpiracion <= ahora) {
        throw new Error('La fecha de expiración debe ser en el futuro');
      }
      
      // Verificar que no dure más de 1 día
      if (fechaExpiracion.getTime() - ahora.getTime() > unDia) {
        throw new Error('Los mensajes temporales no pueden durar más de 1 día');
      }
    }

    // Crear mensaje
    const mensaje = new MensajeChat({
      chatId,
      emisorId,
      contenido,
      esTemporal,
      expiraEn: esTemporal ? expiraEn : null,
      archivosAdjuntos: archivosAdjuntos || []
    });

    await mensaje.save();
    await mensaje.populate('emisorId', 'nombreCompleto fotoPerfil nombreUsuario');

    // Actualizar último mensaje del chat
    chat.ultimoMensaje = mensaje.fecha;
    await chat.save();

    // Crear notificaciones para los otros participantes
    const otrosParticipantes = chat.participantes.filter(p => p.toString() !== emisorId.toString());
    
    for (const participanteId of otrosParticipantes) {
      await Notificacion.crearNotificacion(
        participanteId,
        emisorId,
        'mensaje_privado',
        `Nuevo mensaje de ${mensaje.emisorId.nombreCompleto}`,
        `/chat/${chatId}`
      );
    }

    return mensaje;

  } catch (error) {
    throw error;
  }
};

/**
 * Obtener mensajes de un chat
 */
const obtenerMensajes = async (chatId, usuarioId, pagina = 1, limite = 50) => {
  try {
    // Verificar que el usuario participa en el chat
    const chat = await Chat.findOne({
      _id: chatId,
      participantes: usuarioId,
      activo: true
    });

    if (!chat) {
      throw new Error('Chat no encontrado o no tienes acceso a él');
    }

    // Obtener fecha actual en UTC (los mensajes se guardan en UTC)
    const ahora = new Date();
    
    console.log(`🌍 Fecha actual UTC: ${ahora.toISOString()}`);

    const mensajes = await MensajeChat.find({
      chatId,
      $or: [
        { esTemporal: false },
        { 
          esTemporal: true, 
          expiraEn: { $gt: ahora } // Solo mensajes temporales que no han expirado
        }
      ]
    })
      .populate('emisorId', 'nombreCompleto fotoPerfil nombreUsuario')
      .sort({ fecha: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite);

    const total = await MensajeChat.countDocuments({
      chatId,
      $or: [
        { esTemporal: false },
        { 
          esTemporal: true, 
          expiraEn: { $gt: ahora } // Solo mensajes temporales que no han expirado
        }
      ]
    });

    const totalPaginas = Math.ceil(total / limite);

    return {
      mensajes: mensajes.reverse(), // Ordenar cronológicamente
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
 * Marcar mensajes como leídos
 */
const marcarMensajesComoLeidos = async (chatId, usuarioId) => {
  try {
    // Verificar que el usuario participa en el chat
    const chat = await Chat.findOne({
      _id: chatId,
      participantes: usuarioId,
      activo: true
    });

    if (!chat) {
      throw new Error('Chat no encontrado o no tienes acceso a él');
    }

    // Marcar mensajes no leídos como leídos
    await MensajeChat.updateMany(
      {
        chatId,
        emisorId: { $ne: usuarioId },
        leido: false
      },
      {
        leido: true,
        leidoEn: new Date()
      }
    );

    return {
      mensaje: 'Mensajes marcados como leídos'
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Eliminar un mensaje
 */
const eliminarMensaje = async (mensajeId, usuarioId) => {
  try {
    const mensaje = await MensajeChat.findOne({
      _id: mensajeId,
      emisorId: usuarioId
    });

    if (!mensaje) {
      throw new Error('Mensaje no encontrado o no tienes permisos para eliminarlo');
    }

    await MensajeChat.findByIdAndDelete(mensajeId);

    return {
      mensaje: 'Mensaje eliminado exitosamente'
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Eliminar un chat
 */
const eliminarChat = async (chatId, usuarioId) => {
  try {
    const chat = await Chat.findOne({
      _id: chatId,
      participantes: usuarioId,
      activo: true
    });

    if (!chat) {
      throw new Error('Chat no encontrado o no tienes acceso a él');
    }

    // Marcar chat como inactivo
    chat.activo = false;
    await chat.save();

    return {
      mensaje: 'Chat eliminado exitosamente'
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Limpiar mensajes temporales expirados
 */
const limpiarMensajesExpirados = async () => {
  try {
    const resultado = await MensajeChat.deleteMany({
      esTemporal: true,
      expiraEn: { $lt: new Date() }
    });

    console.log(`✅ Eliminados ${resultado.deletedCount} mensajes temporales expirados`);
    return resultado;

  } catch (error) {
    console.error('❌ Error limpiando mensajes expirados:', error);
    throw error;
  }
};

const subirArchivosAMensaje = async (chatId, mensajeId, files = [], usuarioId = null) => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No se recibieron archivos');
    }

    // Validar existencia del mensaje y pertenencia al chat
    const mensaje = await MensajeChat.findById(mensajeId);
    if (!mensaje) throw new Error('Mensaje no encontrado o no pertenece al chat');
    if (String(mensaje.chatId) !== String(chatId)) throw new Error('Mensaje no encontrado o no pertenece al chat');

    // Mapear archivos (multer file objects) a la estructura de almacenamiento en el mensaje
    const nuevosAdjuntos = files.map(f => ({
      nombre: f.originalname || f.filename,
      filename: f.filename || null,
      url: multerChat.obtenerUrlArchivo(f.filename || ''), // utilitario para construir URL
      mimetype: f.mimetype || '',
      tamaño: f.size || 0,
      almacenadoEn: f.path || ''
    }));

    // Añadir adjuntos y persistir
    mensaje.archivosAdjuntos = Array.isArray(mensaje.archivosAdjuntos)
      ? mensaje.archivosAdjuntos.concat(nuevosAdjuntos)
      : nuevosAdjuntos;

    await mensaje.save();
    await mensaje.populate('emisorId', 'nombreCompleto fotoPerfil nombreUsuario');

    return mensaje;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  crearChat,
  obtenerChats,
  obtenerChatPorId,
  enviarMensaje,
  obtenerMensajes,
  marcarMensajesComoLeidos,
  eliminarMensaje,
  eliminarChat,
  limpiarMensajesExpirados,
  subirArchivosAMensaje
};

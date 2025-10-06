const chatService = require('../services/chatService');
const MensajeChat = require('../models/MensajeChat');
const { config } = require('../config');
const { uploadCualquierArchivoChat } = require('../utils/multerChat');

/**
 * @desc    Crear un nuevo chat
 * @route   POST /api/chat
 * @access  Private
 */
const crearChat = async (req, res) => {
  try {
    const { usuarioId } = req.body;
    const usuarioActualId = req.usuario.userId;

    if (!usuarioId) {
      return res.status(400).json({
        error: 'Usuario requerido',
        detalles: 'Debes especificar el ID del usuario con quien quieres chatear'
      });
    }

    if (usuarioId === usuarioActualId) {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: 'No puedes crear un chat contigo mismo'
      });
    }

    const chat = await chatService.crearChat(usuarioActualId, usuarioId);

    res.status(201).json({
      mensaje: 'Chat creado exitosamente',
      chat,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al crear chat:', error);

    if (error.message === 'Uno o ambos usuarios no existen o no están activos') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
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
 * @desc    Obtener chats del usuario
 * @route   GET /api/chat
 * @access  Private
 */
const obtenerChats = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const { pagina = 1, limite = 20 } = req.query;

    const resultado = await chatService.obtenerChats(usuarioActualId, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener chats:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener un chat específico
 * @route   GET /api/chat/:chatId
 * @access  Private
 */
const obtenerChatPorId = async (req, res) => {
  try {
    const { chatId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const chat = await chatService.obtenerChatPorId(chatId, usuarioActualId);

    res.json({
      mensaje: 'Chat obtenido exitosamente',
      chat,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener chat:', error);

    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({
        error: 'Chat no encontrado',
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
 * @desc    Enviar un mensaje
 * @route   POST /api/chat/:chatId/mensajes
 * @access  Private
 */
const enviarMensaje = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { contenido, esTemporal, expiraEn } = req.body;
    const usuarioActualId = req.usuario.userId;

    if (!contenido) {
      return res.status(400).json({
        error: 'Contenido requerido',
        detalles: 'El mensaje debe tener contenido de texto'
      });
    }

    const mensaje = await chatService.enviarMensaje(
      chatId,
      usuarioActualId,
      contenido,
      esTemporal || false,
      expiraEn ? new Date(expiraEn) : null,
      [] // Sin archivos adjuntos en este endpoint
    );

    res.status(201).json({
      mensaje: 'Mensaje enviado exitosamente',
      mensajeEnviado: mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);

    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({
        error: 'Chat no encontrado',
        detalles: error.message
      });
    }

    if (error.message === 'Los mensajes temporales no pueden durar más de 1 día') {
      return res.status(400).json({
        error: 'Tiempo de expiración inválido',
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
 * @desc    Subir archivos adjuntos a un mensaje
 * @route   POST /api/chat/:chatId/mensajes/:mensajeId/archivos
 * @access  Private
 */
const subirArchivosAMensaje = async (req, res) => {
  try {
    const { chatId, mensajeId } = req.params;
    const usuarioActualId = req.usuario.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Archivos requeridos',
        detalles: 'Debes proporcionar al menos un archivo'
      });
    }

    // Verificar que el mensaje existe y pertenece al usuario
    const mensaje = await MensajeChat.findOne({
      _id: mensajeId,
      chatId: chatId,
      emisorId: usuarioActualId
    });

    if (!mensaje) {
      return res.status(404).json({
        error: 'Mensaje no encontrado',
        detalles: 'El mensaje no existe o no tienes permisos para modificarlo'
      });
    }

    // Procesar archivos adjuntos
    const archivosAdjuntos = req.files.map(file => file.path);

    // Actualizar el mensaje con los nuevos archivos
    mensaje.archivosAdjuntos = [...mensaje.archivosAdjuntos, ...archivosAdjuntos];
    await mensaje.save();

    res.json({
      mensaje: 'Archivos adjuntos agregados exitosamente',
      archivosAdjuntos: mensaje.archivosAdjuntos,
      archivosNuevos: archivosAdjuntos,
      totalArchivos: mensaje.archivosAdjuntos.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al subir archivos al mensaje:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener mensajes de un chat
 * @route   GET /api/chat/:chatId/mensajes
 * @access  Private
 */
const obtenerMensajes = async (req, res) => {
  try {
    const { chatId } = req.params;
    const usuarioActualId = req.usuario.userId;
    const { pagina = 1, limite = 50 } = req.query;

    const resultado = await chatService.obtenerMensajes(chatId, usuarioActualId, parseInt(pagina), parseInt(limite));

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener mensajes:', error);

    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({
        error: 'Chat no encontrado',
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
 * @desc    Marcar mensajes como leídos
 * @route   PATCH /api/chat/:chatId/mensajes/leer
 * @access  Private
 */
const marcarMensajesComoLeidos = async (req, res) => {
  try {
    const { chatId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await chatService.marcarMensajesComoLeidos(chatId, usuarioActualId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al marcar mensajes como leídos:', error);

    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({
        error: 'Chat no encontrado',
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
 * @desc    Eliminar un mensaje
 * @route   DELETE /api/chat/mensajes/:mensajeId
 * @access  Private
 */
const eliminarMensaje = async (req, res) => {
  try {
    const { mensajeId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await chatService.eliminarMensaje(mensajeId, usuarioActualId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al eliminar mensaje:', error);

    if (error.message === 'Mensaje no encontrado o no tienes permisos para eliminarlo') {
      return res.status(404).json({
        error: 'Mensaje no encontrado',
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
 * @desc    Eliminar un chat
 * @route   DELETE /api/chat/:chatId
 * @access  Private
 */
const eliminarChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const usuarioActualId = req.usuario.userId;

    const resultado = await chatService.eliminarChat(chatId, usuarioActualId);

    res.json({
      mensaje: resultado.mensaje,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al eliminar chat:', error);

    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({
        error: 'Chat no encontrado',
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
  crearChat,
  obtenerChats,
  obtenerChatPorId,
  enviarMensaje,
  subirArchivosAMensaje,
  obtenerMensajes,
  marcarMensajesComoLeidos,
  eliminarMensaje,
  eliminarChat
};

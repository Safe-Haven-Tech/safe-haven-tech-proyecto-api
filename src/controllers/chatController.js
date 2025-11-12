
const chatService = require('../services/chatService');
const MensajeChat = require('../models/MensajeChat');
const { config } = require('../config');


const crearChat = async (req, res) => {
  try {
    const usuarioActualId = req.usuario?.userId;
    const usuarioId = req.body?.usuarioId;
    if (!usuarioId) return res.status(400).json({ error: 'Usuario requerido', detalles: 'Debes especificar el ID del usuario con quien quieres chatear' });
    if (usuarioId === usuarioActualId) return res.status(400).json({ error: 'Acción no permitida', detalles: 'No puedes crear un chat contigo mismo' });

    const chat = await chatService.crearChat(usuarioActualId, usuarioId);
    return res.status(201).json({ mensaje: 'Chat creado exitosamente', chat, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('crearChat:', error);
    if (error.message && error.message.includes('no existen')) {
      return res.status(404).json({ error: 'Usuario no encontrado', detalles: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
  }
};

const obtenerChats = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const pagina = parseInt(req.query.pagina || req.query.page || '1', 10);
    const limite = parseInt(req.query.limite || req.query.limit || '20', 10);

    const resultado = await chatService.obtenerChats(usuarioActualId, pagina, limite);
    return res.json({ ...resultado, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('obtenerChats:', error);
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
  }
};

const obtenerChatPorId = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const chatId = req.params.chatId || req.params.id;
    const chat = await chatService.obtenerChatPorId(chatId, usuarioActualId);
    return res.json({ mensaje: 'Chat obtenido exitosamente', chat, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('obtenerChatPorId:', error);
    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({ error: 'Chat no encontrado', detalles: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
  }
};

const obtenerMensajes = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const chatId = req.params.chatId || req.params.id;
    const pagina = parseInt(req.query.pagina || req.query.page || '1', 10);
    const limite = parseInt(req.query.limite || req.query.limit || '50', 10);

    const resultado = await chatService.obtenerMensajes(chatId, usuarioActualId, pagina, limite);
    return res.json({ ...resultado, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('obtenerMensajes:', error);
    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({ error: 'Chat no encontrado', detalles: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
  }
};

const enviarMensaje = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const chatId = req.params.chatId || req.params.id;
    const { contenido = '', esTemporal = false, expiraEn = null } = req.body;

    if (!contenido && !(req.files && req.files.length > 0)) {
      return res.status(400).json({ error: 'Contenido requerido', detalles: 'El mensaje debe tener texto o archivos adjuntos' });
    }

    // crear mensaje sin archivos; si hay archivos se subirán en endpoint separado
    const mensaje = await chatService.enviarMensaje(chatId, usuarioActualId, contenido, !!esTemporal, expiraEn ? new Date(expiraEn) : null, []);
    return res.status(201).json({ mensaje: 'Mensaje enviado exitosamente', mensajeEnviado: mensaje, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('enviarMensaje:', error);
    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({ error: 'Chat no encontrado', detalles: error.message });
    }
    if (error.message === 'Los mensajes temporales no pueden durar más de 1 día') {
      return res.status(400).json({ error: 'Tiempo de expiración inválido', detalles: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
  }
};

const subirArchivosAMensaje = async (req, res) => {
  try {
    const { chatId, mensajeId } = req.params;
    console.log('[subirArchivosAMensaje] params:', req.params);
    console.log('[subirArchivosAMensaje] files:', Array.isArray(req.files) ? req.files.map(f => ({ field: f.fieldname, filename: f.filename })) : req.files);
    const files = Array.isArray(req.files) ? req.files : (req.files && req.files.archivosAdjuntos) ? req.files.archivosAdjuntos : [];
    if (!files.length) return res.status(400).json({ error: 'No se recibieron archivos' });
    const result = await chatService.subirArchivosAMensaje(chatId, mensajeId, files, req.usuario?.userId);
    return res.json({ mensaje: result });
  } catch (err) {
    console.error('subirArchivosAMensaje error:', err.stack || err);
    return res.status(500).json({ error: 'Error interno del servidor', detalles: err.message });
  }
};

const marcarMensajesComoLeidos = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const chatId = req.params.chatId || req.params.id;
    const resultado = await chatService.marcarMensajesComoLeidos(chatId, usuarioActualId);
    return res.json({ mensaje: resultado.mensaje, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('marcarMensajesComoLeidos:', error);
    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({ error: 'Chat no encontrado', detalles: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
  }
};

const eliminarMensaje = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const mensajeId = req.params.mensajeId;
    const resultado = await chatService.eliminarMensaje(mensajeId, usuarioActualId);
    return res.json({ mensaje: resultado.mensaje, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('eliminarMensaje:', error);
    if (error.message && error.message.includes('no tienes permisos')) {
      return res.status(404).json({ error: 'Mensaje no encontrado', detalles: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
  }
};

const eliminarChat = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.userId;
    const chatId = req.params.chatId || req.params.id;
    const resultado = await chatService.eliminarChat(chatId, usuarioActualId);
    return res.json({ mensaje: resultado.mensaje, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('eliminarChat:', error);
    if (error.message === 'Chat no encontrado o no tienes acceso a él') {
      return res.status(404).json({ error: 'Chat no encontrado', detalles: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor', detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud' });
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

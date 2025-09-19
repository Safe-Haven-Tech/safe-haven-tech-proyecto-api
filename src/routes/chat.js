const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { autenticarToken } = require('../middlewares/auth');
const { uploadCualquierArchivoChat } = require('../utils/multerChat');

// Middleware para manejar errores de Multer
const handleMulterError = (error, req, res, next) => {
  if (error) {
    console.error('❌ Error en multer:', error);
    return res.status(400).json({
      error: 'Error procesando archivos',
      detalles: error.message
    });
  }
  next();
};

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticarToken);

/**
 * @route   POST /api/chat
 * @desc    Crear un nuevo chat
 * @access  Private
 */
router.post('/', chatController.crearChat);

/**
 * @route   GET /api/chat
 * @desc    Obtener chats del usuario
 * @access  Private
 */
router.get('/', chatController.obtenerChats);

/**
 * @route   GET /api/chat/:chatId
 * @desc    Obtener un chat específico
 * @access  Private
 */
router.get('/:chatId', chatController.obtenerChatPorId);

/**
 * @route   POST /api/chat/:chatId/mensajes
 * @desc    Enviar un mensaje
 * @access  Private
 */
router.post('/:chatId/mensajes', uploadCualquierArchivoChat, handleMulterError, chatController.enviarMensaje);

/**
 * @route   GET /api/chat/:chatId/mensajes
 * @desc    Obtener mensajes de un chat
 * @access  Private
 */
router.get('/:chatId/mensajes', chatController.obtenerMensajes);

/**
 * @route   PATCH /api/chat/:chatId/mensajes/leer
 * @desc    Marcar mensajes como leídos
 * @access  Private
 */
router.patch('/:chatId/mensajes/leer', chatController.marcarMensajesComoLeidos);

/**
 * @route   DELETE /api/chat/mensajes/:mensajeId
 * @desc    Eliminar un mensaje
 * @access  Private
 */
router.delete('/mensajes/:mensajeId', chatController.eliminarMensaje);

/**
 * @route   DELETE /api/chat/:chatId
 * @desc    Eliminar un chat
 * @access  Private
 */
router.delete('/:chatId', chatController.eliminarChat);

module.exports = router;

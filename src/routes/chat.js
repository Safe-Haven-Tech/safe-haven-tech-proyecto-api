const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { autenticarToken } = require('../middlewares/auth');
const multerChat = require('../utils/multerChat');

/**
 * Rutas de Chat
 * - Todas protegidas por autenticarToken
 * - Subida de archivos usa multerChat (array name: 'archivosAdjuntos')
 */

router.post('/', autenticarToken, chatController.crearChat);
router.get('/', autenticarToken, chatController.obtenerChats);
router.get('/:chatId', autenticarToken, chatController.obtenerChatPorId);

router.get('/:chatId/mensajes', autenticarToken, chatController.obtenerMensajes);
router.post('/:chatId/mensajes', autenticarToken, chatController.enviarMensaje);

// Subir archivos para un mensaje (multer)
router.post(
  '/:chatId/mensajes/:mensajeId/archivos',
  autenticarToken,
  multerChat.uploadArchivosChat,
  chatController.subirArchivosAMensaje
);

router.patch('/:chatId/mensajes/leer', autenticarToken, chatController.marcarMensajesComoLeidos);
router.delete('/mensajes/:mensajeId', autenticarToken, chatController.eliminarMensaje);
router.delete('/:chatId', autenticarToken, chatController.eliminarChat);

module.exports = router;
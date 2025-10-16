const express = require('express');
const router = express.Router();
const redSocialController = require('../controllers/redSocialController');
const { autenticarToken } = require('../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticarToken);

// ==================== SEGUIDORES ====================

/**
 * @route   POST /api/red-social/seguir/:usuarioId
 * @desc    Seguir a un usuario
 * @access  Private
 */
router.post('/seguir/:usuarioId', redSocialController.seguirUsuario);

/**
 * @route   DELETE /api/red-social/seguir/:usuarioId
 * @desc    Dejar de seguir a un usuario
 * @access  Private
 */
router.delete('/seguir/:usuarioId', redSocialController.dejarDeSeguirUsuario);

/**
 * @route   GET /api/red-social/seguidores/:usuarioId
 * @desc    Obtener seguidores de un usuario
 * @access  Private
 */
router.get('/seguidores/:usuarioId', redSocialController.obtenerSeguidores);

/**
 * @route   GET /api/red-social/seguidos/:usuarioId
 * @desc    Obtener usuarios seguidos
 * @access  Private
 */
router.get('/seguidos/:usuarioId', redSocialController.obtenerSeguidos);

// ==================== SOLICITUDES DE SEGUIMIENTO ====================

/**
 * @route   GET /api/red-social/solicitudes
 * @desc    Obtener solicitudes de seguimiento pendientes
 * @access  Private
 */
router.get('/solicitudes', redSocialController.obtenerSolicitudesSeguidores);

/**
 * @route   POST /api/red-social/solicitudes/:solicitanteId/aceptar
 * @desc    Aceptar solicitud de seguimiento
 * @access  Private
 */
router.post('/solicitudes/:solicitanteId/aceptar', redSocialController.aceptarSolicitudSeguimiento);

/**
 * @route   POST /api/red-social/solicitudes/:solicitanteId/rechazar
 * @desc    Rechazar solicitud de seguimiento
 * @access  Private
 */
router.post('/solicitudes/:solicitanteId/rechazar', redSocialController.rechazarSolicitudSeguimiento);

/**
 * @route   DELETE /api/red-social/solicitud/:usuarioId
 * @desc    Cancelar solicitud de seguimiento
 * @access  Private
 */
router.delete('/solicitud/:usuarioId',  redSocialController.cancelarSolicitudSeguimiento);

// ==================== BLOQUEOS ====================

/**
 * @route   POST /api/red-social/bloquear/:usuarioId
 * @desc    Bloquear a un usuario
 * @access  Private
 */
router.post('/bloquear/:usuarioId', redSocialController.bloquearUsuario);

/**
 * @route   DELETE /api/red-social/bloquear/:usuarioId
 * @desc    Desbloquear a un usuario
 * @access  Private
 */
router.delete('/bloquear/:usuarioId', redSocialController.desbloquearUsuario);

/**
 * @route   GET /api/red-social/bloqueados
 * @desc    Obtener usuarios bloqueados
 * @access  Private
 */
router.get('/bloqueados', redSocialController.obtenerUsuariosBloqueados);

// ==================== NOTIFICACIONES ====================

/**
 * @route   GET /api/red-social/notificaciones
 * @desc    Obtener notificaciones del usuario
 * @access  Private
 */
router.get('/notificaciones', redSocialController.obtenerNotificaciones);

/**
 * @route   PATCH /api/red-social/notificaciones/:notificacionId/leer
 * @desc    Marcar notificación como leída
 * @access  Private
 */
router.patch('/notificaciones/:notificacionId/leer', redSocialController.marcarNotificacionComoLeida);

/**
 * @route   PATCH /api/red-social/notificaciones/leer-todas
 * @desc    Marcar todas las notificaciones como leídas
 * @access  Private
 */
router.patch('/notificaciones/leer-todas', redSocialController.marcarTodasLasNotificacionesComoLeidas);

// ==================== REACCIONES ====================

/**
 * @route   POST /api/red-social/reaccionar/:publicacionId
 * @desc    Reaccionar a una publicación
 * @access  Private
 */
router.post('/reaccionar/:publicacionId', redSocialController.reaccionarAPublicacion);

/**
 * @route   DELETE /api/red-social/reaccionar/:publicacionId
 * @desc    Quitar reacción de una publicación
 * @access  Private
 */
router.delete('/reaccionar/:publicacionId', redSocialController.quitarReaccionDePublicacion);

// ==================== FEED ====================

/**
 * @route   GET /api/red-social/feed
 * @desc    Obtener feed del usuario
 * @access  Private
 */
router.get('/feed', redSocialController.obtenerFeed);

// ==================== BÚSQUEDA ====================

/**
 * @route   GET /api/red-social/buscar/usuarios
 * @desc    Buscar usuarios
 * @access  Private
 */
router.get('/buscar/usuarios', redSocialController.buscarUsuarios);

/**
 * @route   GET /api/red-social/buscar/publicaciones
 * @desc    Buscar publicaciones
 * @access  Private
 */
router.get('/buscar/publicaciones', redSocialController.buscarPublicaciones);

module.exports = router;

const express = require('express');
const router = express.Router();

// controlador central (incluye funciones admin: listPostulaciones, getPostulacionById, decidirPostulacion)
const controller = require('../controllers/postulacionesController');

const { autenticarToken, verificarRol, verificarUsuarioActivo } = require('../middlewares/auth');
const { validarIdMongo } = require('../middlewares/validacion');
const { uploadPostulacion } = require('../utils/multerPostulaciones');

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

/**
 * RUTAS PÚBLICAS / USUARIO
 */

/**
 * @route   POST /api/postulaciones/profesional
 * @desc    Crear una nueva postulación a profesional (sin archivos)
 * @access  Private (solo usuarios con rol 'usuario' o admin)
 */
router.post(
  '/profesional',
  autenticarToken,
  verificarUsuarioActivo,
  verificarRol(['usuario', 'administrador']),
  controller.crearPostulacion
);

/**
 * @route   POST /api/postulaciones/profesional/:id/documentos
 * @desc    Subir documentos a una postulación existente
 * @access  Private (usuario propietario)
 */
router.post(
  '/profesional/:id/documentos',
  autenticarToken,
  verificarUsuarioActivo,
  validarIdMongo,
  uploadPostulacion.array('documentos', 5),
  handleMulterError,
  controller.subirDocumentos
);

/**
 * @route   GET /api/postulaciones/profesional/mis-postulaciones
 * @desc    Obtener mis postulaciones
 * @access  Private
 */
router.get(
  '/profesional/mis-postulaciones',
  autenticarToken,
  verificarUsuarioActivo,
  controller.obtenerMisPostulaciones
);

/**
 * @route   GET /api/postulaciones/profesional/estadisticas
 * @desc    Obtener estadísticas de postulaciones
 * @access  Private (solo administradores)
 */
router.get(
  '/profesional/estadisticas',
  autenticarToken,
  verificarRol('administrador'),
  controller.obtenerEstadisticas
);

/**
 * @route   GET /api/postulaciones/profesional
 * @desc    Obtener todas las postulaciones (con filtros y paginación)
 * @access  Private (solo administradores)
 */
router.get(
  '/profesional',
  autenticarToken,
  verificarRol('administrador'),
  controller.obtenerPostulaciones
);

/**
 * @route   GET /api/postulaciones/profesional/:id
 * @desc    Obtener una postulación por ID
 * @access  Private (administradores o el usuario que postuló)
 */
router.get(
  '/profesional/:id',
  autenticarToken,
  verificarUsuarioActivo,
  validarIdMongo,
  controller.obtenerPostulacionPorId
);

/**
 * @route   PATCH /api/postulaciones/profesional/:id/aprobar
 * @desc    Aprobar una postulación
 * @access  Private (solo administradores)
 */
router.patch(
  '/profesional/:id/aprobar',
  autenticarToken,
  verificarRol('administrador'),
  validarIdMongo,
  controller.aprobarPostulacion
);

/**
 * @route   PATCH /api/postulaciones/profesional/:id/rechazar
 * @desc    Rechazar una postulación
 * @access  Private (solo administradores)
 */
router.patch(
  '/profesional/:id/rechazar',
  autenticarToken,
  verificarRol('administrador'),
  validarIdMongo,
  controller.rechazarPostulacion
);

/**
 * @route   DELETE /api/postulaciones/profesional/:id
 * @desc    Eliminar una postulación rechazada
 * @access  Private (usuario que postuló)
 */
router.delete(
  '/profesional/:id',
  autenticarToken,
  verificarUsuarioActivo,
  validarIdMongo,
  controller.eliminarPostulacion
);

/**
 * RUTAS ADMIN (mount bajo /api/postulaciones/admin)
 * Protegidas: autenticarToken + verificarRol('administrador')
 * Nota: se reutiliza el mismo controlador que ya expone las funciones admin.
 */
router.get(
  '/admin',
  autenticarToken,
  verificarRol('administrador'),
  controller.listPostulaciones
);

router.get(
  '/admin/:id',
  autenticarToken,
  verificarRol('administrador'),
  validarIdMongo,
  controller.getPostulacionById
);

router.patch(
  '/admin/:id/decidir',
  autenticarToken,
  verificarRol('administrador'),
  validarIdMongo,
  controller.decidirPostulacion
);

module.exports = router;
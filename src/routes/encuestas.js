const express = require('express');
const router = express.Router();

const {
  crearEncuesta,
  obtenerEncuestas,
  obtenerEncuestaPorId,
  actualizarEncuesta,
  desactivarEncuesta,
  activarEncuesta,
  iniciarEncuesta,
  guardarRespuestaParcial,
  completarEncuesta,
  completarEncuestaDirecta,
  obtenerRespuestasUsuario,
  obtenerEstadisticasEncuesta,
  completarEncuestaSinAuth,
  eliminarEncuesta,
} = require('../controllers/encuestasController');

const { verificarRol, autenticarToken,autenticacionOpcional } = require('../middlewares/auth');

// ======================= RUTAS PÚBLICAS =======================
router.get('/', obtenerEncuestas);
router.get('/:id', obtenerEncuestaPorId);

// Completar encuesta sin autenticación (genera PDF) - PÚBLICA
router.post('/:id/completar-sin-auth', completarEncuestaSinAuth);

// Completar encuesta con o sin autenticación (genera PDF) - PÚBLICA OPCIONAL
router.post('/:id/completar', autenticacionOpcional, completarEncuesta);

// ======================= RUTAS PRIVADAS =======================
// Todas las rutas a partir de aquí requieren autenticación
//router.use(proteger);

// ======================= RUTAS DE USUARIOS =======================
// Iniciar una encuesta
router.post('/:id/iniciar',autenticarToken, iniciarEncuesta);

// Guardar respuesta parcial
router.put('/respuestas/:respuestaId/parcial',autenticarToken, guardarRespuestaParcial);

// Completar encuesta
router.put('/respuestas/:respuestaId/completar',autenticarToken, completarEncuesta);

// Obtener respuestas del usuario autenticado
router.get('/respuestas/usuario',autenticarToken, obtenerRespuestasUsuario);

// ======================= RUTAS DE ADMINISTRADORES =======================
router.post('/', [autenticarToken, verificarRol('administrador')], crearEncuesta);
router.put('/:id', [autenticarToken, verificarRol('administrador')], actualizarEncuesta);
router.put('/:id/desactivar', [autenticarToken, verificarRol('administrador')], desactivarEncuesta);
router.put('/:id/activar', [autenticarToken, verificarRol('administrador')], activarEncuesta);
router.get('/:id/estadisticas', [autenticarToken, verificarRol('administrador')], obtenerEstadisticasEncuesta);
router.delete('/:id', [autenticarToken, verificarRol('administrador')], eliminarEncuesta);

module.exports = router;

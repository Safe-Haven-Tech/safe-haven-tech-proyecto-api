const express = require('express');
const router = express.Router();

const {
  crearEncuesta,
  obtenerEncuestas,
  obtenerEncuestaPorId,
  actualizarEncuesta,
  desactivarEncuesta,
  activarEncuesta,
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
router.post('/:id/completar-sin-auth', completarEncuestaSinAuth); // opcional, si quieres mantener compatibilidad
router.post('/:id/completar', autenticacionOpcional, completarEncuesta); // ruta unificada
router.post('/:id/iniciar', autenticarToken); 

// Obtener una encuesta específica por ID
router.get('/:id', obtenerEncuestaPorId);

// Completar encuesta directamente (genera PDF) - CON autenticación
router.post('/:id/completar', autenticarToken, completarEncuestaDirecta);

// Completar encuesta sin autenticación (para usuarios anónimos)
router.post('/:id/completar-sin-auth', completarEncuestaDirecta);

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

// ======================= RUTA PÚBLICA GENÉRICA =======================
router.get('/:id', obtenerEncuestaPorId);

module.exports = router;

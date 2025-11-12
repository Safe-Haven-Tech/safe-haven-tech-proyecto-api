const express = require('express');
const router = express.Router();

// Importar controladores
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
  obtenerEstadisticasEncuesta
} = require('../controllers/encuestasController');

// Importar middlewares
const { verificarRol, autenticarToken } = require('../middlewares/auth');

// ======================= RUTAS PÚBLICAS =======================
// Obtener todas las encuestas activas
router.get('/', obtenerEncuestas);

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
// Crear nueva encuesta (solo administradores)
router.post('/',[autenticarToken, verificarRol('administrador')],crearEncuesta);

// Actualizar encuesta existente (solo administradores)
router.put('/:id', [autenticarToken, verificarRol('administrador')], actualizarEncuesta);

// Desactivar encuesta (solo administradores)
router.put('/:id/desactivar', [autenticarToken, verificarRol('administrador')], desactivarEncuesta);

// Activar encuesta (solo administradores)
router.put('/:id/activar', [autenticarToken, verificarRol('administrador')], activarEncuesta);

  // Obtener estadísticas de una encuesta (solo administradores)
router.get('/:id/estadisticas', [autenticarToken, verificarRol('administrador')], obtenerEstadisticasEncuesta);

module.exports = router;

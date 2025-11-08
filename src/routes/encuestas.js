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

// ======================= RUTAS AUTENTICADAS =======================
router.get('/respuestas/usuario', autenticarToken, obtenerRespuestasUsuario);

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

const express = require('express');
const router = express.Router();

// Importar rutas
const usuariosRoutes = require('./usuarios');
const authRoutes = require('./auth');
const encuestasRoutes = require('./encuestas');
const recursosInformativosRoutes = require('./recursosInformativos');
const publicacionesRoutes = require('./publicaciones');
const moderacionRoutes = require('./moderacion');

// Importar controladores del sistema
const { obtenerHealthCheck, obtenerInformacionSistema, obtenerEstadisticasSistema } = require('../controllers/sistemaController');

// Definir rutas base
router.use('/usuarios', usuariosRoutes);
router.use('/auth', authRoutes);
router.use('/encuestas', encuestasRoutes);
router.use('/recursos-informativos', recursosInformativosRoutes);
router.use('/publicaciones', publicacionesRoutes);
router.use('/moderacion', moderacionRoutes);

// Ruta de prueba/health check
router.get('/health', obtenerHealthCheck);

// Ruta de información del sistema
router.get('/sistema', obtenerInformacionSistema);

// Ruta de estadísticas del sistema
router.get('/sistema/estadisticas', obtenerEstadisticasSistema);

module.exports = router;

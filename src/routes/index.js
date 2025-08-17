const express = require('express');
const router = express.Router();

// Importar rutas
const usuariosRoutes = require('./usuarios');

// Importar controladores del sistema
const { obtenerHealthCheck, obtenerInformacionSistema, obtenerEstadisticasSistema } = require('../controllers/sistemaController');

// Definir rutas base
router.use('/usuarios', usuariosRoutes);

// Ruta de prueba/health check
router.get('/health', obtenerHealthCheck);

// Ruta de información del sistema
router.get('/info', obtenerInformacionSistema);

// Ruta de estadísticas del sistema (solo administradores)
router.get('/stats', obtenerEstadisticasSistema);

module.exports = router;

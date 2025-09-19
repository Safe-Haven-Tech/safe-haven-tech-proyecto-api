const express = require('express');
const router = express.Router();
const busquedaController = require('../controllers/busquedaController');
const { autenticarToken } = require('../middlewares/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(autenticarToken);

/**
 * @route   GET /api/buscar
 * @desc    Búsqueda general en el sistema
 * @access  Private
 */
router.get('/', busquedaController.buscarGeneral);

/**
 * @route   GET /api/buscar/sugerencias
 * @desc    Obtener sugerencias de búsqueda
 * @access  Private
 */
router.get('/sugerencias', busquedaController.obtenerSugerencias);

module.exports = router;

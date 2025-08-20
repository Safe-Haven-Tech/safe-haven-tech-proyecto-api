const express = require('express');
const router = express.Router();
const { 
  login, 
  refreshToken, 
  logout, 
  cambiarContraseña, 
  verificarToken, 
  obtenerPerfil 
} = require('../controllers/authController');
const { autenticarToken } = require('../middlewares/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout de usuario
 * @access  Private
 */
router.post('/logout', autenticarToken, logout);

/**
 * @route   POST /api/auth/cambiar-contraseña
 * @desc    Cambiar contraseña del usuario autenticado
 * @access  Private
 */
router.post('/cambiar-contrasena', autenticarToken, cambiarContraseña);

/**
 * @route   GET /api/auth/verificar
 * @desc    Verificar si el token es válido
 * @access  Private
 */
router.get('/verificar', autenticarToken, verificarToken);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/perfil', autenticarToken, obtenerPerfil);

module.exports = router;

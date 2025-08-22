const express = require('express');
const router = express.Router();
const { 
  registrarUsuario, 
  obtenerUsuarios, 
  obtenerUsuarioPorId, 
  actualizarUsuario, 
  cambiarEstadoUsuario, 
  desactivarUsuario, 
  activarUsuario,
  obtenerUsuarioPublico,
  eliminarUsuario,
  verificarNickname
} = require('../controllers/usuariosController');

const upload = require('../utils/multer');

// CORREGIR - usa middlewares en plural
const { validarRegistroUsuario, validarActualizacionUsuario, validarIdMongo } = require('../middlewares/validacion');

// CORREGIR - también auth.js está en middlewares
const { autenticarToken, verificarRol, verificarPropietario, verificarUsuarioActivo } = require('../middlewares/auth');

/**
 * @route   POST /api/usuarios/registro
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/registro', validarRegistroUsuario, registrarUsuario);

/**
 * @route   GET /api/usuarios/public/:id
 * @desc    Obtener información pública de un usuario
 * @access  Public
 */
router.get('/public/:nickname', obtenerUsuarioPublico);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (con paginación)
 * @access  Private (solo administradores)
 */
router.get('/', autenticarToken, verificarRol('administrador'), obtenerUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID (información completa)
 * @access  Private (usuario propio o administrador)
 */
router.get('/:id', autenticarToken, verificarPropietario('id'), obtenerUsuarioPorId);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (usuario propio o administrador)
 */
router.put('/:id', autenticarToken, verificarPropietario('id'), validarIdMongo, upload.single('fotoPerfil'), validarActualizacionUsuario, actualizarUsuario);
/**
 * @route   PATCH /api/usuarios/:id/estado
 * @desc    Cambiar estado del usuario
 * @access  Private (solo administradores)
 */
router.patch('/:id/estado', autenticarToken, verificarRol('administrador'), validarIdMongo, cambiarEstadoUsuario);

/**
 * @route   PATCH /api/usuarios/:id/desactivar
 * @desc    Desactivar usuario
 * @access  Private (solo administradores)
 */
router.patch('/:id/desactivar', autenticarToken, verificarRol('administrador'), validarIdMongo, desactivarUsuario);

/**
 * @route   PATCH /api/usuarios/:id/activar
 * @desc    Activar usuario
 * @access  Private (solo administradores)
 */
router.patch('/:id/activar', autenticarToken, verificarRol('administrador'), validarIdMongo, activarUsuario);

/**
 * @route   GET /api/usuarios/verificar-nickname/:nickname
 * @desc    Verificar disponibilidad de nickname
 * @access  Private (usuario autenticado)
 */
router.get('/verificar-nickname/:nickname', autenticarToken, verificarNickname);

module.exports = router;
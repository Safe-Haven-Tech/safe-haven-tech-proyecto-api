const express = require('express');
const router = express.Router();
const { registrarUsuario, obtenerUsuarios, obtenerUsuarioPorId, actualizarUsuario, cambiarEstadoUsuario, desactivarUsuario, activarUsuario, eliminarUsuario } = require('../controllers/usuariosController');
const { validarRegistroUsuario, validarActualizacionUsuario, validarIdMongo, validarImagenUsuario } = require('../middlewares/validacion');
const { autenticarToken, verificarRol, verificarPropietario, verificarUsuarioActivo } = require('../middlewares/auth');
const upload = require('../utils/multer');

/**
 * @route   POST /api/usuarios/registro
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/registro', validarRegistroUsuario, registrarUsuario);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (con paginación)
 * @access  Private (solo administradores)
 */
router.get('/', autenticarToken, verificarRol('administrador'), obtenerUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private (usuario propio o administrador)
 */
router.get('/:id', autenticarToken, verificarPropietario('id'), obtenerUsuarioPorId);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (usuario propio o administrador)
 */
router.put('/:id', autenticarToken, verificarPropietario('id'), validarIdMongo, validarActualizacionUsuario, validarImagenUsuario, upload.single('fotoPerfil'), actualizarUsuario);

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
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (requiere confirmar contraseña)
 * @access  Private (usuario propio)
 */
router.delete('/:id', validarIdMongo, eliminarUsuario);

module.exports = router;

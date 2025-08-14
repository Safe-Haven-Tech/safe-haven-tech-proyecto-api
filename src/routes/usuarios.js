const express = require('express');
const router = express.Router();
const { registrarUsuario, obtenerUsuarios, obtenerUsuarioPorId, actualizarUsuario, eliminarUsuario } = require('../controllers/usuariosController');
const { validarRegistroUsuario, validarActualizacionUsuario, validarIdMongo } = require('../middlewares/validacion');

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
router.get('/', obtenerUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private (usuario propio o administrador)
 */
router.get('/:id', validarIdMongo, obtenerUsuarioPorId);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (usuario propio o administrador)
 */
router.put('/:id', validarIdMongo, validarActualizacionUsuario, actualizarUsuario);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario
 * @access  Private (usuario propio o administrador)
 */
router.delete('/:id', validarIdMongo, eliminarUsuario);

module.exports = router;

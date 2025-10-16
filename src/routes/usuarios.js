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
  denunciarUsuario,
  actualizarInfoProfesional,
  buscarProfesionales
  //obtenerUsuarioPublico
} = require('../controllers/usuariosController');

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
 * @route   GET /api/usuarios/profesionales
 * @desc    Buscar profesionales con filtros
 * @access  Public
 */
router.get('/profesionales', buscarProfesionales);

/**
 * @route   GET /api/usuarios/public/:id
 * @desc    Obtener información pública de un usuario
 * @access  Public
 */
//router.get('/public/:id', validarIdMongo, obtenerUsuarioPublico);

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
router.put('/:id', autenticarToken, verificarPropietario('id'), validarIdMongo, validarActualizacionUsuario, actualizarUsuario);

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
 * @route   POST /api/usuarios/:id/denunciar
 * @desc    Denunciar un usuario
 * @access  Private
 */
router.post('/:id/denunciar', autenticarToken, verificarUsuarioActivo, validarIdMongo, denunciarUsuario);

/**
 * @route   PUT /api/usuarios/:id/info-profesional
 * @desc    Actualizar información profesional
 * @access  Private (profesional propio o administrador)
 */
router.put('/:id/info-profesional', autenticarToken, verificarPropietario('id'), validarIdMongo, actualizarInfoProfesional);

module.exports = router;
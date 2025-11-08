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
  buscarProfesionales,
  obtenerUsuarioPublico,
  eliminarUsuario,
  verificarNickname,
  obtenerConexiones
} = require('../controllers/usuariosController');

const upload = require('../utils/multer');
const { validarRegistroUsuario, validarActualizacionUsuario, validarIdMongo } = require('../middlewares/validacion');
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
 * @route   GET /api/usuarios/verificar-nickname/:nickname
 * @desc    Verificar disponibilidad de nickname (AHORA PÚBLICO)
 * @access  Public
 */
router.get('/verificar-nickname/:nickname', verificarNickname);

/**
 * @route   GET /api/usuarios/public/:nickname
 * @desc    Obtener información pública de un usuario por nickname
 * @access  Public
 */
router.get('/public/:nickname', obtenerUsuarioPublico);

/**
 * Nota: rutas estáticas específicas (ej. /connections) deben definirse
 * antes de las rutas dinámicas con ':id' para evitar conflictos.
 */

/** 
 * @route   GET /api/usuarios/connections
 * @desc    Obtener conexiones de un usuario (seguidos / seguidores / ambos)
 * @access  Private (usuario propio)
 */
router.get('/connections', autenticarToken, obtenerConexiones);

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
 *
 * validarIdMongo se aplica antes para evitar CastError cuando el :id no es un ObjectId válido
 */
router.get('/:id', validarIdMongo, autenticarToken, verificarPropietario('id'), obtenerUsuarioPorId);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Private (usuario propio o administrador)
 */
router.put('/:id', validarIdMongo, autenticarToken, verificarPropietario('id'), upload.single('fotoPerfil'), validarActualizacionUsuario, actualizarUsuario);

/**
 * @route   PATCH /api/usuarios/:id/estado
 * @desc    Cambiar estado del usuario
 * @access  Private (solo administradores)
 */
router.patch('/:id/estado', validarIdMongo, autenticarToken, verificarRol('administrador'), cambiarEstadoUsuario);

/**
 * @route   PATCH /api/usuarios/:id/desactivar
 * @desc    Desactivar usuario
 * @access  Private (solo administradores)
 */
router.patch('/:id/desactivar', validarIdMongo, autenticarToken, verificarRol('administrador'), desactivarUsuario);

/**
 * @route   PATCH /api/usuarios/:id/activar
 * @desc    Activar usuario
 * @access  Private (solo administradores)
 */
router.patch('/:id/activar', validarIdMongo, autenticarToken, verificarRol('administrador'), activarUsuario);

/**
 * @route   POST /api/usuarios/:id/denunciar
 * @desc    Denunciar un usuario
 * @access  Private
 */
router.post('/:id/denunciar', validarIdMongo, autenticarToken, verificarUsuarioActivo, denunciarUsuario);

/**
 * @route   PUT /api/usuarios/:id/info-profesional
 * @desc    Actualizar información profesional
 * @access  Private (profesional propio o administrador)
 */
router.put('/:id/info-profesional', validarIdMongo, autenticarToken, verificarPropietario('id'), actualizarInfoProfesional);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario
 * @access  Private (usuario propio o administrador)
 */
router.delete('/:id', validarIdMongo, autenticarToken, verificarPropietario('id'), eliminarUsuario);

module.exports = router;
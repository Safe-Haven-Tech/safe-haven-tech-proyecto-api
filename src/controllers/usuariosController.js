const usuariosService = require('../services/usuariosService');
const { config } = require('../config');
const { subirImagenCloudinary, eliminarImagenCloudinary } = require('../utils/cloudinary');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const authService = require('../services/authService'); // ✅ Añadir importación

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/usuarios/registro
 * @access  Public
 */
const registrarUsuario = async (req, res) => {
  try {
    const { correo, contraseña, fechaNacimiento, rol, anonimo, visibilidadPerfil, genero, nombreUsuario } = req.body;

    // Validar campos requeridos
    if (!correo || !contraseña || !fechaNacimiento || !nombreUsuario) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        detalles: 'correo, contraseña, fechaNacimiento y nombreUsuario son obligatorios'
      });
    }

    // Usar el servicio para registrar el usuario
    const usuario = await usuariosService.registrarUsuario({
      correo,
      contraseña,
      fechaNacimiento,
      nombreUsuario,
      rol,
      anonimo,
      visibilidadPerfil,
      genero
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);

    if (error.message === 'El correo electrónico ya está registrado en el sistema') {
      return res.status(409).json({ error: 'Usuario ya existe', detalles: error.message });
    }

    if (error.message.includes('No se permite crear usuarios con rol de administrador')) {
      return res.status(403).json({ error: 'Rol no permitido', detalles: error.message });
    }

    if (error.message.includes('Rol no válido')) {
      return res.status(400).json({ error: 'Rol no válido', detalles: error.message });
    }

    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Error de validación', detalles: errores });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};


/**
 * @desc    Obtener todos los usuarios (con paginación)
 * @route   GET /api/usuarios
 * @access  Private (solo administradores)
 */
const obtenerUsuarios = async (req, res) => {
  try {
    const { pagina = 1, limite = 10, rol, activo, estado, busqueda } = req.query;
    
    const filtros = {};
    
    if (rol) filtros.rol = rol;
    if (activo !== undefined) filtros.activo = activo;
    if (estado) filtros.estado = estado;
    if (busqueda) {
      filtros.busqueda = busqueda;
    }

    const resultado = await usuariosService.obtenerUsuarios(filtros, pagina, limite);

    res.json({
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Obtener usuario por ID
 * @route   GET /api/usuarios/:id
 * @access  Private (usuario propio o administrador)
 */
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await usuariosService.obtenerUsuarioPorId(id);

    res.json({
      usuario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    
    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Actualizar usuario
 * @route   PUT /api/usuarios/:id
 * @access  Private (usuario propio o administrador)
 */
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombreCompleto,
      fechaNacimiento,
      rol,
      anonimo,
      visibilidadPerfil,
      activo,
      pronombres,
      biografia,
      genero,
      nombreUsuario
    } = req.body;

    const usuario = await usuariosService.obtenerUsuarioPorId(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const nicknameCambiado = nombreUsuario && nombreUsuario !== usuario.nombreUsuario;
    if (nicknameCambiado) {
      const usuarioExistente = await Usuario.findOne({
        nombreUsuario: nombreUsuario.toLowerCase(),
        _id: { $ne: id }
      });
      if (usuarioExistente) return res.status(409).json({ error: 'Nickname no disponible' });
    }

    // Solo actualizamos los campos que no estén vacíos o nulos
    const datosActualizacion = {};
    if (nombreCompleto) datosActualizacion.nombreCompleto = nombreCompleto;
    if (fechaNacimiento) datosActualizacion.fechaNacimiento = fechaNacimiento;
    if (rol !== undefined) datosActualizacion.rol = rol;
    if (anonimo !== undefined) datosActualizacion.anonimo = anonimo;
    if (visibilidadPerfil !== undefined) datosActualizacion.visibilidadPerfil = visibilidadPerfil;
    if (activo !== undefined) datosActualizacion.activo = activo;
    if (pronombres) datosActualizacion.pronombres = pronombres;
    if (biografia) datosActualizacion.biografia = biografia;
    if (genero) datosActualizacion.genero = genero;
    if (nombreUsuario) datosActualizacion.nombreUsuario = nombreUsuario;

    // Manejo de foto de perfil
    if (req.file) {
      const publicIdAnterior = usuario.fotoPerfil?.match(/\/usuarios\/(usuario_\w+)/)?.[1];
      const urlImagen = await subirImagenCloudinary(req.file.path, id, publicIdAnterior);
      datosActualizacion.fotoPerfil = urlImagen;
    } else if ('fotoPerfil' in req.body && req.body.fotoPerfil === null) {
      datosActualizacion.fotoPerfil = null;
    }

    const usuarioActualizado = await usuariosService.actualizarUsuario(id, datosActualizacion);

    let nuevoToken = null;
    if (nicknameCambiado) {
      authService.invalidarTokens(id);
      nuevoToken = authService.generarAccessToken(usuarioActualizado);
    }

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado,
      nuevoToken,
      requiereReautenticacion: !!nicknameCambiado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalles: error.message });
  }
};
module.exports = { actualizarUsuario };


/**
 * @desc    Cambiar estado del usuario
 * @route   PATCH /api/usuarios/:id/estado
 * @access  Private (solo administradores)
 */
const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo } = req.body;

    if (!estado) {
      return res.status(400).json({
        error: 'Estado requerido',
        detalles: 'El campo estado es obligatorio'
      });
    }

    const usuarioActualizado = await usuariosService.cambiarEstadoUsuario(id, estado, motivo);

    res.json({
      mensaje: `Estado del usuario cambiado a: ${estado}`,
      usuario: usuarioActualizado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al cambiar estado del usuario:', error);
    
    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    if (error.message === 'Estado no válido. Estados permitidos: activo, inactivo, suspendido, eliminado') {
      return res.status(400).json({
        error: 'Estado no válido',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Desactivar usuario
 * @route   PATCH /api/usuarios/:id/desactivar
 * @access  Private (solo administradores)
 */
const desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const usuarioDesactivado = await usuariosService.desactivarUsuario(id, motivo);

    res.json({
      mensaje: 'Usuario desactivado exitosamente',
      usuario: usuarioDesactivado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al desactivar usuario:', error);
    
    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Activar usuario
 * @route   PATCH /api/usuarios/:id/activar
 * @access  Private (solo administradores)
 */
const activarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const usuarioActivado = await usuariosService.activarUsuario(id, motivo);

    res.json({
      mensaje: 'Usuario activado exitosamente',
      usuario: usuarioActivado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al activar usuario:', error);
    
    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'ID inválido',
        detalles: 'El formato del ID proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { contraseña } = req.body;

    if (!contraseña) {
      return res.status(400).json({
        error: 'Contraseña requerida',
        detalles: 'Debes proporcionar tu contraseña para confirmar la eliminación'
      });
    }

    // Obtener usuario actual
    const usuario = await usuariosService.obtenerUsuarioPorId(id);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: `No existe un usuario con ID ${id}`
      });
    }

    // Si tiene foto en Cloudinary, eliminarla
    if (usuario.fotoPerfil) {
      const publicId = usuario.fotoPerfil.match(/\/usuarios\/(usuario_\w+)/)?.[1];
      await eliminarImagenCloudinary(publicId);
    }

    // ✅ Invalidar tokens antes de eliminar el usuario
    authService.invalidarTokens(id);

    // Eliminar usuario
    await usuariosService.eliminarUsuario(id, contraseña);

    res.json({
      mensaje: 'Usuario eliminado exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

const obtenerUsuarioPublico = async (req, res) => {
  try {
    const { nickname } = req.params;

    // ✅ Usar búsqueda case-insensitive con regex
    const usuario = await Usuario.findOne({ 
      nombreUsuario: { $regex: new RegExp(`^${nickname}$`, 'i') } 
    })
      .select('nombreUsuario nombreCompleto fotoPerfil visibilidadPerfil biografia genero pronombres rol createdAt seguidores seguidos activo estado')
      .where('activo').equals(true)
      .where('estado').equals('activo');

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: 'No existe un usuario activo con ese nickname'
      });
    }

    // Verificar si el usuario autenticado es el dueño
    let esPropietario = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const { config } = require('../config');
        const decoded = jwt.verify(token, config.jwt.secret);
        esPropietario = decoded.id === usuario._id.toString();
      } catch (error) {
        // Token inválido -> no propietario
      }
    }

    let usuarioPublico;

    if (usuario.visibilidadPerfil === 'privado' && !esPropietario) {
      // PERFIL PRIVADO - Solo información básica
      usuarioPublico = {
        _id: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        nombreCompleto: usuario.nombreCompleto,
        fotoPerfil: usuario.fotoPerfil,
        visibilidadPerfil: usuario.visibilidadPerfil,
        rol: usuario.rol,
        pronombres: usuario.pronombres,
        createdAt: usuario.createdAt,
        biografia: '',
        seguidores: [],
        seguidos: [],
        totalSeguidores: 0,
        totalSeguidos: 0
      };
    } else {
      // PERFIL PÚBLICO o PROPIO - Información completa
      usuarioPublico = {
        _id: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        nombreCompleto: usuario.nombreCompleto,
        fotoPerfil: usuario.fotoPerfil,
        biografia: usuario.biografia,
        genero: usuario.genero,
        pronombres: usuario.pronombres,
        rol: usuario.rol,
        visibilidadPerfil: usuario.visibilidadPerfil,
        seguidores: usuario.seguidores || [],
        seguidos: usuario.seguidos || [],
        createdAt: usuario.createdAt,
        totalSeguidores: usuario.seguidores ? usuario.seguidores.length : 0,
        totalSeguidos: usuario.seguidos ? usuario.seguidos.length : 0
      };
    }

    res.json({
      usuario: usuarioPublico,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener usuario público por nickname:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Nickname inválido',
        detalles: 'El formato del nickname proporcionado no es válido'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: process.env.NODE_ENV === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Verificar disponibilidad de nickname
 * @route   GET /api/usuarios/verificar-nickname/:nickname
 * @access  Public (pero más inteligente si hay usuario autenticado)
 */
const verificarNickname = async (req, res) => {
  try {
    const { nickname } = req.params;

    if (!nickname) {
      return res.status(400).json({
        error: 'Nickname requerido',
        detalles: 'Debe proporcionar un nickname para verificar'
      });
    }

    // Validación formato
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(nickname)) {
      return res.status(400).json({
        error: 'Formato inválido',
        detalles: 'El nickname solo puede contener letras, números y guion bajo'
      });
    }

    // Validación longitud
    if (nickname.length < 5 || nickname.length > 20) {
      return res.status(400).json({
        error: 'Longitud inválida',
        detalles: 'El nickname debe tener entre 5 y 20 caracteres'
      });
    }

    // Buscar usuario (insensible a mayúsculas/minúsculas)
    const usuarioExistente = await Usuario.findOne({
      nombreUsuario: { $regex: new RegExp(`^${nickname}$`, 'i') }
    });

    // Responder
    res.json({
      disponible: !usuarioExistente,
      nickname,
      mensaje: usuarioExistente
        ? 'Nickname no disponible'
        : 'Nickname disponible'
    });

  } catch (error) {
    console.error('❌ Error al verificar nickname:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al verificar la disponibilidad del nickname'
    });
  }
};


module.exports = {
  registrarUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  cambiarEstadoUsuario,
  desactivarUsuario,
  activarUsuario,
  eliminarUsuario,
  obtenerUsuarioPublico,
  verificarNickname
};
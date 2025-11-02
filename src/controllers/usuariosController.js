const usuariosService = require('../services/usuariosService');
const { config } = require('../config');
const { subirImagenCloudinary, eliminarImagenCloudinary } = require('../utils/cloudinary');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const authService = require('../services/authService'); 
const mongoose = require('mongoose');

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
 * @desc    Obtener información pública de un usuario
 * @route   GET /api/usuarios/public/:id
 * @access  Public
 */

const obtenerUsuarioPublico = async (req, res) => {
  try {
    const { nickname } = req.params;

    // ✅ Usar búsqueda case-insensitive con regex
    const usuario = await Usuario.findOne({ 
      nombreUsuario: { $regex: new RegExp(`^${nickname}$`, 'i') } 
    })
      .select('nombreUsuario nombreCompleto fotoPerfil visibilidadPerfil biografia genero pronombres rol createdAt seguidores seguidos solicitudesSeguidores activo estado')
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
    let esSeguidor = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const { config } = require('../config');
        const decoded = jwt.verify(token, config.jwt.secret);
        esPropietario = decoded.id === usuario._id.toString();
        
        esSeguidor = usuario.seguidores.some(
          id => id.toString() === decoded.id
        );
      } catch (error) {
        
      }
    }

    let usuarioPublico;

   
    if (usuario.visibilidadPerfil === 'privado' && !esPropietario && !esSeguidor) {
      
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
        solicitudesSeguidores: usuario.solicitudesSeguidores || [],
        totalSeguidores: 0,
        totalSeguidos: 0
      };
    } else {
      // PERFIL PÚBLICO, PROPIO o SEGUIDOR - Información completa
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
        solicitudesSeguidores: usuario.solicitudesSeguidores || [],
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

    if (error.message === 'No tienes permisos para ver este perfil') {
      return res.status(403).json({
        error: 'Acceso denegado',
        detalles: error.message
      });
    }

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
    const { contraseña } = req.body || {};
    const { userId, rol } = req.usuario;

    
    if (rol === 'administrador') {
      await usuariosService.eliminarUsuario(id);
      return res.json({ mensaje: 'Usuario eliminado por administrador', timestamp: new Date().toISOString() });
    }

    
    if (userId === id) {
      if (!contraseña) {
        return res.status(400).json({ error: 'Se requiere la contraseña para eliminar la cuenta' });
      }
      await usuariosService.eliminarUsuario(id, contraseña);
      return res.json({ mensaje: 'Usuario eliminado', timestamp: new Date().toISOString() });
    }

    
    return res.status(403).json({ error: 'No tienes permisos para eliminar este usuario' });

  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: error.message
    });
  }
};

/**
 * @desc    Denunciar un usuario
 * @route   POST /api/usuarios/:id/denunciar
 * @access  Private
 */
const denunciarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, descripcion } = req.body;
    const usuarioId = req.usuario.userId;

    if (!motivo) {
      return res.status(400).json({
        error: 'Motivo requerido',
        detalles: 'El motivo de la denuncia es obligatorio'
      });
    }

    const denuncia = await usuariosService.denunciarUsuario({
      usuarioDenunciadoId: id,
      usuarioId,
      motivo,
      descripcion
    });

    res.status(201).json({
      mensaje: 'Denuncia enviada exitosamente',
      denuncia,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al denunciar usuario:', error);

    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    if (error.message === 'No puedes denunciarte a ti mismo') {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    if (error.message.includes('Ya has denunciado')) {
      return res.status(400).json({
        error: 'Denuncia duplicada',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Actualizar información profesional
 * @route   PUT /api/usuarios/:id/info-profesional
 * @access  Private (profesional propio o administrador)
 */
const actualizarInfoProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const infoProfesional = req.body;

    const usuario = await usuariosService.actualizarInfoProfesional(id, infoProfesional);

    res.json({
      mensaje: 'Información profesional actualizada exitosamente',
      usuario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al actualizar información profesional:', error);

    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    if (error.message === 'Solo los usuarios con rol profesional pueden tener información profesional') {
      return res.status(400).json({
        error: 'Acción no permitida',
        detalles: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
    });
  }
};

/**
 * @desc    Buscar profesionales con filtros
 * @route   GET /api/usuarios/profesionales
 * @access  Public
 */
const buscarProfesionales = async (req, res) => {
  try {
    const {
      pagina = 1,
      limite = 10,
      especialidad,
      disponible,
      ciudad
    } = req.query;

    const filtros = {
      especialidad,
      disponible,
      ciudad
    };

    const resultado = await usuariosService.buscarProfesionales(filtros, parseInt(pagina), parseInt(limite));

    res.json({
      mensaje: 'Profesionales encontrados',
      ...resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al buscar profesionales:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la solicitud'
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


const obtenerConexiones = async (req, res) => {
  try {
    const userId = req.usuario?.userId;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    // validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({ error: 'ID inválido', detalles: 'El formato del ID de usuario no es válido' });
    }

    const type = (req.query.type || 'both').toLowerCase();
    const q = (req.query.query || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const includeInactive = req.query.includeInactive === '1' || req.query.includeInactive === 'true';

    const yo = await Usuario.findById(userId).select('seguidos seguidores bloqueados').lean();
    if (!yo) return res.status(404).json({ error: 'Usuario no encontrado' });

    // normalizar arrays (acepta ObjectId, string o subdocument con _id)
    const normalize = (arr) => (Array.isArray(arr) ? arr.map(item => {
      if (!item && item !== 0) return null;
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      if (item._id) return String(item._id);
      if (item.id) return String(item.id);
      return null;
    }).filter(Boolean) : []);

    const seguidos = normalize(yo.seguidos);
    const seguidores = normalize(yo.seguidores);
    const bloqueados = normalize(yo.bloqueados);

    let ids = [];
    if (type === 'following') ids = seguidos;
    else if (type === 'followers') ids = seguidores;
    else ids = Array.from(new Set([...seguidos, ...seguidores]));

    const filteredIds = ids.filter(id => id && id !== String(userId) && !bloqueados.includes(id));

    console.log('[obtenerConexiones] userId:', userId);
    console.log('[obtenerConexiones] seguidos:', seguidos.length, 'seguidores:', seguidores.length, 'bloqueados:', bloqueados.length);
    console.log('[obtenerConexiones] idsRaw:', ids.length, 'filteredIds:', filteredIds.length, filteredIds.slice(0,10));

    if (!filteredIds.length) {
      return res.json({
        users: [],
        debug: { seguidos, seguidores, bloqueados, filteredIds }
      });
    }

    // construir criterio; permitir bypass de filtro 'activo' para depuración
    const criterio = { _id: { $in: filteredIds } };
    if (q) {
      criterio.$or = [
        { nombreUsuario: { $regex: q, $options: 'i' } },
        { nombreCompleto: { $regex: q, $options: 'i' } }
      ];
    }
    if (!includeInactive) {
      criterio.activo = true;
    }

    const users = await Usuario.find(criterio)
      .select('nombreUsuario nombreCompleto fotoPerfil activo')
      .limit(limit)
      .lean();

    // Si no se encontró nada y aplicamos filtro activo, devolver también los candidatos sin filtro para depuración
    if (!users.length && !includeInactive) {
      const usersAll = await Usuario.find({ _id: { $in: filteredIds } })
        .select('nombreUsuario nombreCompleto fotoPerfil activo')
        .limit(limit)
        .lean();

      return res.json({
        users: [],
        debug: { filteredIds, matchedCountWithActivo: usersAll.length, matchedSamples: usersAll.slice(0,10) }
      });
    }

    return res.json({ users });
  } catch (err) {
    console.error('obtenerConexiones error:', err);
    return res.status(500).json({ error: 'Error obteniendo conexiones' });
  }
};

module.exports = {
  registrarUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPublico,
  actualizarUsuario,
  cambiarEstadoUsuario,
  desactivarUsuario,
  activarUsuario,
  eliminarUsuario,
  denunciarUsuario,
  actualizarInfoProfesional,
  buscarProfesionales,
  obtenerUsuarioPublico,
  verificarNickname,
  obtenerConexiones
};
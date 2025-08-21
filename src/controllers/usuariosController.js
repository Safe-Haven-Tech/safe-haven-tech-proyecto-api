const usuariosService = require('../services/usuariosService');
const Usuario = require('../models/Usuario');

const { config } = require('../config');

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/usuarios/registro
 * @access  Public
 */
const registrarUsuario = async (req, res) => {
  try {
    const { correo, contraseña, nombreCompleto, fechaNacimiento, rol, anonimo, visibilidadPerfil } = req.body;

    // Validar campos requeridos
    if (!correo || !contraseña || !nombreCompleto || !fechaNacimiento) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        detalles: 'correo, contraseña, nombreCompleto y fechaNacimiento son obligatorios'
      });
    }

    // Usar el servicio para registrar el usuario
    const usuario = await usuariosService.registrarUsuario({
      correo,
      contraseña,
      nombreCompleto,
      fechaNacimiento,
      rol,
      anonimo,
      visibilidadPerfil
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);

    // Manejar errores específicos del servicio
    if (error.message === 'El correo electrónico ya está registrado en el sistema') {
      return res.status(409).json({
        error: 'Usuario ya existe',
        detalles: error.message
      });
    }

    // Manejar errores de validación de rol
    if (error.message.includes('No se permite crear usuarios con rol de administrador')) {
      return res.status(403).json({
        error: 'Rol no permitido',
        detalles: error.message
      });
    }

    if (error.message.includes('Rol no válido')) {
      return res.status(400).json({
        error: 'Rol no válido',
        detalles: error.message
      });
    }

    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Error de validación',
        detalles: errores
      });
    }

    // Error por defecto
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
    
    // Construir filtros
    const filtros = {};
    
    if (rol) filtros.rol = rol;
    if (activo !== undefined) filtros.activo = activo;
    if (estado) filtros.estado = estado;
    if (busqueda) {
      filtros.busqueda = busqueda;
    }

    // Usar el servicio para obtener usuarios
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

    // Usar el servicio para obtener el usuario
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




const obtenerUsuarioPublico = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener solo información pública (sin datos sensibles)
    const usuario = await Usuario.findById(id)
      .select('nombreCompleto fotoPerfil visibilidadPerfil biografia genero pronombres rol createdAt seguidores seguidos')
      .where('activo').equals(true)
      .where('estado').equals('activo');

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: 'No existe un usuario activo con el ID proporcionado'
      });
    }

    // Si el perfil es privado, restringir acceso
    if (usuario.visibilidadPerfil === 'privado') {
      return res.status(403).json({
        error: 'Perfil privado',
        detalles: 'Este perfil es privado. Solo el usuario puede verlo.'
      });
    }

    // Preparar respuesta con información pública
    const usuarioPublico = {
      _id: usuario._id,
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
      // Estadísticas públicas
      totalSeguidores: usuario.seguidores ? usuario.seguidores.length : 0,
      totalSeguidos: usuario.seguidos ? usuario.seguidos.length : 0
    };

    res.json({
      usuario: usuarioPublico,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al obtener usuario público:', error);
    
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
    const { nombreCompleto, fechaNacimiento, rol, anonimo, visibilidadPerfil, activo } = req.body;

    // Preparar datos de actualización
    const datosActualizacion = {};
    
    if (nombreCompleto !== undefined) datosActualizacion.nombreCompleto = nombreCompleto;
    if (fechaNacimiento !== undefined) datosActualizacion.fechaNacimiento = fechaNacimiento;
    if (rol !== undefined) datosActualizacion.rol = rol;
    if (anonimo !== undefined) datosActualizacion.anonimo = anonimo;
    if (visibilidadPerfil !== undefined) datosActualizacion.visibilidadPerfil = visibilidadPerfil;
    if (activo !== undefined) datosActualizacion.activo = activo;

    // Usar el servicio para actualizar el usuario
    const usuarioActualizado = await usuariosService.actualizarUsuario(id, datosActualizacion);

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    
    if (error.message === 'No existe un usuario con el ID proporcionado') {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        detalles: error.message
      });
    }

    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Error de validación',
        detalles: errores
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

    // Usar el servicio para cambiar el estado del usuario
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

    // Usar el servicio para desactivar el usuario
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

    // Usar el servicio para activar el usuario
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

module.exports = {
  registrarUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  obtenerUsuarioPublico,  
  actualizarUsuario,
  cambiarEstadoUsuario,
  desactivarUsuario,
  activarUsuario
};

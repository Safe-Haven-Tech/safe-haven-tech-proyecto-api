const usuariosService = require('../services/usuariosService');
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
    const { pagina = 1, limite = 10, rol, activo, busqueda } = req.query;
    
    // Construir filtros
    const filtros = {};
    
    if (rol) filtros.rol = rol;
    if (activo !== undefined) filtros.activo = activo === 'true';
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
 * @desc    Eliminar usuario
 * @route   DELETE /api/usuarios/:id
 * @access  Private (usuario propio o administrador)
 */
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Usar el servicio para eliminar el usuario
    const usuarioEliminado = await usuariosService.eliminarUsuario(id);

    res.json({
      mensaje: 'Usuario eliminado exitosamente',
      usuarioEliminado,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    
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
  actualizarUsuario,
  eliminarUsuario
};

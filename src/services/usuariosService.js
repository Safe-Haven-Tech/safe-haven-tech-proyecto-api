const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const { config } = require('../config');

/**
 * Servicio para el manejo de usuarios
 */
class UsuariosService {
  
  /**
   * Registrar un nuevo usuario
   * @param {Object} datosUsuario - Datos del usuario a registrar
   * @returns {Object} Usuario registrado sin contraseña
   */
  async registrarUsuario(datosUsuario) {
    const { correo, contraseña, nombreCompleto, fechaNacimiento, rol, anonimo, visibilidadPerfil } = datosUsuario;

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ correo: correo.toLowerCase() });
    if (usuarioExistente) {
      throw new Error('El correo electrónico ya está registrado en el sistema');
    }

    // Encriptar contraseña
    const saltRounds = config.seguridad.bcryptRounds;
    const contraseñaEncriptada = await bcrypt.hash(contraseña, saltRounds);

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      correo: correo.toLowerCase(),
      contraseña: contraseñaEncriptada,
      nombreCompleto,
      fechaNacimiento: new Date(fechaNacimiento),
      rol: rol || 'usuario',
      anonimo: anonimo || false,
      visibilidadPerfil: visibilidadPerfil || 'publico'
    });

    // Guardar usuario en la base de datos
    const usuarioGuardado = await nuevoUsuario.save();

    // Remover contraseña de la respuesta
    const usuarioResponse = usuarioGuardado.toObject();
    delete usuarioResponse.contraseña;

    console.log(`✅ Usuario registrado exitosamente: ${usuarioGuardado.correo}`);

    return usuarioResponse;
  }

  /**
   * Obtener usuarios con paginación y filtros
   * @param {Object} filtros - Filtros de búsqueda
   * @param {number} pagina - Número de página
   * @param {number} limite - Usuarios por página
   * @returns {Object} Lista de usuarios y información de paginación
   */
  async obtenerUsuarios(filtros = {}, pagina = 1, limite = 10) {
    // Construir filtros de consulta
    const filtrosConsulta = {};
    
    if (filtros.rol) filtrosConsulta.rol = filtros.rol;
    if (filtros.activo !== undefined) filtrosConsulta.activo = filtros.activo === 'true';
    if (filtros.busqueda) {
      filtrosConsulta.$or = [
        { nombreCompleto: { $regex: filtros.busqueda, $options: 'i' } },
        { correo: { $regex: filtros.busqueda, $options: 'i' } }
      ];
    }

    // Calcular skip para paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Ejecutar consulta con paginación
    const usuarios = await Usuario.find(filtrosConsulta)
      .select('-contraseña')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    // Contar total de documentos
    const total = await Usuario.countDocuments(filtrosConsulta);

    // Calcular información de paginación
    const totalPaginas = Math.ceil(total / parseInt(limite));
    const tieneSiguiente = parseInt(pagina) < totalPaginas;
    const tieneAnterior = parseInt(pagina) > 1;

    return {
      usuarios,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total,
        totalPaginas,
        tieneSiguiente,
        tieneAnterior
      }
    };
  }

  /**
   * Obtener usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Object} Usuario encontrado sin contraseña
   */
  async obtenerUsuarioPorId(id) {
    const usuario = await Usuario.findById(id).select('-contraseña');
    
    if (!usuario) {
      throw new Error('No existe un usuario con el ID proporcionado');
    }

    return usuario;
  }

  /**
   * Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Usuario actualizado sin contraseña
   */
  async actualizarUsuario(id, datosActualizacion) {
    // Buscar usuario
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('No existe un usuario con el ID proporcionado');
    }

    // Preparar datos de actualización
    const datosActualizar = {};
    
    if (datosActualizacion.nombreCompleto !== undefined) datosActualizar.nombreCompleto = datosActualizacion.nombreCompleto;
    if (datosActualizacion.fechaNacimiento !== undefined) datosActualizar.fechaNacimiento = new Date(datosActualizacion.fechaNacimiento);
    if (datosActualizacion.rol !== undefined) datosActualizar.rol = datosActualizacion.rol;
    if (datosActualizacion.anonimo !== undefined) datosActualizar.anonimo = datosActualizacion.anonimo;
    if (datosActualizacion.visibilidadPerfil !== undefined) datosActualizar.visibilidadPerfil = datosActualizacion.visibilidadPerfil;
    if (datosActualizacion.activo !== undefined) datosActualizar.activo = datosActualizacion.activo;

    // Actualizar usuario
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      datosActualizar,
      { new: true, runValidators: true }
    ).select('-contraseña');

    console.log(`✅ Usuario actualizado: ${usuarioActualizado.correo}`);

    return usuarioActualizado;
  }

  /**
   * Eliminar usuario
   * @param {string} id - ID del usuario
   * @returns {Object} Información del usuario eliminado
   */
  async eliminarUsuario(id) {
    // Buscar usuario
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('No existe un usuario con el ID proporcionado');
    }

    // Eliminar usuario
    await Usuario.findByIdAndDelete(id);

    console.log(`✅ Usuario eliminado: ${usuario.correo}`);

    return {
      id: usuario._id,
      correo: usuario.correo,
      nombreCompleto: usuario.nombreCompleto
    };
  }

  /**
   * Verificar si un correo ya existe
   * @param {string} correo - Correo a verificar
   * @returns {boolean} true si existe, false si no
   */
  async verificarCorreoExistente(correo) {
    const usuario = await Usuario.findOne({ correo: correo.toLowerCase() });
    return !!usuario;
  }

  /**
   * Obtener estadísticas de usuarios
   * @returns {Object} Estadísticas generales
   */
  async obtenerEstadisticas() {
    const totalUsuarios = await Usuario.countDocuments();
    const usuariosActivos = await Usuario.countDocuments({ activo: true });
    const usuariosPorRol = await Usuario.aggregate([
      {
        $group: {
          _id: '$rol',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      totalUsuarios,
      usuariosActivos,
      usuariosInactivos: totalUsuarios - usuariosActivos,
      usuariosPorRol: usuariosPorRol.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new UsuariosService();

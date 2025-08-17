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

    // Validar que el rol no sea administrador
    if (rol && rol === 'administrador') {
      throw new Error('No se permite crear usuarios con rol de administrador a través de la API pública');
    }

    // Validar que el rol sea válido (usuario o profesional)
    if (rol && !['usuario', 'profesional'].includes(rol)) {
      throw new Error('Rol no válido. Solo se permiten los roles: usuario o profesional');
    }

    // Encriptar contraseña
    const saltRounds = config.seguridad.bcryptRounds;
    const contraseñaEncriptada = await bcrypt.hash(contraseña, saltRounds);

    // Crear nuevo usuario (permitir usuario y profesional, NO administrador)
    const nuevoUsuario = new Usuario({
      correo: correo.toLowerCase(),
      contraseña: contraseñaEncriptada,
      nombreCompleto,
      fechaNacimiento: new Date(fechaNacimiento),
      rol: rol || 'usuario', // Permitir usuario o profesional, no administrador
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
    
    // Filtro por rol
    if (filtros.rol) {
      filtrosConsulta.rol = filtros.rol;
    }
    
    // Filtro por estado activo (boolean)
    if (filtros.activo !== undefined) {
      if (filtros.activo === 'true' || filtros.activo === true) {
        filtrosConsulta.activo = true;
      } else if (filtros.activo === 'false' || filtros.activo === false) {
        filtrosConsulta.activo = false;
      }
    }
    
    // Filtro por estado (activo, inactivo, suspendido, eliminado)
    if (filtros.estado) {
      filtrosConsulta.estado = filtros.estado;
    }
    
    // Filtro de búsqueda por nombre o correo
    if (filtros.busqueda) {
      filtrosConsulta.$or = [
        { nombreCompleto: { $regex: filtros.busqueda, $options: 'i' } },
        { correo: { $regex: filtros.busqueda, $options: 'i' } }
      ];
    }

    // Calcular skip para paginación
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    // Log para debugging
    console.log('🔍 Filtros aplicados:', JSON.stringify(filtrosConsulta, null, 2));
    console.log('📊 Paginación:', { pagina, limite, skip });

    // Ejecutar consulta con paginación
    const usuarios = await Usuario.find(filtrosConsulta)
      .select('-contraseña')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    // Contar total de documentos
    const total = await Usuario.countDocuments(filtrosConsulta);

    // Log del resultado
    console.log(`✅ Usuarios encontrados: ${usuarios.length} de ${total} total`);

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
   * Cambiar estado del usuario
   * @param {string} id - ID del usuario
   * @param {string} nuevoEstado - Nuevo estado del usuario
   * @param {string} motivo - Motivo del cambio de estado
   * @returns {Object} Usuario actualizado sin contraseña
   */
  async cambiarEstadoUsuario(id, nuevoEstado, motivo = '') {
    // Buscar usuario
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('No existe un usuario con el ID proporcionado');
    }

    // Validar estado
    const estadosValidos = ['activo', 'inactivo', 'suspendido', 'eliminado'];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error('Estado no válido. Estados permitidos: activo, inactivo, suspendido, eliminado');
    }

    // Actualizar estado del usuario
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      {
        estado: nuevoEstado,
        fechaEstado: new Date(),
        motivoEstado: motivo,
        activo: nuevoEstado === 'activo' // Mantener sincronizado con el campo activo
      },
      { new: true, runValidators: true }
    ).select('-contraseña');

    console.log(`✅ Estado del usuario cambiado: ${usuarioActualizado.correo} -> ${nuevoEstado}`);

    return usuarioActualizado;
  }

  /**
   * Desactivar usuario (marcar como inactivo)
   * @param {string} id - ID del usuario
   * @param {string} motivo - Motivo de la desactivación
   * @returns {Object} Usuario desactivado
   */
  async desactivarUsuario(id, motivo = 'Desactivado por el administrador') {
    return await this.cambiarEstadoUsuario(id, 'inactivo', motivo);
  }

  /**
   * Activar usuario (marcar como activo)
   * @param {string} id - ID del usuario
   * @param {string} motivo - Motivo de la activación
   * @returns {Object} Usuario activado
   */
  async activarUsuario(id, motivo = 'Activado por el administrador') {
    return await this.cambiarEstadoUsuario(id, 'activo', motivo);
  }

  /**
   * Suspender usuario
   * @param {string} id - ID del usuario
   * @param {string} motivo - Motivo de la suspensión
   * @returns {Object} Usuario suspendido
   */
  async suspenderUsuario(id, motivo = 'Usuario suspendido') {
    return await this.cambiarEstadoUsuario(id, 'suspendido', motivo);
  }

  /**
   * Marcar usuario como eliminado (soft delete)
   * @param {string} id - ID del usuario
   * @param {string} motivo - Motivo de la eliminación
   * @returns {Object} Usuario marcado como eliminado
   */
  async marcarUsuarioEliminado(id, motivo = 'Usuario marcado como eliminado') {
    return await this.cambiarEstadoUsuario(id, 'eliminado', motivo);
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
    
    // Estadísticas por estado
    const usuariosPorEstado = await Usuario.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]);

    // Estadísticas por rol
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
      usuariosPorEstado: usuariosPorEstado.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usuariosPorRol: usuariosPorRol.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

module.exports = new UsuariosService();

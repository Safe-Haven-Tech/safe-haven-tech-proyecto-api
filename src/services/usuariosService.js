const Usuario = require('../models/Usuario');
const Denuncia = require('../models/Denuncia');
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
    const { correo, contraseña, nombreCompleto, fechaNacimiento, rol, anonimo, visibilidadPerfil, nombreUsuario, pronombres, biografia, genero } = datosUsuario;
  
    // Validar correo
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
  
    // Validar nombre de usuario
    if (!nombreUsuario || nombreUsuario.length > 20) {
      throw new Error('El nombre de usuario es obligatorio y no debe superar 20 caracteres');
    }
    const nombreUsuarioExistente = await Usuario.findOne({ nombreUsuario: nombreUsuario.toLowerCase() });
    if (nombreUsuarioExistente) {
      throw new Error('El nombre de usuario ya está en uso');
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
      rol: rol || 'usuario',
      anonimo: anonimo || false,
      visibilidadPerfil: visibilidadPerfil || 'publico',
      nombreUsuario: nombreUsuario.toLowerCase(),
      pronombres: pronombres || '',
      biografia: biografia || '',
      genero: genero || ''
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
   * Aplicar restricciones de visualización a un usuario
   * @param {Object} usuario - Usuario a filtrar
   * @param {string} usuarioActualId - ID del usuario que está consultando
   * @param {boolean} incluirDatosSensibles - Si incluir datos sensibles (solo para el propio usuario)
   * @returns {Object} Usuario con restricciones aplicadas
   */
  aplicarRestriccionesVisualizacion(usuario, usuarioActualId = null, incluirDatosSensibles = false) {
    // Si el usuario es anónimo, solo mostrar información básica
    if (usuario.anonimo) {
      return {
        _id: usuario._id,
        nombreCompleto: 'Usuario Anónimo',
        nombreUsuario: usuario.nombreUsuario,
        fotoPerfil: null,
        visibilidadPerfil: 'anonimo',
        anonimo: true,
        fechaRegistro: usuario.fechaRegistro
      };
    }

    // Si el perfil es privado, verificar permisos
    if (usuario.visibilidadPerfil === 'privado') {
      // Si no hay usuario autenticado, mostrar información básica
      if (!usuarioActualId) {
        return {
          _id: usuario._id,
          nombreCompleto: usuario.nombreCompleto,
          nombreUsuario: usuario.nombreUsuario,
          fotoPerfil: null,
          visibilidadPerfil: 'privado',
          anonimo: false,
          fechaRegistro: usuario.fechaRegistro
        };
      }

      // Si el usuario actual es el mismo usuario, mostrar toda la información
      if (usuario._id.toString() === usuarioActualId.toString()) {
        return usuario;
      }

      // Verificar si el usuario actual es seguidor
      const esSeguidor = usuario.seguidores && usuario.seguidores.some(seguidor => 
        seguidor.toString() === usuarioActualId.toString()
      );

      if (!esSeguidor) {
        return {
          _id: usuario._id,
          nombreCompleto: usuario.nombreCompleto,
          nombreUsuario: usuario.nombreUsuario,
          fotoPerfil: null,
          visibilidadPerfil: 'privado',
          anonimo: false,
          fechaRegistro: usuario.fechaRegistro
        };
      }
    }

    // Perfil público - mostrar información según permisos
    const usuarioFiltrado = {
      _id: usuario._id,
      nombreCompleto: usuario.nombreCompleto,
      nombreUsuario: usuario.nombreUsuario,
      fotoPerfil: usuario.fotoPerfil,
      visibilidadPerfil: usuario.visibilidadPerfil,
      anonimo: usuario.anonimo,
      fechaRegistro: usuario.fechaRegistro,
      // añadir campos útiles para listado público de profesionales
      biografia: usuario.biografia || '',
      infoProfesional: usuario.infoProfesional || null,
      ubicacion: usuario.ubicacion || (usuario.infoProfesional && usuario.infoProfesional.ubicacion) || null
    };

    // Si es el propio usuario o tiene permisos especiales, incluir datos adicionales
    if (incluirDatosSensibles || (usuarioActualId && usuario._id.toString() === usuarioActualId.toString())) {
      usuarioFiltrado.pronombres = usuario.pronombres;
      usuarioFiltrado.genero = usuario.genero;
      usuarioFiltrado.seguidores = usuario.seguidores;
      usuarioFiltrado.seguidos = usuario.seguidos;
    }

    return usuarioFiltrado;
  }

  /**
   * Obtener información pública de un usuario
   * @param {string} id - ID del usuario
   * @param {string} usuarioActualId - ID del usuario que está consultando
   * @returns {Object} Información pública del usuario
   */
  async obtenerUsuarioPublico(id, usuarioActualId = null) {
    const usuario = await Usuario.findById(id).select('nombreCompleto nombreUsuario fotoPerfil biografia pronombres genero visibilidadPerfil anonimo fechaRegistro seguidores');
    
    if (!usuario) {
      throw new Error('No existe un usuario con el ID proporcionado');
    }

    return this.aplicarRestriccionesVisualizacion(usuario, usuarioActualId, false);
  }

  /**
   * Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} datosActualizacion - Datos a actualizar
   * @returns {Object} Usuario actualizado sin contraseña
   */
  async actualizarUsuario(id, datosActualizacion) {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('No existe un usuario con el ID proporcionado');
    }
  
    const datosActualizar = {};
  
    if (datosActualizacion.nombreCompleto !== undefined) datosActualizar.nombreCompleto = datosActualizacion.nombreCompleto;
    if (datosActualizacion.fechaNacimiento !== undefined) datosActualizar.fechaNacimiento = new Date(datosActualizacion.fechaNacimiento);
    if (datosActualizacion.rol !== undefined) datosActualizar.rol = datosActualizacion.rol;
    if (datosActualizacion.anonimo !== undefined) datosActualizar.anonimo = datosActualizacion.anonimo;
    if (datosActualizacion.visibilidadPerfil !== undefined) datosActualizar.visibilidadPerfil = datosActualizacion.visibilidadPerfil;
    if (datosActualizacion.activo !== undefined) datosActualizar.activo = datosActualizacion.activo;
    if (datosActualizacion.pronombres !== undefined) {
      if (datosActualizacion.pronombres.length > 15) {
        throw new Error('Los pronombres no deben exceder 15 caracteres');
      }
      if (!/^[a-zA-Z0-9_ ]+$/.test(datosActualizacion.pronombres)) {
        throw new Error('Los pronombres solo pueden contener letras, números, espacios o guion bajo');
      }
      datosActualizar.pronombres = datosActualizacion.pronombres;
    }
    if (datosActualizacion.biografia !== undefined) datosActualizar.biografia = datosActualizacion.biografia;
    if (datosActualizacion.genero !== undefined) datosActualizar.genero = datosActualizacion.genero;
  
    // Validar y actualizar nombreUsuario si viene
    if (datosActualizacion.nombreUsuario !== undefined) {
      if (!datosActualizacion.nombreUsuario || datosActualizacion.nombreUsuario.length > 20) {
        throw new Error('El nombre de usuario es obligatorio y no debe superar 20 caracteres');
      }
  
      const nombreUsuarioExistente = await Usuario.findOne({
        nombreUsuario: datosActualizacion.nombreUsuario.toLowerCase(),
        _id: { $ne: id } // Excluir al usuario que se está actualizando
      });
  
      if (nombreUsuarioExistente) {
        throw new Error('El nombre de usuario ya está en uso');
      }
  
      if (!/^[a-zA-Z0-9_]+$/.test(datosActualizacion.nombreUsuario)) {
        throw new Error('El nombre de usuario solo puede contener letras, números y guion bajo');
      }
  
      datosActualizar.nombreUsuario = datosActualizacion.nombreUsuario.toLowerCase();
    }
  
    // Actualizar fotoPerfil si viene
    if (datosActualizacion.fotoPerfil !== undefined) {
      datosActualizar.fotoPerfil = datosActualizacion.fotoPerfil;
    }
  
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

async eliminarUsuario(id, contraseña = null) {
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    throw new Error('No existe un usuario con el ID proporcionado');
  }

 
  if (contraseña !== null) {
    const esValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!esValida) {
      throw new Error('Contraseña incorrecta');
    }
  }

 
  if (usuario.fotoPerfil) {
    try {
      await eliminarImagenCloudinary(usuario.fotoPerfil);
    } catch (err) {
      // No detener el proceso si falla la eliminación de la imagen
      console.warn('No se pudo eliminar la foto de perfil en Cloudinary:', err.message);
    }
  }

  await Usuario.findByIdAndDelete(id);
  return true;
}

 async crearUsuarioAnonimo()  {
  const randomId = Math.random().toString(36).substring(2, 10);
  const anonimo = new Usuario({
    nombreUsuario: `anon_${randomId}`,
    anonimo: true,
    activo: true,
    estado: 'activo'
  });
  await anonimo.save();
  return anonimo;
};



  /**
   * Denunciar a un usuario
   * @param {Object} datos - { usuarioDenunciadoId, usuarioId, motivo, descripcion }
   * @returns {Object} Denuncia creada
   */
 async denunciarUsuario({ usuarioDenunciadoId, usuarioId, motivo, descripcion = '' }) {
    if (!usuarioDenunciadoId) {
      throw new Error('Usuario denunciado requerido');
    }
    if (!usuarioId) {
      throw new Error('ID del autor de la denuncia requerido');
    }
    if (!motivo) {
      throw new Error('Motivo de denuncia requerido');
    }

    // Evitar auto-denuncia
    if (String(usuarioDenunciadoId) === String(usuarioId)) {
      throw new Error('No puedes denunciarte a ti mismo');
    }

    // Verificar existencia del usuario denunciado
    const usuario = await Usuario.findById(usuarioDenunciadoId);
    if (!usuario) {
      throw new Error('Usuario objetivo no encontrado');
    }

    
    const nuevaDenuncia = new Denuncia({
      tipoDenuncia: 'usuario',
      usuarioDenunciadoId: usuarioDenunciadoId, 
      usuarioId: usuarioId,
      motivo,
      descripcion,
      fecha: new Date()
    });

    // (opcional) debug log - eliminar en producción
    console.log('Creando denuncia (usuario):', {
      usuarioDenunciadoId,
      usuarioId,
      motivo,
      descripcion
    });

    const denunciaGuardada = await nuevaDenuncia.save();

    return denunciaGuardada;
  }

    /**
   * Buscar profesionales con filtros (público)
   * @param {Object} filtros - { especialidad, ciudad, disponible, idiomas, modalidad, q, ordenar }
   * @param {number} pagina
   * @param {number} limite
   * @returns {Object} { usuarios: [], paginacion: { total, pagina, limite, totalPages } }
   */
  async buscarProfesionales(filtros = {}, pagina = 1, limite = 10, ordenar = '') {
    try {
      const query = { rol: 'profesional', activo: true };

      // Texto de búsqueda (nombre, nickname, especialidades, títulos)
      if (filtros.q) {
        const regex = new RegExp(filtros.q, 'i');
        query.$or = [
          { nombreCompleto: regex },
          { nombreUsuario: regex },
          { 'infoProfesional.especialidades': regex },
          { 'infoProfesional.titulos': regex },
        ];
      }

      if (filtros.especialidad) {
        query['infoProfesional.especialidades'] = { $in: [new RegExp(filtros.especialidad, 'i')] };
      }

      if (filtros.ciudad) {
        query['infoProfesional.ubicacion.ciudad'] = new RegExp(filtros.ciudad, 'i');
      }

      if (typeof filtros.disponible !== 'undefined') {
        query['infoProfesional.disponible'] = filtros.disponible === 'true' || filtros.disponible === true;
      }

      if (filtros.idiomas) {
        const arr = Array.isArray(filtros.idiomas) ? filtros.idiomas : String(filtros.idiomas).split(',').map(s => s.trim()).filter(Boolean);
        if (arr.length) query['infoProfesional.idiomas'] = { $in: arr.map(i => new RegExp(i, 'i')) };
      }

      if (filtros.modalidad) {
        query['infoProfesional.modalidadesAtencion'] = { $in: [new RegExp(filtros.modalidad, 'i')] };
      }

      // Orden
      let sort = { nombreCompleto: 1 };
      if (ordenar === 'reciente') sort = { createdAt: -1 };
      else if (ordenar === 'mejor_valorados') sort = { 'infoProfesional.ratingPromedio': -1 };

      const skip = Math.max(0, (Number(pagina) - 1)) * Number(limite);
      const limit = Number(limite);

      // Proyección explícita: incluir campos públicos relevantes y excluir contraseña
      const [usuariosRaw, total] = await Promise.all([
        Usuario.find(query)
          .select('nombreCompleto nombreUsuario fotoPerfil biografia visibilidadPerfil anonimo infoProfesional ubicacion seguidores seguidos createdAt')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Usuario.countDocuments(query),
      ]);

      // Aplicar restricciones de visualización (quita campos sensibles)
      const usuarios = usuariosRaw.map(u => this.aplicarRestriccionesVisualizacion(u, null, false));

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        usuarios,
        paginacion: { total, pagina: Number(pagina), limite: limit, totalPages },
      };
    } catch (error) {
      // Propagar con contexto
      throw new Error(`Error en usuariosService.buscarProfesionales: ${error.message}`);
    }
  }

    /**
  * Registrar un nuevo usuario desde contexto administrador (permite asignar rol 'administrador')
   * @param {Object} datosUsuario
   * @returns {Object} Usuario creado sin contraseña
   */
  async registrarUsuarioAdmin(datosUsuario) {
    const {
      correo,
      contraseña,
      nombreCompleto,
      fechaNacimiento,
      rol = 'usuario',
      anonimo,
      visibilidadPerfil,
      nombreUsuario,
      pronombres,
      biografia,
      genero,
      creadoPorAdmin
    } = datosUsuario;

    // Campos requeridos
    if (!correo || !contraseña || !nombreUsuario) {
      throw new Error('correo, contraseña y nombreUsuario son requeridos');
    }

    // Validar unicidad de correo y nombreUsuario
    const usuarioExistente = await Usuario.findOne({ correo: correo.toLowerCase() });
    if (usuarioExistente) {
      throw new Error('El correo electrónico ya está registrado en el sistema');
    }
    const nombreUsuarioExistente = await Usuario.findOne({ nombreUsuario: nombreUsuario.toLowerCase() });
    if (nombreUsuarioExistente) {
      throw new Error('El nombre de usuario ya está en uso');
      }

    // Validar rol permitido (incluye administrador)
    if (rol && !['usuario', 'profesional', 'administrador'].includes(rol)) {
      throw new Error('Rol no válido. Solo se permiten los roles: usuario, profesional o administrador');
    }

    // Encriptar contraseña
    const saltRounds = config.seguridad.bcryptRounds;
    const contraseñaEncriptada = await bcrypt.hash(contraseña, saltRounds);

    // Crear nuevo usuario (permitir administrador aquí)
    const nuevoUsuario = new Usuario({
      correo: correo.toLowerCase(),
      contraseña: contraseñaEncriptada,
      nombreCompleto,
      fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
      rol: rol || 'usuario',
      anonimo: !!anonimo,
      visibilidadPerfil: visibilidadPerfil || 'publico',
      nombreUsuario: nombreUsuario.toLowerCase(),
      pronombres: pronombres || '',
      biografia: biografia || '',
      genero: genero || '',
      creadoPorAdmin: creadoPorAdmin || undefined,
      activo: true
    });

    const usuarioGuardado = await nuevoUsuario.save();

    // Remover contraseña de la respuesta
    const usuarioResponse = usuarioGuardado.toObject();
    delete usuarioResponse.contraseña;

    console.log(`✅ Usuario (admin) registrado exitosamente: ${usuarioGuardado.correo}`);
    return usuarioResponse;
  }
}



module.exports = new UsuariosService();

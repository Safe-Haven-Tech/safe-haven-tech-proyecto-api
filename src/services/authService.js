const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { config } = require('../config');

//  Añadir blacklist básica para tokens invalidados
const tokenBlacklist = new Set();

/**
 * Servicio para el manejo de autenticación
 */
class AuthService {
  
  /**
   * Autenticar usuario (login)
   * @param {string} correo - Correo electrónico del usuario
   * @param {string} contraseña - Contraseña del usuario
   * @returns {Object} Usuario autenticado con tokens
   */
  async autenticarUsuario(correo, contraseña) {
    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ correo: correo.toLowerCase() });
    
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (!usuario.activo || usuario.estado !== 'activo') {
      throw new Error('Usuario inactivo o suspendido');
    }

    // Verificar contraseña
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      throw new Error('Credenciales inválidas');
    }

    // Generar tokens
    const accessToken = this.generarAccessToken(usuario);
    const refreshToken = this.generarRefreshToken(usuario);

    // Actualizar último login y contador
    await Usuario.findByIdAndUpdate(usuario._id, {
      ultimoLogin: new Date(),
      $inc: { contadorLogins: 1 }
    });

    // Preparar respuesta sin contraseña
    const usuarioResponse = usuario.toObject();
    delete usuarioResponse.contraseña;

    console.log(`✅ Usuario autenticado: ${usuario.correo}`);

    return {
      usuario: usuarioResponse,
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn
    };
  }

  /**
   * Generar access token
   * @param {Object} usuario - Usuario para generar el token
   * @returns {string} JWT access token
   */
  generarAccessToken(usuario) {
    const payload = {
      id: usuario._id.toString(),
      correo: usuario.correo,
      nombreUsuario: usuario.nombreUsuario, //  AÑADIDO: nickname en el token
      rol: usuario.rol,
      tipo: 'access'
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  /**
   * Generar refresh token
   * @param {Object} usuario - Usuario para generar el token
   * @returns {string} JWT refresh token
   */
  generarRefreshToken(usuario) {
    const payload = {
      id: usuario._id.toString(),
      correo: usuario.correo,
      nombreUsuario: usuario.nombreUsuario, //  AÑADIDO: nickname en el refresh token también
      tipo: 'refresh'
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });
  }

  /**
   * Verificar token
   * @param {string} token - Token a verificar
   * @returns {Object} Payload del token decodificado
   */
  verificarToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (decoded.tipo !== 'access') {
        throw new Error('Tipo de token inválido');
      }



      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }
      throw error;
    }
  }

  /**
   * Invalidar tokens del usuario
   * @param {string} userId - ID del usuario
   */
  invalidarTokens(userId) {
    //  Añadir usuario a la blacklist
    tokenBlacklist.add(userId);
    console.log(`✅ Tokens invalidados para usuario: ${userId}`);
  }

  /**
   * Refrescar access token
   * @param {string} refreshToken - Refresh token válido
   * @returns {Object} Nuevo access token
   */
  async refrescarToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      if (decoded.tipo !== 'refresh') {
        throw new Error('Tipo de token inválido');
      }


      // Buscar usuario
      const usuario = await Usuario.findById(decoded.id);
      if (!usuario || !usuario.activo || usuario.estado !== 'activo') {
        throw new Error('Usuario no válido');
      }

      // Generar nuevo access token
      const nuevoAccessToken = this.generarAccessToken(usuario);

      console.log(` Token refrescado para: ${usuario.correo}`);

      return {
        accessToken: nuevoAccessToken,
        expiresIn: config.jwt.expiresIn
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Refresh token inválido');
      }
      throw error;
    }
  }

  /**
   * Cerrar sesión (logout)
   * @param {string} userId - ID del usuario
   * @returns {boolean} true si se cerró la sesión exitosamente
   */
  async cerrarSesion(userId) {
    try {
      //  Invalidar tokens al cerrar sesión
      this.invalidarTokens(userId);

      console.log(`✅ Sesión cerrada para usuario: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   * @param {string} userId - ID del usuario
   * @param {string} contraseñaActual - Contraseña actual
   * @param {string} nuevaContraseña - Nueva contraseña
   * @returns {Object} Usuario actualizado
   */
  async cambiarContraseña(userId, contraseñaActual, nuevaContraseña) {
    // Buscar usuario
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const contraseñaValida = await bcrypt.compare(contraseñaActual, usuario.contraseña);
    if (!contraseñaValida) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Encriptar nueva contraseña
    const saltRounds = config.seguridad.bcryptRounds;
    const nuevaContraseñaEncriptada = await bcrypt.hash(nuevaContraseña, saltRounds);

    // Actualizar contraseña
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      userId,
      {
        contraseña: nuevaContraseñaEncriptada,
        contraseñaCambiadaEn: new Date()
      },
      { new: true }
    ).select('-contraseña');

    //  Invalidar tokens después de cambiar contraseña
    this.invalidarTokens(userId);

    console.log(`✅ Contraseña cambiada para: ${usuario.correo}`);

    return usuarioActualizado;
  }

  /**
   * Obtener información del usuario desde el token
   * @param {string} token - Access token
   * @returns {Object} Información del usuario
   */
  async obtenerInformacionUsuario(token) {
    const decoded = this.verificarToken(token);
    
    const usuario = await Usuario.findById(decoded.id).select('-contraseña');
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Validar si un usuario puede acceder a un recurso
   * @param {Object} usuario - Usuario autenticado
   * @param {string} recursoId - ID del recurso
   * @param {string} accion - Acción a realizar
   * @returns {boolean} true si tiene permisos
   */
  validarPermisos(usuario, recursoId, accion) {
    // Administradores tienen acceso total
    if (usuario.rol === 'administrador') {
      return true;
    }

    // Usuarios pueden acceder a sus propios recursos
    if (usuario._id.toString() === recursoId) {
      return true;
    }

    // Profesionales pueden acceder a recursos de usuarios
    if (usuario.rol === 'profesional' && accion === 'read') {
      return true;
    }

    return false;
  }
}

module.exports = new AuthService();
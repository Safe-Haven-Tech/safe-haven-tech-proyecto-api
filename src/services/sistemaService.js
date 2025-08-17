const { config } = require('../config');

/**
 * Servicio para funcionalidades del sistema
 */
class SistemaService {
  
  /**
   * Obtener información de health check
   * @returns {Object} Información del estado del sistema
   */
  obtenerHealthCheck() {
    return {
      mensaje: 'SafeHaven API funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      entorno: process.env.NODE_ENV || 'development',
      estado: 'ok',
      uptime: process.uptime(),
      memoria: process.memoryUsage(),
      plataforma: process.platform,
      nodeVersion: process.version
    };
  }

  /**
   * Obtener información general del sistema
   * @returns {Object} Información del sistema
   */
  obtenerInformacionSistema() {
    return {
      nombre: 'SafeHaven API',
      descripcion: 'API para la aplicación SafeHaven',
      version: process.env.npm_package_version || '1.0.0',
      entorno: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      endpoints: {
        usuarios: '/api/usuarios',
        health: '/api/health',
        info: '/api/info'
      },
      configuracion: {
        servidor: {
          puerto: config.servidor.puerto,
          host: config.servidor.host
        },
        baseDatos: {
          nombre: config.baseDatos.nombreDB
        },
        seguridad: {
          rateLimit: config.seguridad.rateLimitMax,
          bcryptRounds: config.seguridad.bcryptRounds
        }
      }
    };
  }

  /**
   * Obtener estadísticas del sistema
   * @returns {Object} Estadísticas del sistema
   */
  obtenerEstadisticasSistema() {
    return {
      timestamp: new Date().toISOString(),
      proceso: {
        pid: process.pid,
        uptime: process.uptime(),
        memoria: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      sistema: {
        plataforma: process.platform,
        arquitectura: process.arch,
        nodeVersion: process.version,
        versiones: process.versions
      },
      entorno: {
        NODE_ENV: process.env.NODE_ENV,
        PUERTO: process.env.PUERTO,
        HOST: process.env.HOST
      }
    };
  }
}

module.exports = new SistemaService();

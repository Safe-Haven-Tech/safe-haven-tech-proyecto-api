require('dotenv').config();

const { conectarDB, obtenerEstadoConexion, estaConectado, cerrarConexion } = require('./database');

/**
 * Configuración principal del sistema
 */
const config = {
  servidor: {
    puerto: process.env.PUERTO || 3000,
    entorno: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },

  baseDatos: {
    mongoURL: process.env.MONGO_CONNECTION,
    nombreDB: process.env.MONGO_DB_NAME || 'safehaven',
    opciones: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    }
  },

  jwt: {
    secreto: process.env.JWT_SECRET || 'tu_secreto_super_seguro_aqui',
    expiracion: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExp: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  seguridad: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutos
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  cors: {
    origen: process.env.CORS_ORIGIN || '*',
    credenciales: process.env.CORS_CREDENCIALES === 'true' || false
  },

  logging: {
    nivel: process.env.LOG_LEVEL || 'info',
    archivo: process.env.LOG_FILE || false
  },

  email: {
    servicio: process.env.EMAIL_SERVICE || 'gmail',
    usuario: process.env.EMAIL_USER,
    contraseña: process.env.EMAIL_PASSWORD,
    desde: process.env.EMAIL_FROM || 'noreply@safehaven.com'
  }
};

/**
 * Validar configuraciones críticas
 */
const validarConfiguracion = () => {
  const errores = [];

  if (!config.baseDatos.mongoURL) {
    errores.push('MONGO_CONNECTION no está definida');
  }

  if (config.servidor.entorno === 'production' && config.jwt.secreto === 'tu_secreto_super_seguro_aqui') {
    errores.push('JWT_SECRET debe ser cambiado en producción');
  }

  if (config.servidor.entorno === 'production' && !config.email.usuario) {
    console.warn('⚠️ EMAIL_USER no está definido - funcionalidades de email no estarán disponibles');
  }

  if (errores.length > 0) {
    console.error('❌ Errores de configuración:');
    errores.forEach(error => console.error(`   - ${error}`));
    
    if (config.servidor.entorno === 'production') {
      process.exit(1);
    }
  }

  return errores.length === 0;
};

/**
 * Obtener configuración para un entorno específico
 */
const obtenerConfiguracion = (entorno = null) => {
  const env = entorno || config.servidor.entorno;
  
  switch (env) {
    case 'production':
      return {
        ...config,
        baseDatos: {
          ...config.baseDatos,
          opciones: {
            ...config.baseDatos.opciones,
            autoIndex: false,
            bufferCommands: false
          }
        },
        logging: {
          ...config.logging,
          nivel: 'error'
        }
      };
    
    case 'development':
      return {
        ...config,
        baseDatos: {
          ...config.baseDatos,
          opciones: {
            ...config.baseDatos.opciones,
            autoIndex: true,
            bufferCommands: true
          }
        },
        logging: {
          ...config.logging,
          nivel: 'debug'
        }
      };
    
    case 'test':
      return {
        ...config,
        baseDatos: {
          ...config.baseDatos,
          nombreDB: 'safehaven_test'
        },
        logging: {
          ...config.logging,
          nivel: 'warn'
        }
      };
    
    default:
      return config;
  }
};

/**
 * Inicializar el sistema de configuración
 */
const inicializarConfiguracion = async () => {
  try {
    console.log('🔧 Inicializando configuración del sistema...');
    
    if (!validarConfiguracion()) {
      throw new Error('Configuración inválida');
    }

    await conectarDB();
    
    console.log('✅ Sistema de configuración inicializado correctamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error al inicializar la configuración:', error.message);
    throw error;
  }
};

/**
 * Obtener estado completo del sistema
 */
const obtenerEstadoSistema = () => {
  return {
    servidor: {
      entorno: config.servidor.entorno,
      puerto: config.servidor.puerto,
      host: config.servidor.host
    },
    baseDatos: {
      estado: obtenerEstadoConexion(),
      conectado: estaConectado(),
      nombre: config.baseDatos.nombreDB
    },
    configuracion: {
      jwt: !!config.jwt.secreto,
      cors: config.cors.origen,
      logging: config.logging.nivel
    }
  };
};

module.exports = {
  config,
  obtenerConfiguracion,
  validarConfiguracion,
  inicializarConfiguracion,
  conectarDB,
  obtenerEstadoConexion,
  estaConectado,
  cerrarConexion,
  obtenerEstadoSistema
};

const mongoose = require('mongoose');

/**
 * Configuración de conexión a MongoDB
 */
const conectarDB = async () => {
  try {
    const mongoConnection = process.env.MONGO_CONNECTION;
    const mongoDbName = process.env.MONGO_DB_NAME || 'safehaven';
    
    if (!mongoConnection) {
      throw new Error('La variable de entorno MONGO_CONNECTION no está definida');
    }

    // Construir la URL completa con el nombre de la base de datos
    // Si MONGO_CONNECTION ya termina con /, no agregar otro
    // Si no termina con /, agregarlo antes del nombre de la BD
    let mongoURL = mongoConnection.trim();
    if (!mongoURL.endsWith('/')) {
      mongoURL += '/';
    }
    mongoURL += mongoDbName;

    const opcionesConexion = {
      maxPoolSize: 10, 
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000, 
      autoIndex: false, 
    };

    console.log('🔗 Conectando a MongoDB...');
    console.log(`📊 Base de datos: ${mongoDbName}`);
    console.log(`🔗 URL: ${mongoURL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Ocultar credenciales en el log

    const conexion = await mongoose.connect(mongoURL, opcionesConexion);
    
    console.log('✅ MongoDB conectado exitosamente');
    console.log(`📊 Base de datos: ${conexion.connection.name}`);
    console.log(`🔌 Host: ${conexion.connection.host}`);
    console.log(`🚪 Puerto: ${conexion.connection.port}`);

    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de conexión a MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Mongoose desconectado de MongoDB');
    });

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔄 Conexión a MongoDB cerrada por terminación de la aplicación');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error al cerrar la conexión:', error);
        process.exit(1);
      }
    });

    return conexion;

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    console.error('🔍 Verifica que:');
    console.error('   - La variable MONGO_CONNECTION esté definida');
    console.error('   - La variable MONGO_DB_NAME esté definida (o usará "safehaven" por defecto)');
    console.error('   - La URL de conexión sea válida');
    console.error('   - MongoDB esté ejecutándose');
    console.error('   - Las credenciales sean correctas');
    
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
    
    throw error;
  }
};

/**
 * Obtener el estado de la conexión
 */
const obtenerEstadoConexion = () => {
  const estados = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return estados[mongoose.connection.readyState] || 'unknown';
};

/**
 * Verificar si la conexión está activa
 */
const estaConectado = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Cerrar la conexión manualmente
 */
const cerrarConexion = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔄 Conexión a MongoDB cerrada manualmente');
  } catch (error) {
    console.error('❌ Error al cerrar la conexión:', error);
    throw error;
  }
};

module.exports = {
  conectarDB,
  obtenerEstadoConexion,
  estaConectado,
  cerrarConexion
};

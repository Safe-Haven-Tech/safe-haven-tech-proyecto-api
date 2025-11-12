const { inicializarConfiguracion, config, obtenerEstadoSistema } = require('./config');

// Importar la aplicación Express
const app = require('./app');

// Servicio de chat (limpieza de mensajes temporales)
const chatService = require('./services/chatService');

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hora
let cleanupInterval = null;

const runCleanup = async () => {
  try {
    const deleted = await chatService.limpiarMensajesTemporalesExpirados();
    console.log(`[chat-cleanup] Mensajes temporales eliminados: ${deleted}`);
  } catch (err) {
    console.error('[chat-cleanup] Error limpiando mensajes temporales:', err);
  }
};

// Función para iniciar el servidor
const iniciarServidor = async () => {
  try {
    console.log('🚀 Iniciando servidor SafeHaven...');

    // Inicializar configuración del sistema (incluye conexión a BD)
    await inicializarConfiguracion();

    // Obtener estado del sistema
    const estadoSistema = obtenerEstadoSistema();
    console.log('📊 Estado del sistema:', JSON.stringify(estadoSistema, null, 2));

    // Iniciar el servidor HTTP
    const servidor = app.listen(config.servidor.puerto, config.servidor.host, () => {
      const infoServidor = app.getServerInfo();

      console.log('🎉 Servidor SafeHaven iniciado exitosamente!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🌐 Servidor corriendo en: http://${config.servidor.host}:${config.servidor.puerto}`);
      console.log(`🔧 Entorno: ${infoServidor.entorno}`);
      console.log(`📅 Fecha: ${infoServidor.timestamp}`);
      console.log(`📦 Versión: ${infoServidor.version}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (config.servidor.entorno === 'development') {
        console.log('💡 Modo desarrollo activado');
        console.log('📝 Logs detallados habilitados');
        console.log('🔍 Auto-indexación de MongoDB habilitada');
      }
    });

    servidor.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${config.servidor.puerto} ya está en uso`);
        console.error('💡 Soluciones:');
        console.error('   1. Cambia el puerto en la variable de entorno PUERTO');
        console.error('   2. Detén otros servicios que usen este puerto');
        console.error('   3. Usa: lsof -i :3000 (Linux/Mac) o netstat -an | findstr :3000 (Windows)');
      } else {
        console.error('❌ Error al iniciar el servidor:', error);
      }
      process.exit(1);
    });

    // Ejecutar limpieza inicial de mensajes temporales y programar intervalos
    try {
      await runCleanup();
      cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
    } catch (err) {
      console.error('Error inicializando limpieza de mensajes temporales:', err);
    }

    // Configurar manejo de señales del sistema
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor gracefulmente...`);

      try {
        // Clear cleanup interval if set
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
          cleanupInterval = null;
          console.log('✅ Intervalo de limpieza de chat detenido');
        }

        // Cerrar el servidor HTTP
        await new Promise((resolve) => {
          servidor.close(resolve);
        });

        console.log('✅ Servidor HTTP cerrado');

        // Importar y ejecutar cierre de conexión a BD
        const { cerrarConexion } = require('./config');
        await cerrarConexion();

        console.log('✅ Conexión a base de datos cerrada');
        console.log('👋 Servidor cerrado exitosamente');

        process.exit(0);
      } catch (error) {
        console.error('❌ Error durante el cierre graceful:', error);
        process.exit(1);
      }
    };

    // Manejar señales del sistema
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado (uncaughtException):', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      console.error('📋 Promesa:', promise);
      gracefulShutdown('unhandledRejection');
    });

    // Manejar advertencias
    process.on('warning', (warning) => {
      console.warn('⚠️ Advertencia del sistema:', warning.name);
      console.warn('📝 Mensaje:', warning.message);
      console.warn('📚 Stack:', warning.stack);
    });

    return servidor;

  } catch (error) {
    console.error('❌ Error fatal al iniciar la aplicación:', error);
    console.error('🔍 Verifica:');
    console.error('   - Variables de entorno configuradas');
    console.error('   - MongoDB ejecutándose');
    console.error('   - Dependencias instaladas');
    console.error('   - Permisos de archivos');

    process.exit(1);
  }
};

// Función para verificar dependencias
const verificarDependencias = () => {
  const dependenciasRequeridas = [
    'express',
    'mongoose',
    'cors',
    'helmet',
    'morgan',
    'express-rate-limit'
  ];

  const dependenciasFaltantes = [];

  dependenciasRequeridas.forEach(dep => {
    try {
      require.resolve(dep);
    } catch (e) {
      dependenciasFaltantes.push(dep);
    }
  });

  if (dependenciasFaltantes.length > 0) {
    console.error('❌ Dependencias faltantes:', dependenciasFaltantes.join(', '));
    console.error('💡 Ejecuta: npm install');
    process.exit(1);
  }

  console.log('✅ Todas las dependencias están instaladas');
};

// Función principal
const main = async () => {
  try {
    console.log('🔍 Verificando dependencias...');
    verificarDependencias();

    console.log('🚀 Iniciando aplicación SafeHaven...');
    await iniciarServidor();

  } catch (error) {
    console.error('❌ Error en la función principal:', error);
    process.exit(1);
  }
};

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = {
  iniciarServidor,
  verificarDependencias,
  main
};
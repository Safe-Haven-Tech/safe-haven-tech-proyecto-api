const mongoose = require('mongoose');
const chatService = require('../services/chatService');
const { config } = require('../config');

/**
 * Script para limpiar mensajes temporales expirados
 * Se ejecuta cada hora para mantener la base de datos limpia
 */

async function limpiarMensajesTemporales() {
  try {
    console.log('🧹 Iniciando limpieza de mensajes temporales expirados...');
    
    const resultado = await chatService.limpiarMensajesExpirados();
    
    console.log(`✅ Limpieza completada: ${resultado.deletedCount} mensajes eliminados`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de mensajes temporales:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  // Conectar a la base de datos
  mongoose.connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ Conectado a la base de datos');
    return limpiarMensajesTemporales();
  })
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = limpiarMensajesTemporales;

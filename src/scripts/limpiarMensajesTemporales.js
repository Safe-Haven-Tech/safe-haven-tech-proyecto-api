const mongoose = require('mongoose');
const chatService = require('../services/chatService');
require('dotenv').config();

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
  // Construir URL completa con el nombre de la base de datos
  require('dotenv').config();
  const mongoConnection = process.env.MONGO_CONNECTION || 'mongodb://localhost:27017/';
  const mongoDbName = process.env.MONGO_DB_NAME || 'safehaven';
  const mongoUrl = `${mongoConnection}${mongoDbName}`;
  
  console.log('🔗 Conectando a MongoDB...');
  console.log(`📊 Base de datos: ${mongoDbName}`);
  
  // Conectar a la base de datos
  mongoose.connect(mongoUrl, {
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

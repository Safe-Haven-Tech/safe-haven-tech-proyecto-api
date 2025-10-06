const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Chat = require('../models/Chat');
const MensajeChat = require('../models/MensajeChat');
const chatService = require('../services/chatService');
require('dotenv').config();

// Función para conectar a la base de datos
const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION || 'mongodb://localhost:27017/safehaven');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función para crear mensajes temporales válidos
const crearMensajesTemporalesValidos = async () => {
  try {
    console.log('⏰ Creando mensajes temporales válidos...\n');
    
    // Obtener un chat existente
    const chat = await Chat.findOne({ activo: true });
    if (!chat) {
      throw new Error('No se encontró ningún chat activo');
    }
    
    console.log(`📱 Chat encontrado: ${chat._id}`);
    
    // Obtener fecha actual
    const ahora = new Date();
    console.log(`🌍 Fecha actual: ${ahora.toISOString()}`);
    
    // Crear mensajes temporales que expiren en diferentes momentos del futuro
    const mensajesTemporales = [
      {
        contenido: 'Mensaje temporal que expira en 5 minutos',
        minutos: 5
      },
      {
        contenido: 'Mensaje temporal que expira en 30 minutos',
        minutos: 30
      },
      {
        contenido: 'Mensaje temporal que expira en 2 horas',
        minutos: 120
      },
      {
        contenido: 'Mensaje temporal que expira en 1 día',
        minutos: 1440
      }
    ];
    
    console.log('\n📝 Creando mensajes temporales...');
    
    for (const mensajeData of mensajesTemporales) {
      const expiraEn = new Date(ahora.getTime() + mensajeData.minutos * 60 * 1000);
      
      const mensaje = await chatService.enviarMensaje(
        chat._id,
        chat.participantes[0],
        mensajeData.contenido,
        true, // esTemporal
        expiraEn,
        []
      );
      
      console.log(`✅ ${mensajeData.contenido}`);
      console.log(`   ID: ${mensaje._id}`);
      console.log(`   Expira en: ${expiraEn.toISOString()}`);
      console.log(`   En ${mensajeData.minutos} minutos`);
      console.log('');
    }
    
    // Crear un mensaje normal para comparar
    console.log('📝 Creando mensaje normal...');
    const mensajeNormal = await chatService.enviarMensaje(
      chat._id,
      chat.participantes[0],
      'Mensaje normal (no temporal)',
      false,
      null,
      []
    );
    console.log(`✅ Mensaje normal creado: ${mensajeNormal._id}`);
    
    // Obtener todos los mensajes del chat
    console.log('\n🔍 Obteniendo mensajes del chat...');
    const resultado = await chatService.obtenerMensajes(chat._id, chat.participantes[0], 1, 10);
    
    console.log(`\n📊 Resultados:`);
    console.log(`   Total de mensajes visibles: ${resultado.mensajes.length}`);
    console.log(`   Total en base de datos: ${resultado.paginacion.totalElementos}`);
    
    console.log('\n📋 Mensajes visibles:');
    resultado.mensajes.forEach((msg, index) => {
      const esTemporal = msg.esTemporal ? '⏰' : '📝';
      const tiempoRestante = msg.esTemporal ? 
        Math.round((msg.expiraEn.getTime() - ahora.getTime()) / 1000 / 60) : 
        null;
      
      console.log(`   ${index + 1}. ${esTemporal} ${msg.contenido}`);
      if (msg.esTemporal) {
        console.log(`      ⏰ Expira en: ${msg.expiraEn.toISOString()}`);
        console.log(`      ⏱️ Tiempo restante: ${tiempoRestante} minutos`);
      }
    });
    
    // Mostrar endpoints para probar
    console.log('\n🎯 Endpoints para probar en Postman:');
    console.log('\n🔹 Obtener mensajes del chat:');
    console.log(`   GET /api/chat/${chat._id}/mensajes`);
    console.log('   Authorization: Bearer TOKEN');
    
    console.log('\n🔹 Enviar mensaje temporal:');
    console.log(`   POST /api/chat/${chat._id}/mensajes`);
    console.log('   Content-Type: application/json');
    console.log('   Authorization: Bearer TOKEN');
    console.log('   Body:');
    console.log('   {');
    console.log('     "contenido": "Mensaje que expira en 1 hora",');
    console.log('     "esTemporal": true,');
    console.log('     "expiraEn": "2025-10-06T03:00:00.000Z"');
    console.log('   }');
    
    console.log('\n✅ Mensajes temporales válidos creados exitosamente');
    console.log('💡 Ahora deberías ver los mensajes temporales en la API');
    
  } catch (error) {
    console.error('❌ Error creando mensajes temporales:', error.message);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    console.log('🚀 Iniciando creación de mensajes temporales válidos...\n');
    
    // Conectar a la base de datos
    await conectarDB();
    
    // Crear mensajes temporales válidos
    await crearMensajesTemporalesValidos();
    
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = { crearMensajesTemporalesValidos };

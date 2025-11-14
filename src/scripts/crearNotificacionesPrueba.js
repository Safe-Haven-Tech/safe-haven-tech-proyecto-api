const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Notificacion = require('../models/Notificacion');
require('dotenv').config();

// Función para conectar a la base de datos
const conectarDB = async () => {
  try {
    // Construir URL completa con el nombre de la base de datos
    const mongoConnection = process.env.MONGO_CONNECTION || 'mongodb://localhost:27017/';
    const mongoDbName = process.env.MONGO_DB_NAME || 'safehaven';
    const mongoUrl = `${mongoConnection}${mongoDbName}`;
    
    console.log('🔗 Conectando a MongoDB...');
    console.log(`📊 Base de datos: ${mongoDbName}`);
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función para crear notificaciones de prueba
const crearNotificacionesPrueba = async (usuarioId) => {
  try {
    console.log(`📝 Creando notificaciones de prueba para usuario: ${usuarioId}`);
    
    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    console.log(`✅ Usuario encontrado: ${usuario.nombreCompleto}`);
    
    // Crear diferentes tipos de notificaciones
    const notificaciones = [
      {
        usuarioId: usuarioId,
        origenId: usuarioId, // Usar el mismo usuario como origen para notificaciones del sistema
        tipo: 'otro',
        descripcion: '¡Bienvenido a SafeHaven! Tu cuenta ha sido creada exitosamente.',
        ruta: '/perfil',
        leida: false
      },
      {
        usuarioId: usuarioId,
        origenId: usuarioId,
        tipo: 'otro',
        descripcion: 'Nuevo recurso informativo disponible: "Guía de Bienestar Emocional"',
        ruta: '/recursos-informativos',
        leida: false
      },
      {
        usuarioId: usuarioId,
        origenId: usuarioId,
        tipo: 'otro',
        descripcion: 'No olvides completar tu perfil para una mejor experiencia',
        ruta: '/perfil/editar',
        leida: true
      },
      {
        usuarioId: usuarioId,
        origenId: usuarioId,
        tipo: 'otro',
        descripcion: 'SafeHaven ha sido actualizado con nuevas funcionalidades de chat',
        ruta: '/ayuda/novedades',
        leida: false
      },
      {
        usuarioId: usuarioId,
        origenId: usuarioId,
        tipo: 'otro',
        descripcion: 'Tu sesión se cerrará automáticamente en 30 minutos por seguridad',
        ruta: '/configuracion/seguridad',
        leida: false
      }
    ];
    
    // Crear notificaciones en la base de datos
    const notificacionesCreadas = await Notificacion.insertMany(notificaciones);
    
    console.log(`✅ Creadas ${notificacionesCreadas.length} notificaciones de prueba`);
    
    // Mostrar resumen
    console.log('\n📊 Resumen de notificaciones creadas:');
    notificacionesCreadas.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.tipo}: ${notif.descripcion}`);
      console.log(`     Leída: ${notif.leida ? 'Sí' : 'No'}`);
      console.log(`     Ruta: ${notif.ruta}`);
      console.log('');
    });
    
    return notificacionesCreadas;
    
  } catch (error) {
    console.error('❌ Error creando notificaciones:', error.message);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    console.log('🚀 Iniciando creación de notificaciones de prueba...\n');
    
    const usuarioId = '68ab794b0fd88ee01c88df76';
    
    // Conectar a la base de datos
    await conectarDB();
    
    // Crear notificaciones
    await crearNotificacionesPrueba(usuarioId);
    
    console.log('\n🎉 ¡Notificaciones creadas exitosamente!');
    
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

module.exports = { crearNotificacionesPrueba };

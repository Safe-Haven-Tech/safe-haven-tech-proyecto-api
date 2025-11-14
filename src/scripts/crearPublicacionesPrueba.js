const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Publicacion = require('../models/Publicacion');
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

// Función para crear publicaciones de prueba
const crearPublicacionesPrueba = async (usuarioId) => {
  try {
    console.log(`📝 Creando publicaciones de prueba para usuario: ${usuarioId}`);
    
    // Verificar que el usuario existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    console.log(`✅ Usuario encontrado: ${usuario.nombreCompleto}`);
    
    // Crear diferentes tipos de publicaciones
    const publicaciones = [
      {
        autorId: usuarioId,
        contenido: "¡Hola a todos! Me siento muy agradecido por formar parte de esta comunidad. Hoy quiero compartir que cada día es una oportunidad para crecer y aprender. 💪",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      },
      {
        autorId: usuarioId,
        contenido: "Reflexión del día: La salud mental es tan importante como la física. No tengamos miedo de pedir ayuda cuando la necesitemos. Todos merecemos apoyo y comprensión. 🤗",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      },
      {
        autorId: usuarioId,
        contenido: "Comparto algunos consejos que me han ayudado en momentos difíciles:\n\n1. Respira profundo cuando sientas ansiedad\n2. Habla con alguien de confianza\n3. Practica la gratitud diariamente\n4. No tengas miedo de buscar ayuda profesional\n\n¿Qué consejos les han funcionado a ustedes?",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      },
      {
        autorId: usuarioId,
        contenido: "¡Feliz viernes! 🎉 Hoy quiero recordarles que es importante celebrar las pequeñas victorias. Cada paso que damos hacia nuestro bienestar cuenta. ¿Qué logro pequeño quieren celebrar hoy?",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      },
      {
        autorId: usuarioId,
        contenido: "La importancia de la conexión humana en nuestra salud mental no puede ser subestimada. Un simple '¿cómo estás?' puede hacer la diferencia en el día de alguien. Seamos más empáticos y compasivos con los demás. 💙",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      },
      {
        autorId: usuarioId,
        contenido: "Recursos que me han ayudado:\n\n📚 Libros recomendados:\n- 'El poder del ahora' de Eckhart Tolle\n- 'Mindfulness para principiantes' de Jon Kabat-Zinn\n\n🎵 Música relajante:\n- Sonidos de naturaleza\n- Música instrumental suave\n\n¿Qué recursos les han funcionado?",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      },
      {
        autorId: usuarioId,
        contenido: "Hoy quiero hablar sobre la importancia de establecer límites saludables. Decir 'no' cuando es necesario no es egoísta, es autocuidado. Nuestra salud mental debe ser una prioridad. 🌟",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      },
      {
        autorId: usuarioId,
        contenido: "Gratitud del día: Estoy agradecido por:\n\n✨ Las personas que me apoyan\n✨ Las oportunidades de crecimiento\n✨ Los momentos de paz y tranquilidad\n✨ La capacidad de ayudar a otros\n\n¿Por qué están agradecidos hoy?",
        tipo: "foro",
        visible: true,
        moderada: false,
        likes: 0,
        comentarios: 0,
        compartidos: 0
      }
    ];
    
    // Crear publicaciones en la base de datos
    const publicacionesCreadas = await Publicacion.insertMany(publicaciones);
    
    console.log(`✅ Creadas ${publicacionesCreadas.length} publicaciones de prueba`);
    
    // Mostrar resumen
    console.log('\n📊 Resumen de publicaciones creadas:');
    publicacionesCreadas.forEach((pub, index) => {
      console.log(`  ${index + 1}. ${pub.contenido.substring(0, 50)}...`);
      console.log(`     Tipo: ${pub.tipo}`);
      console.log(`     Visible: ${pub.visible}`);
      console.log(`     ID: ${pub._id}`);
      console.log('');
    });
    
    return publicacionesCreadas;
    
  } catch (error) {
    console.error('❌ Error creando publicaciones:', error.message);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    console.log('🚀 Iniciando creación de publicaciones de prueba...\n');
    
    const usuarioId = '68e30af6fc3e89ec7ded9587';
    
    // Conectar a la base de datos
    await conectarDB();
    
    // Crear publicaciones
    await crearPublicacionesPrueba(usuarioId);
    
    console.log('\n🎉 ¡Publicaciones creadas exitosamente!');
    console.log('\n💡 Ahora puedes probar las reacciones con estos endpoints:');
    console.log('   POST /api/red-social/reaccionar/PUBLICACION_ID');
    console.log('   DELETE /api/red-social/reaccionar/PUBLICACION_ID');
    
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

module.exports = { crearPublicacionesPrueba };

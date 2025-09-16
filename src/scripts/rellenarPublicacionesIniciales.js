const mongoose = require('mongoose');
const Publicacion = require('../models/Publicacion');
const Usuario = require('../models/Usuario');
const { config } = require('../config');

// Conectar a la base de datos
const conectarDB = async () => {
  try {
    await mongoose.connect(config.database.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

// Datos de ejemplo para publicaciones
const publicacionesEjemplo = [
  {
    contenido: "¡Hola a todos! Me alegra formar parte de esta comunidad. Espero poder compartir experiencias y aprender de todos ustedes.",
    tipo: "foro",
    anonimo: false,
    archivosAdjuntos: []
  },
  {
    contenido: "¿Alguien ha tenido experiencia con terapias de grupo? Me gustaría saber sus opiniones y recomendaciones.",
    tipo: "foro",
    anonimo: false,
    archivosAdjuntos: []
  },
  {
    contenido: "Comparto este recurso que me ha sido muy útil en mi proceso de recuperación. Espero que les sirva también.",
    tipo: "foro",
    anonimo: true,
    archivosAdjuntos: []
  },
  {
    contenido: "Hoy quiero compartir con ustedes una reflexión personal sobre la importancia del autocuidado en nuestra vida diaria.",
    tipo: "perfil",
    anonimo: false,
    multimedia: [],
    etiquetasUsuarios: []
  },
  {
    contenido: "Les comparto una foto de mi espacio de trabajo que me ayuda a mantener la calma y concentración.",
    tipo: "perfil",
    anonimo: false,
    multimedia: [],
    etiquetasUsuarios: []
  },
  {
    contenido: "¿Cuáles son sus técnicas favoritas para manejar el estrés? Me gustaría conocer diferentes perspectivas.",
    tipo: "foro",
    anonimo: false,
    archivosAdjuntos: []
  },
  {
    contenido: "Comparto este artículo que encontré sobre técnicas de respiración. Me ha ayudado mucho en momentos difíciles.",
    tipo: "foro",
    anonimo: false,
    archivosAdjuntos: []
  },
  {
    contenido: "Hoy quiero agradecer a esta comunidad por el apoyo que me han brindado. No saben lo mucho que significa para mí.",
    tipo: "perfil",
    anonimo: false,
    multimedia: [],
    etiquetasUsuarios: []
  },
  {
    contenido: "¿Alguien conoce grupos de apoyo en la zona? Me gustaría participar en actividades presenciales.",
    tipo: "foro",
    anonimo: false,
    archivosAdjuntos: []
  },
  {
    contenido: "Comparto mi experiencia con la meditación. Ha sido un cambio muy positivo en mi vida.",
    tipo: "foro",
    anonimo: true,
    archivosAdjuntos: []
  }
];

// Función para crear publicaciones de ejemplo
const crearPublicacionesEjemplo = async () => {
  try {
    console.log('🔄 Creando publicaciones de ejemplo...');

    // Obtener usuarios existentes
    const usuarios = await Usuario.find({ activo: true, estado: 'activo' }).limit(5);
    
    if (usuarios.length === 0) {
      console.log('⚠️  No hay usuarios activos en la base de datos. Creando publicaciones sin autor...');
      return;
    }

    const publicacionesCreadas = [];

    for (let i = 0; i < publicacionesEjemplo.length; i++) {
      const publicacionData = publicacionesEjemplo[i];
      const autorIndex = i % usuarios.length;
      const autor = usuarios[autorIndex];

      const publicacion = new Publicacion({
        ...publicacionData,
        autorId: autor._id,
        fecha: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
      });

      await publicacion.save();
      publicacionesCreadas.push(publicacion);
      
      console.log(`✅ Publicación ${i + 1} creada para usuario ${autor.nombreCompleto}`);
    }

    console.log(`🎉 Se crearon ${publicacionesCreadas.length} publicaciones de ejemplo`);
    return publicacionesCreadas;

  } catch (error) {
    console.error('❌ Error al crear publicaciones de ejemplo:', error);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    await conectarDB();
    
    // Verificar si ya existen publicaciones
    const publicacionesExistentes = await Publicacion.countDocuments();
    if (publicacionesExistentes > 0) {
      console.log(`⚠️  Ya existen ${publicacionesExistentes} publicaciones en la base de datos`);
      console.log('¿Deseas continuar y agregar más publicaciones? (Ctrl+C para cancelar)');
      
      // Esperar 3 segundos para que el usuario pueda cancelar
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    await crearPublicacionesEjemplo();
    
    console.log('✅ Script completado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  crearPublicacionesEjemplo,
  publicacionesEjemplo
};

const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Publicacion = require('../models/Publicacion');
const Comentario = require('../models/Comentario');
const RecursoInformativo = require('../models/RecursoInformativo');
const Encuesta = require('../models/Encuesta');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Script para crear datos completos de prueba para testing de usuarios
 */

const crearDatosPrueba = async () => {
  try {
    // Construir URL completa con el nombre de la base de datos
    const mongoConnection = process.env.MONGO_CONNECTION;
    const mongoDbName = process.env.MONGO_DB_NAME || 'safehaven';
    const mongoUrl = `${mongoConnection}${mongoDbName}`;
    
    console.log('🔗 Conectando a MongoDB...');
    console.log(`📊 Base de datos: ${mongoDbName}`);
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB');
    console.log('');
    console.log('🎭 CREANDO DATOS DE PRUEBA PARA TESTING DE USUARIOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // ========== PASO 1: CREAR USUARIOS DE PRUEBA ==========
    console.log('👥 Paso 1/6: Creando usuarios de prueba...');
    
    const contraseñaEncriptada = await bcrypt.hash('TestUser123', 10);
    
    const usuariosData = [
      {
        nombreUsuario: 'test_usuario1',
        correo: 'test.usuario1@safehaven.com',
        contraseña: contraseñaEncriptada,
        nombreCompleto: 'María Test Usuario',
        fechaNacimiento: new Date('1995-06-15'),
        rol: 'usuario',
        genero: 'Femenino',
        biografia: 'Usuario de prueba para testing de funcionalidades',
        visibilidadPerfil: 'publico',
        activo: true,
        estado: 'activo'
      },
      {
        nombreUsuario: 'test_usuario2',
        correo: 'test.usuario2@safehaven.com',
        contraseña: contraseñaEncriptada,
        nombreCompleto: 'Carlos Test Usuario',
        fechaNacimiento: new Date('1992-03-20'),
        rol: 'usuario',
        genero: 'Masculino',
        biografia: 'Usuario de prueba con perfil privado',
        visibilidadPerfil: 'privado',
        activo: true,
        estado: 'activo'
      },
      {
        nombreUsuario: 'test_usuario3',
        correo: 'test.usuario3@safehaven.com',
        contraseña: contraseñaEncriptada,
        nombreCompleto: 'Ana Test Usuario',
        fechaNacimiento: new Date('1998-08-10'),
        rol: 'usuario',
        genero: 'Femenino',
        biografia: 'Usuario de prueba activo en el foro',
        visibilidadPerfil: 'publico',
        activo: true,
        estado: 'activo'
      },
      {
        nombreUsuario: 'test_profesional',
        correo: 'test.profesional@safehaven.com',
        contraseña: await bcrypt.hash('TestProf123', 10),
        nombreCompleto: 'Laura Test Profesional',
        fechaNacimiento: new Date('1988-12-05'),
        rol: 'profesional',
        genero: 'Femenino',
        biografia: 'Psicóloga clínica especializada en violencia de género',
        visibilidadPerfil: 'publico',
        activo: true,
        estado: 'activo',
        infoProfesional: {
          titulos: ['Psicóloga Clínica', 'Máster en Violencia de Género'],
          especialidades: ['Violencia Doméstica', 'Trauma', 'Terapia de pareja'],
          registroProfesional: 'TEST-12345',
          institucionTitulo: 'Universidad de Pruebas',
          añosExperiencia: 8,
          disponible: true,
          modalidadesAtencion: ['online', 'presencial'],
          ubicacion: {
            ciudad: 'Santiago',
            pais: 'Chile'
          }
        }
      },
      {
        nombreUsuario: 'test_admin',
        correo: 'test.admin@safehaven.com',
        contraseña: await bcrypt.hash('TestAdmin123', 10),
        nombreCompleto: 'Admin Test Sistema',
        fechaNacimiento: new Date('1985-01-15'),
        rol: 'administrador',
        genero: 'Otro',
        biografia: 'Administrador de prueba del sistema',
        visibilidadPerfil: 'publico',
        activo: true,
        estado: 'activo'
      }
    ];

    const usuarios = {};
    for (const userData of usuariosData) {
      let usuario = await Usuario.findOne({ correo: userData.correo });
      if (!usuario) {
        usuario = new Usuario(userData);
        await usuario.save();
        console.log(`   ✅ Usuario creado: ${userData.nombreUsuario}`);
      } else {
        console.log(`   ⚠️  Usuario ya existe: ${userData.nombreUsuario}`);
      }
      usuarios[userData.nombreUsuario] = usuario;
    }

    // ========== PASO 2: CREAR RELACIONES ENTRE USUARIOS ==========
    console.log('');
    console.log('🤝 Paso 2/6: Creando relaciones entre usuarios...');
    
    // Usuario1 sigue a Usuario2 y Usuario3
    if (!usuarios.test_usuario1.seguidos.includes(usuarios.test_usuario2._id)) {
      usuarios.test_usuario1.seguidos.push(usuarios.test_usuario2._id);
      usuarios.test_usuario2.seguidores.push(usuarios.test_usuario1._id);
    }
    if (!usuarios.test_usuario1.seguidos.includes(usuarios.test_usuario3._id)) {
      usuarios.test_usuario1.seguidos.push(usuarios.test_usuario3._id);
      usuarios.test_usuario3.seguidores.push(usuarios.test_usuario1._id);
    }
    
    await usuarios.test_usuario1.save();
    await usuarios.test_usuario2.save();
    await usuarios.test_usuario3.save();
    
    console.log('   ✅ Relaciones de seguimiento creadas');

    // ========== PASO 3: CREAR PUBLICACIONES DEL FORO ==========
    console.log('');
    console.log('📝 Paso 3/6: Creando publicaciones del foro...');
    
    const publicacionesForo = [
      {
        autorId: usuarios.test_usuario1._id,
        contenido: 'Hola a todos, soy nueva en la comunidad. Me gustaría compartir mi experiencia y aprender de ustedes.',
        tipo: 'foro',
        anonimo: false,
        multimedia: [],
        archivosAdjuntos: []
      },
      {
        autorId: usuarios.test_usuario2._id,
        contenido: 'Esta es una publicación anónima de prueba. Necesito ayuda para identificar señales de abuso emocional.',
        tipo: 'foro',
        anonimo: true,
        multimedia: [],
        archivosAdjuntos: []
      },
      {
        autorId: usuarios.test_usuario3._id,
        contenido: '¿Alguien tiene experiencia con terapia online? Estoy considerando comenzar.',
        tipo: 'foro',
        anonimo: false,
        multimedia: [],
        archivosAdjuntos: []
      },
      {
        autorId: usuarios.test_profesional._id,
        contenido: 'Hola comunidad, soy psicóloga y estoy aquí para ayudar. Recuerden que buscar ayuda profesional es un signo de fortaleza.',
        tipo: 'foro',
        anonimo: false,
        multimedia: [],
        archivosAdjuntos: []
      },
      {
        autorId: usuarios.test_usuario1._id,
        contenido: '⚠️ CONTENIDO INAPROPIADO DE PRUEBA - Esta publicación debe ser denunciada para testing.',
        tipo: 'foro',
        anonimo: false,
        multimedia: [],
        archivosAdjuntos: []
      }
    ];

    const publicaciones = [];
    for (const pubData of publicacionesForo) {
      const pub = new Publicacion(pubData);
      await pub.save();
      publicaciones.push(pub);
      console.log(`   ✅ Publicación foro creada: "${pubData.contenido.substring(0, 50)}..."`);
    }

    // ========== PASO 4: CREAR COMENTARIOS ==========
    console.log('');
    console.log('💬 Paso 4/6: Creando comentarios en publicaciones...');
    
    const comentarios = [
      {
        publicacionId: publicaciones[0]._id,
        autorId: usuarios.test_usuario2._id,
        contenido: '¡Bienvenida! Esta es una comunidad muy acogedora.',
        anonimo: false
      },
      {
        publicacionId: publicaciones[0]._id,
        autorId: usuarios.test_usuario3._id,
        contenido: 'Me alegra que te unas. Aquí todos nos apoyamos.',
        anonimo: false
      },
      {
        publicacionId: publicaciones[2]._id,
        autorId: usuarios.test_profesional._id,
        contenido: 'La terapia online puede ser muy efectiva. Te recomiendo buscar un profesional certificado.',
        anonimo: false
      }
    ];

    for (const comData of comentarios) {
      const com = new Comentario(comData);
      await com.save();
      console.log(`   ✅ Comentario creado en publicación`);
    }

    // ========== PASO 5: CREAR RECURSOS INFORMATIVOS ==========
    console.log('');
    console.log('📚 Paso 5/6: Creando recursos informativos...');
    
    const recursos = [
      {
        titulo: 'Guía de Detección de Violencia Doméstica',
        contenido: 'Aprende a identificar las señales de violencia doméstica y encuentra ayuda.',
        contenidoHTML: '<h2>Guía de Detección</h2><p>Contenido de prueba...</p>',
        creadoPor: usuarios.test_profesional._id,
        topico: 'Violencia Doméstica',
        fuente: 'Profesional Verificado',
        tipo: 'articulo',
        imagenPortada: '',
        galeria: [],
        archivosAdjuntos: []
      },
      {
        titulo: 'Recursos de Ayuda Inmediata',
        contenido: 'Líneas telefónicas de emergencia y recursos de apoyo disponibles 24/7.',
        contenidoHTML: '<h2>Ayuda Inmediata</h2><p>Contenido de prueba...</p>',
        creadoPor: usuarios.test_admin._id,
        topico: 'Ayuda Inmediata',
        fuente: 'Oficial',
        tipo: 'guia',
        imagenPortada: '',
        galeria: [],
        archivosAdjuntos: []
      },
      {
        titulo: 'Técnicas de Autocuidado y Bienestar Emocional',
        contenido: 'Estrategias prácticas para cuidar tu salud mental.',
        contenidoHTML: '<h2>Autocuidado</h2><p>Contenido de prueba...</p>',
        creadoPor: usuarios.test_profesional._id,
        topico: 'Salud Mental',
        fuente: 'Profesional Verificado',
        tipo: 'articulo',
        imagenPortada: '',
        galeria: [],
        archivosAdjuntos: []
      }
    ];

    for (const recursoData of recursos) {
      let recurso = await RecursoInformativo.findOne({ titulo: recursoData.titulo });
      if (!recurso) {
        recurso = new RecursoInformativo(recursoData);
        await recurso.save();
        console.log(`   ✅ Recurso creado: "${recursoData.titulo}"`);
      } else {
        console.log(`   ⚠️  Recurso ya existe: "${recursoData.titulo}"`);
      }
    }

    // ========== PASO 6: VERIFICAR ENCUESTAS ==========
    console.log('');
    console.log('📊 Paso 6/6: Verificando encuestas...');
    
    const encuestasCount = await Encuesta.countDocuments();
    if (encuestasCount === 0) {
      console.log('   ⚠️  No hay encuestas. Ejecuta: npm run crear-encuestas');
    } else {
      console.log(`   ✅ ${encuestasCount} encuestas disponibles`);
    }

    // ========== RESUMEN FINAL ==========
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ¡DATOS DE PRUEBA CREADOS EXITOSAMENTE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 CREDENCIALES PARA TESTING:');
    console.log('');
    console.log('👤 Usuario 1 (Público):');
    console.log('   📧 test.usuario1@safehaven.com');
    console.log('   🔑 TestUser123');
    console.log('');
    console.log('👤 Usuario 2 (Privado):');
    console.log('   📧 test.usuario2@safehaven.com');
    console.log('   🔑 TestUser123');
    console.log('');
    console.log('👤 Usuario 3 (Activo):');
    console.log('   📧 test.usuario3@safehaven.com');
    console.log('   🔑 TestUser123');
    console.log('');
    console.log('👨‍⚕️ Profesional:');
    console.log('   📧 test.profesional@safehaven.com');
    console.log('   🔑 TestProf123');
    console.log('');
    console.log('👑 Administrador:');
    console.log('   📧 test.admin@safehaven.com');
    console.log('   🔑 TestAdmin123');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📊 DATOS CREADOS:');
    console.log(`   • 5 Usuarios de prueba`);
    console.log(`   • ${publicaciones.length} Publicaciones en el foro`);
    console.log(`   • ${comentarios.length} Comentarios`);
    console.log(`   • ${recursos.length} Recursos informativos`);
    console.log(`   • ${encuestasCount} Encuestas`);
    console.log('');
    console.log('💡 SIGUIENTE PASO:');
    console.log('   Inicia el servidor: npm run dev');
    console.log('   Revisa la guía: GUIA_PRUEBAS_USUARIOS.md');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar script
crearDatosPrueba();


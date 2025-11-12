const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Script para crear un usuario profesional de prueba
 */

const crearUsuarioProfesional = async () => {
  try {
    // Conectar a MongoDB
    const mongoConnection = process.env.MONGO_CONNECTION;
    
    if (!mongoConnection) {
      throw new Error('❌ MONGO_CONNECTION no está definida en las variables de entorno');
    }

    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(mongoConnection);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un usuario profesional con este correo
    const usuarioExistente = await Usuario.findOne({ correo: 'profesional@safehaven.com' });
    
    if (usuarioExistente) {
      console.log('⚠️  Ya existe un usuario profesional con este correo');
      console.log('📧 Correo:', usuarioExistente.correo);
      console.log('👤 Usuario:', usuarioExistente.nombreUsuario);
      console.log('🎭 Rol:', usuarioExistente.rol);
      return;
    }

    // Encriptar contraseña
    const contraseñaEncriptada = await bcrypt.hash('Profesional123', 10);

    // Crear usuario profesional
    const profesional = new Usuario({
      nombreUsuario: 'drprofesional',
      correo: 'profesional@safehaven.com',
      contraseña: contraseñaEncriptada,
      nombreCompleto: 'Juan Profesional García',
      fechaNacimiento: new Date('1985-05-15'),
      rol: 'profesional',
      genero: 'Masculino',
      pronombres: 'Él',
      biografia: 'Psicólogo clínico especializado en salud mental y bienestar emocional',
      visibilidadPerfil: 'publico',
      anonimo: false,
      activo: true,
      estado: 'activo',
      infoProfesional: {
        titulos: ['Psicólogo Clínico', 'Máster en Terapia Cognitivo-Conductual'],
        especialidades: ['Ansiedad', 'Depresión', 'Terapia de pareja'],
        registroProfesional: 'PSI-12345',
        institucionTitulo: 'Universidad de Chile',
        añosExperiencia: 10,
        horarioAtencion: {
          lunes: [{ inicio: '09:00', fin: '13:00' }, { inicio: '15:00', fin: '18:00' }],
          martes: [{ inicio: '09:00', fin: '13:00' }],
          miercoles: [],
          jueves: [{ inicio: '14:00', fin: '20:00' }],
          viernes: [{ inicio: '09:00', fin: '15:00' }]
        },
        modalidadesAtencion: ['presencial', 'online', 'telefonica'],
        tarifas: {
          consultaIndividual: 50000,
          consultaPareja: 70000,
          consultaGrupal: 40000,
          moneda: 'CLP'
        },
        idiomas: ['Español', 'Inglés'],
        ubicacion: {
          direccion: 'Av. Principal 123, Oficina 45',
          ciudad: 'Santiago',
          pais: 'Chile'
        },
        telefonoContacto: '+56912345678',
        sitioWeb: 'https://www.drprofesional.cl',
        disponible: true,
        notasAdicionales: 'Atención preferencial en casos de crisis'
      }
    });

    await profesional.save();

    console.log('');
    console.log('✅ ¡Usuario profesional creado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Correo:', profesional.correo);
    console.log('👤 Usuario:', profesional.nombreUsuario);
    console.log('🔑 Contraseña: Profesional123');
    console.log('🎭 Rol:', profesional.rol);
    console.log('📋 Nombre:', profesional.nombreCompleto);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 Usa estas credenciales para hacer login:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   Body: { "correo": "profesional@safehaven.com", "contraseña": "Profesional123" }');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear usuario profesional:', error.message);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar script
crearUsuarioProfesional();


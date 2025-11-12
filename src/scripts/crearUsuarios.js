const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Script para crear usuarios de prueba (usuario normal, profesional y admin)
 */

const crearUsuarios = async () => {
  try {
    // Conectar a MongoDB
    const mongoConnection = process.env.MONGO_CONNECTION;
    
    if (!mongoConnection) {
      throw new Error('❌ MONGO_CONNECTION no está definida en las variables de entorno');
    }

    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(mongoConnection);
    console.log('✅ Conectado a MongoDB');

    // Usuarios a crear
    const usuarios = [
      {
        nombreUsuario: 'usuario_test',
        correo: 'usuario@safehaven.com',
        contraseña: 'Usuario123',
        nombreCompleto: 'Usuario Normal',
        fechaNacimiento: new Date('1995-03-20'),
        rol: 'usuario',
        genero: 'Masculino',
        biografia: 'Usuario normal de prueba',
        visibilidadPerfil: 'publico'
      },
      {
        nombreUsuario: 'drprofesional',
        correo: 'profesional@safehaven.com',
        contraseña: 'Profesional123',
        nombreCompleto: 'Juan Profesional García',
        fechaNacimiento: new Date('1985-05-15'),
        rol: 'profesional',
        genero: 'Masculino',
        biografia: 'Psicólogo clínico especializado en salud mental',
        visibilidadPerfil: 'publico',
        infoProfesional: {
          titulos: ['Psicólogo Clínico', 'Máster en Terapia Cognitivo-Conductual'],
          especialidades: ['Ansiedad', 'Depresión', 'Terapia de pareja'],
          registroProfesional: 'PSI-12345',
          institucionTitulo: 'Universidad de Chile',
          añosExperiencia: 10,
          disponible: true
        }
      },
      {
        nombreUsuario: 'admin_test',
        correo: 'admin@safehaven.com',
        contraseña: 'Admin123',
        nombreCompleto: 'Administrador Principal',
        fechaNacimiento: new Date('1990-01-10'),
        rol: 'administrador',
        genero: 'Femenino',
        biografia: 'Administradora del sistema SafeHaven',
        visibilidadPerfil: 'publico'
      }
    ];

    console.log('');
    console.log('📝 Creando usuarios de prueba...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const usuarioData of usuarios) {
      // Verificar si ya existe
      const existente = await Usuario.findOne({ correo: usuarioData.correo });
      
      if (existente) {
        console.log(`⚠️  Usuario ya existe: ${usuarioData.correo} (${usuarioData.rol})`);
        continue;
      }

      // Encriptar contraseña
      const contraseñaEncriptada = await bcrypt.hash(usuarioData.contraseña, 10);

      // Crear usuario
      const usuario = new Usuario({
        ...usuarioData,
        contraseña: contraseñaEncriptada,
        anonimo: false,
        activo: true,
        estado: 'activo'
      });

      await usuario.save();
      console.log(`✅ Usuario creado: ${usuarioData.correo} (${usuarioData.rol})`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('');
    
    console.log('👤 Usuario Normal:');
    console.log('   Correo: usuario@safehaven.com');
    console.log('   Contraseña: Usuario123');
    console.log('');
    
    console.log('👨‍⚕️ Profesional:');
    console.log('   Correo: profesional@safehaven.com');
    console.log('   Contraseña: Profesional123');
    console.log('');
    
    console.log('👑 Administrador:');
    console.log('   Correo: admin@safehaven.com');
    console.log('   Contraseña: Admin123');
    console.log('');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 Para hacer login:');
    console.log('   POST http://localhost:3000/api/auth/login');
    console.log('   Body: { "correo": "CORREO", "contraseña": "CONTRASEÑA" }');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear usuarios:', error.message);
    console.error(error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar script
crearUsuarios();


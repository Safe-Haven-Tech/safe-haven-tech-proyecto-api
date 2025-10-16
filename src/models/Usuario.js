const mongoose = require('mongoose');
const { validarFechaNacimiento, validarContraseña } = require('../utils/validaciones');

const { Schema, model } = mongoose;

const UsuarioSchema = new Schema({
  nombreUsuario: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [5, 'El nombre de usuario debe tener al menos 5 caracteres'],
    maxlength: [20, 'El nombre de usuario no puede exceder los 20 caracteres'],
    match: [
      /^[a-zA-Z0-9_]+$/,
      'El nickname solo puede contener letras, números y guion bajo'
    ]
  },
  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'El formato del correo electrónico no es válido'
    ],
    maxlength: [254, 'El correo electrónico no puede exceder los 254 caracteres']
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    validate: {
      validator: validarContraseña,
      message: 'La contraseña debe tener entre 8 y 128 caracteres, incluyendo al menos una mayúscula, una minúscula y un número'
    }
  },
  nombreCompleto: {
    type: String,
    required: [true, 'El nombre completo es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre completo debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre completo no puede exceder los 100 caracteres'],
    match: [
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
      'El nombre completo solo puede contener letras y espacios'
    ]
  },
  fechaNacimiento: {
    type: Date,
    required: [true, 'La fecha de nacimiento es obligatoria'],
    validate: {
      validator: validarFechaNacimiento,
      message: 'La fecha de nacimiento debe ser válida y la edad debe estar entre 13 y 120 años'
    }
  },
  rol: {
    type: String,
    enum: {
      values: ['administrador', 'profesional', 'usuario'],
      message: 'El rol debe ser: administrador, profesional o usuario'
    },
    default: 'usuario'
  },
  anonimo: {
    type: Boolean,
    default: false
  },
  visibilidadPerfil: {
    type: String,
    enum: {
      values: ['publico', 'privado'],
      message: 'La visibilidad del perfil debe ser: público o privado'
    },
    default: 'publico'
  },
  biografia: {
    type: String,
    maxlength: [500, 'La biografía no puede exceder los 500 caracteres'],
    trim: true,
    required: false
  },
  genero: {
    type: String,
    maxlength: [10, 'El género no puede exceder los 10 caracteres'],
    trim: true,
    required: [true, 'El género es obligatorio']
  },
  pronombres: {
    type: String,
    trim: true,
    maxlength: [15, 'Los pronombres no pueden exceder los 15 caracteres'],
    required: false
  },
  fotoPerfil: {
    type: String,
    trim: true,
    maxlength: [1024, 'La URL de la foto de perfil no puede exceder los 1024 caracteres'],
    required: false,
    default: ''
  },
  // Información profesional (solo para usuarios con rol 'profesional')
  // Este campo es completamente dinámico y puede contener cualquier estructura JSON
  // Ejemplos de estructura sugerida:
  // {
  //   titulos: ['Psicólogo Clínico', 'Máster en Terapia Cognitivo-Conductual'],
  //   especialidades: ['Ansiedad', 'Depresión', 'Terapia de pareja'],
  //   registroProfesional: 'REG-12345',
  //   institucionTitulo: 'Universidad de Chile',
  //   añosExperiencia: 5,
  //   horarioAtencion: {
  //     lunes: [{ inicio: '09:00', fin: '13:00' }, { inicio: '15:00', fin: '18:00' }],
  //     martes: [{ inicio: '09:00', fin: '13:00' }],
  //     miercoles: [],
  //     jueves: [{ inicio: '14:00', fin: '20:00' }],
  //     viernes: [{ inicio: '09:00', fin: '15:00' }]
  //   },
  //   modalidadesAtencion: ['presencial', 'online', 'telefonica'],
  //   tarifas: {
  //     consultaIndividual: 50000,
  //     consultaPareja: 70000,
  //     consultaGrupal: 40000,
  //     moneda: 'CLP'
  //   },
  //   idiomas: ['Español', 'Inglés'],
  //   ubicacion: {
  //     direccion: 'Av. Principal 123, Oficina 45',
  //     ciudad: 'Santiago',
  //     pais: 'Chile'
  //   },
  //   telefonoContacto: '+56912345678',
  //   sitioWeb: 'https://www.ejemplo.com',
  //   redesProfesionales: {
  //     linkedin: 'https://linkedin.com/in/...'
  //   },
  //   disponible: true,
  //   notasAdicionales: 'Atención preferencial en casos de crisis'
  // }
  infoProfesional: {
    type: Schema.Types.Mixed,
    required: false,
    default: null
  },
  seguidores: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  seguidos: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  bloqueados: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  solicitudesSeguidores: [{
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    fechaSolicitud: {
      type: Date,
      default: Date.now
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aceptada', 'rechazada'],
      default: 'pendiente'
    }
  }],
  activo: {
    type: Boolean,
    default: true
  },
  estado: {
    type: String,
    enum: {
      values: ['activo', 'inactivo', 'suspendido', 'eliminado'],
      message: 'El estado debe ser: activo, inactivo, suspendido o eliminado'
    },
    default: 'activo'
  },
  fechaEstado: {
    type: Date,
    default: Date.now
  },
  motivoEstado: {
    type: String,
    maxlength: [500, 'El motivo del estado no puede exceder los 500 caracteres']
  },
  ultimoLogin: {
    type: Date,
    default: null
  },
  contadorLogins: {
    type: Number,
    default: 0
  },
  contraseñaCambiadaEn: {
    type: Date,
    default: null
  }
}, {
  timestamps: true 
});

// Solo índices adicionales (correo ya tiene unique: true)
UsuarioSchema.index({ rol: 1 });
UsuarioSchema.index({ activo: 1 });
UsuarioSchema.index({ fechaNacimiento: 1 });
UsuarioSchema.index({ 'infoProfesional.especialidades': 1 }); // Para búsquedas de profesionales por especialidad
UsuarioSchema.index({ 'infoProfesional.disponible': 1 }); // Para búsquedas de profesionales disponibles

UsuarioSchema.pre('save', function(next) {
  if (this.seguidos && this.seguidos.includes(this._id)) {
    const error = new Error('Un usuario no puede seguirse a sí mismo');
    return next(error);
  }
  
  if (this.bloqueados && this.bloqueados.includes(this._id)) {
    const error = new Error('Un usuario no puede bloquearse a sí mismo');
    return next(error);
  }
  
  // Validar que solo profesionales tengan información profesional
  if (this.infoProfesional && this.rol !== 'profesional') {
    const error = new Error('Solo los usuarios con rol profesional pueden tener información profesional');
    return next(error);
  }
  
  // Si cambia de rol profesional a otro rol, limpiar la información profesional
  if (this.isModified('rol') && this.rol !== 'profesional' && this.infoProfesional) {
    this.infoProfesional = null;
  }
  
  // Validar límites de arrays
  if (this.seguidos && this.seguidos.length > 5000) {
    const error = new Error('No se pueden seguir más de 5,000 usuarios');
    return next(error);
  }
  
  if (this.seguidores && this.seguidores.length > 10000) {
    const error = new Error('No se pueden tener más de 10,000 seguidores');
    return next(error);
  }
  
  if (this.bloqueados && this.bloqueados.length > 1000) {
    const error = new Error('No se pueden bloquear más de 1,000 usuarios');
    return next(error);
  }
  
  if (this.solicitudesSeguidores && this.solicitudesSeguidores.length > 500) {
    const error = new Error('No se pueden tener más de 500 solicitudes pendientes');
    return next(error);
  }
  
  next();
});

module.exports = model('Usuario', UsuarioSchema);
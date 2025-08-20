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
  seguidores: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    validate: {
      validator: function(valores) {
        return valores.length <= 10000; 
      },
      message: 'No se pueden tener más de 10,000 seguidores'
    }
  }],
  seguidos: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    validate: {
      validator: function(valores) {
        return valores.length <= 5000; 
      },
      message: 'No se pueden seguir más de 5,000 usuarios'
    }
  }],
  bloqueados: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    validate: {
      validator: function(valores) {
        return valores.length <= 1000; 
      },
      message: 'No se pueden bloquear más de 1,000 usuarios'
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
  }
}, {
  timestamps: true 
});

// Solo índices adicionales (correo ya tiene unique: true)
UsuarioSchema.index({ rol: 1 });
UsuarioSchema.index({ activo: 1 });
UsuarioSchema.index({ fechaNacimiento: 1 });

UsuarioSchema.pre('save', function(next) {
  if (this.seguidos && this.seguidos.includes(this._id)) {
    const error = new Error('Un usuario no puede seguirse a sí mismo');
    return next(error);
  }
  
  if (this.bloqueados && this.bloqueados.includes(this._id)) {
    const error = new Error('Un usuario no puede bloquearse a sí mismo');
    return next(error);
  }
  
  next();
});

module.exports = model('Usuario', UsuarioSchema);
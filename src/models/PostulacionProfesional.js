
const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const InfoProfesionalSchema = new Schema({
  titulos: [{ type: String }],
  especialidades: [{ type: String }],
  registroProfesional: { type: String, trim: true },
  institucionTitulo: { type: String, trim: true },
  aniosExperiencia: { type: Number },
  disponible: { type: Boolean, default: true }
}, { _id: false });

const PostulacionProfesionalSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID del usuario es obligatorio']
  },
  nombreCompleto: { type: String, trim: true },
  correo: { type: String, trim: true },
  telefono: { type: String, trim: true },
  ubicacion: { type: Schema.Types.Mixed }, // puede ser objeto con ciudad/region/coords
  biografia: { type: String, trim: true, maxlength: [2000, 'La biografía no puede exceder los 2000 caracteres'] },

  infoProfesional: { type: InfoProfesionalSchema, default: {} },

  motivacion: {
    type: String,
    required: [true, 'La motivación es obligatoria'],
    trim: true,
    minlength: [50, 'La motivación debe tener al menos 50 caracteres'],
    maxlength: [1000, 'La motivación no puede exceder los 1000 caracteres']
  },
  experiencia: {
    type: String,
    trim: true,
    maxlength: [1000, 'La experiencia no puede exceder los 1000 caracteres']
  },
  especialidad: {
    type: String,
    trim: true,
    maxlength: [200, 'La especialidad no puede exceder los 200 caracteres']
  },

  etiquetas: [{ type: String, trim: true }],

  // Archivos adjuntos (URLs de Cloudinary)
  archivos: [{
    tipo: {
      type: String,
      enum: ['titulo', 'certificado', 'identificacion', 'otro'],
      required: true
    },
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    publicId: {
      type: String,
      required: true,
      trim: true
    },
    fechaSubida: {
      type: Date,
      default: Date.now
    }
  }],

  // Información de revisión
  revisadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaRevision: {
    type: Date
  },
  observaciones: {
    type: String,
    trim: true,
    maxlength: [500, 'Las observaciones no pueden exceder los 500 caracteres']
  },
  motivoRechazo: {
    type: String,
    trim: true,
    maxlength: [500, 'El motivo del rechazo no puede exceder los 500 caracteres']
  },

  estado: {
    type: String,
    enum: {
      values: ['pendiente', 'aprobada', 'rechazada'],
      message: 'El estado debe ser: pendiente, aprobada o rechazada'
    },
    default: 'pendiente'
  }
}, {
  timestamps: true
});

// Índices
PostulacionProfesionalSchema.index({ usuarioId: 1 });
PostulacionProfesionalSchema.index({ estado: 1 });
PostulacionProfesionalSchema.index({ createdAt: -1 });


PostulacionProfesionalSchema.pre('save', async function(next) {
  if (this.isNew) {
    const postulacionPendiente = await this.constructor.findOne({
      usuarioId: this.usuarioId,
      estado: 'pendiente'
    });

    if (postulacionPendiente) {
      const error = new Error('Ya tienes una postulación pendiente');
      return next(error);
    }
  }
  next();
});

module.exports = model('PostulacionProfesional', PostulacionProfesionalSchema);

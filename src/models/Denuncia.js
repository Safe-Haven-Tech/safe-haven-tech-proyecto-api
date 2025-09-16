const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const DenunciaSchema = new Schema({
  publicacionId: {
    type: Schema.Types.ObjectId,
    ref: 'Publicacion',
    required: [true, 'El ID de la publicación es obligatorio']
  },
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID del usuario que denuncia es obligatorio']
  },
  motivo: {
    type: String,
    required: [true, 'El motivo de la denuncia es obligatorio'],
    enum: {
      values: [
        'contenido_inapropiado',
        'spam',
        'acoso',
        'discurso_odio',
        'informacion_falsa',
        'contenido_sexual',
        'violencia',
        'otro'
      ],
      message: 'Motivo de denuncia no válido'
    }
  },
  descripcion: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder los 500 caracteres'],
    trim: true
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Campos de estado de la denuncia
  estado: {
    type: String,
    enum: {
      values: ['pendiente', 'en_revision', 'resuelta', 'rechazada'],
      message: 'El estado debe ser: pendiente, en_revision, resuelta o rechazada'
    },
    default: 'pendiente'
  },
  resueltaPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  resueltaEn: {
    type: Date
  },
  observaciones: {
    type: String,
    maxlength: [1000, 'Las observaciones no pueden exceder los 1000 caracteres'],
    trim: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
DenunciaSchema.index({ publicacionId: 1 });
DenunciaSchema.index({ usuarioId: 1 });
DenunciaSchema.index({ estado: 1, fecha: -1 });
DenunciaSchema.index({ motivo: 1 });

// Middleware para evitar denuncias duplicadas del mismo usuario
DenunciaSchema.pre('save', async function(next) {
  if (this.isNew) {
    const denunciaExistente = await this.constructor.findOne({
      publicacionId: this.publicacionId,
      usuarioId: this.usuarioId
    });
    
    if (denunciaExistente) {
      const error = new Error('Ya has denunciado esta publicación anteriormente');
      return next(error);
    }
  }
  
  next();
});

module.exports = model('Denuncia', DenunciaSchema, 'denuncias');

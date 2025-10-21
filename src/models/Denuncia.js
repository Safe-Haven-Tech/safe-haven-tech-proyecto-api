const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const DenunciaSchema = new Schema({
  // Tipo de denuncia (publicacion, comentario, usuario)
  tipoDenuncia: {
    type: String,
    required: [true, 'El tipo de denuncia es obligatorio'],
    enum: {
      values: ['publicacion', 'comentario', 'usuario'],
      message: 'El tipo de denuncia debe ser: publicacion, comentario o usuario'
    }
  },
  // IDs de los elementos denunciados (solo uno debe estar presente según tipoDenuncia)
  publicacionId: {
    type: Schema.Types.ObjectId,
    ref: 'Publicacion'
  },
  comentarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Comentario'
  },
  usuarioDenunciadoId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  // Usuario que realiza la denuncia
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
DenunciaSchema.index({ tipoDenuncia: 1 });
DenunciaSchema.index({ publicacionId: 1 });
DenunciaSchema.index({ comentarioId: 1 });
DenunciaSchema.index({ usuarioDenunciadoId: 1 });
DenunciaSchema.index({ usuarioId: 1 });
DenunciaSchema.index({ estado: 1, fecha: -1 });
DenunciaSchema.index({ motivo: 1 });

// Validación para asegurar que el ID correcto esté presente según el tipo
DenunciaSchema.pre('save', async function(next) {
  // Validar que el campo ID correcto esté presente según el tipo de denuncia
  if (this.tipoDenuncia === 'publicacion' && !this.publicacionId) {
    return next(new Error('El ID de la publicación es obligatorio para denuncias de tipo publicación'));
  }
  if (this.tipoDenuncia === 'comentario' && !this.comentarioId) {
    return next(new Error('El ID del comentario es obligatorio para denuncias de tipo comentario'));
  }
  if (this.tipoDenuncia === 'usuario' && !this.usuarioDenunciadoId) {
    return next(new Error('El ID del usuario denunciado es obligatorio para denuncias de tipo usuario'));
  }
  
  // Middleware para evitar denuncias duplicadas del mismo usuario
  if (this.isNew) {
    let query = { usuarioId: this.usuarioId };
    
    if (this.tipoDenuncia === 'publicacion') {
      query.publicacionId = this.publicacionId;
    } else if (this.tipoDenuncia === 'comentario') {
      query.comentarioId = this.comentarioId;
    } else if (this.tipoDenuncia === 'usuario') {
      query.usuarioDenunciadoId = this.usuarioDenunciadoId;
    }
    
    const denunciaExistente = await this.constructor.findOne(query);
    
    if (denunciaExistente) {
      let mensaje = 'Ya has denunciado ';
      if (this.tipoDenuncia === 'publicacion') mensaje += 'esta publicación';
      else if (this.tipoDenuncia === 'comentario') mensaje += 'este comentario';
      else if (this.tipoDenuncia === 'usuario') mensaje += 'a este usuario';
      mensaje += ' anteriormente';
      
      return next(new Error(mensaje));
    }
  }
  
  next();
});

module.exports = model('Denuncia', DenunciaSchema, 'denuncias');

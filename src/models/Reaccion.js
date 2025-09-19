const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const ReaccionSchema = new Schema({
  publicacionId: {
    type: Schema.Types.ObjectId,
    ref: 'Publicacion',
    required: [true, 'El ID de la publicación es obligatorio']
  },
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID del usuario es obligatorio']
  },
  tipo: {
    type: String,
    enum: {
      values: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      message: 'El tipo de reacción debe ser: like, love, haha, wow, sad o angry'
    },
    required: [true, 'El tipo de reacción es obligatorio']
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
ReaccionSchema.index({ publicacionId: 1, usuarioId: 1 }, { unique: true });
ReaccionSchema.index({ publicacionId: 1, tipo: 1 });
ReaccionSchema.index({ usuarioId: 1 });

// Middleware para evitar reacciones duplicadas del mismo usuario
ReaccionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const reaccionExistente = await this.constructor.findOne({
      publicacionId: this.publicacionId,
      usuarioId: this.usuarioId
    });
    
    if (reaccionExistente) {
      // Si ya existe una reacción, actualizar el tipo
      reaccionExistente.tipo = this.tipo;
      await reaccionExistente.save();
      return next(new Error('Reacción actualizada'));
    }
  }
  
  next();
});

// Método estático para obtener estadísticas de reacciones de una publicación
ReaccionSchema.statics.obtenerEstadisticas = function(publicacionId) {
  return this.aggregate([
    { $match: { publicacionId: mongoose.Types.ObjectId(publicacionId) } },
    { $group: { _id: '$tipo', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Método estático para verificar si un usuario reaccionó a una publicación
ReaccionSchema.statics.verificarReaccion = function(publicacionId, usuarioId) {
  return this.findOne({ publicacionId, usuarioId });
};

module.exports = model('Reaccion', ReaccionSchema, 'reacciones');

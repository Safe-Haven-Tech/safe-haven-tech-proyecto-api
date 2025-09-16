const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const ComentarioSchema = new Schema({
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
  contenido: {
    type: String,
    required: [true, 'El contenido del comentario es obligatorio'],
    trim: true,
    minlength: [1, 'El contenido debe tener al menos 1 carácter'],
    maxlength: [1000, 'El contenido no puede exceder los 1000 caracteres']
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  // Campos de moderación
  moderado: {
    type: Boolean,
    default: false
  },
  motivoModeracion: {
    type: String,
    maxlength: [500, 'El motivo de moderación no puede exceder los 500 caracteres']
  },
  moderadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  moderadoEn: {
    type: Date
  },
  // Campos de visibilidad
  visible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
ComentarioSchema.index({ publicacionId: 1, fecha: -1 });
ComentarioSchema.index({ usuarioId: 1 });
ComentarioSchema.index({ visible: 1, moderado: 1 });

// Método para verificar si el usuario puede ver el comentario
ComentarioSchema.methods.puedeVer = function(usuarioId, esAdmin = false) {
  // Los administradores pueden ver todo
  if (esAdmin) return true;
  
  // Si el comentario no es visible, solo el autor puede verlo
  if (!this.visible) {
    return this.usuarioId.toString() === usuarioId.toString();
  }
  
  // Si está moderado, solo administradores y el autor pueden verlo
  if (this.moderado) {
    return this.usuarioId.toString() === usuarioId.toString() || esAdmin;
  }
  
  return true;
};

module.exports = model('Comentario', ComentarioSchema, 'comentarios');

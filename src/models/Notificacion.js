const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const NotificacionSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID del usuario es obligatorio']
  },
  origenId: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID del origen es obligatorio']
  },
  tipo: {
    type: String,
    enum: {
      values: ['respuesta', 'reaccion', 'nuevo_seguidor', 'mensaje_privado', 'otro'],
      message: 'El tipo debe ser: respuesta, reaccion, nuevo_seguidor, mensaje_privado u otro'
    },
    required: [true, 'El tipo de notificación es obligatorio']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [200, 'La descripción no puede exceder los 200 caracteres']
  },
  ruta: {
    type: String,
    required: [true, 'La ruta es obligatoria'],
    trim: true,
    maxlength: [500, 'La ruta no puede exceder los 500 caracteres']
  },
  leida: {
    type: Boolean,
    default: false
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
NotificacionSchema.index({ usuarioId: 1, fecha: -1 });
NotificacionSchema.index({ leida: 1 });
NotificacionSchema.index({ tipo: 1 });

// Método para marcar como leída
NotificacionSchema.methods.marcarComoLeida = function() {
  this.leida = true;
  return this.save();
};

// Método estático para crear notificación
NotificacionSchema.statics.crearNotificacion = function(usuarioId, origenId, tipo, descripcion, ruta) {
  return this.create({
    usuarioId,
    origenId,
    tipo,
    descripcion,
    ruta
  });
};

module.exports = model('Notificacion', NotificacionSchema, 'notificaciones');

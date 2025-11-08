const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const ArchivoAdjuntoSchema = new Schema({
  nombre: { type: String },
  filename: { type: String },
  url: { type: String },
  mimetype: { type: String },
  tamano: { type: Number },        // usar 'tamano' (sin tilde)
  almacenadoEn: { type: String }
}, { _id: false });

const MensajeChatSchema = new Schema({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: [true, 'El ID del chat es obligatorio']
  },
  emisorId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID del emisor es obligatorio']
  },
  contenido: {
    type: String,
    required: [true, 'El contenido del mensaje es obligatorio'],
    trim: true,
    minlength: [1, 'El contenido debe tener al menos 1 carácter'],
    maxlength: [2000, 'El contenido no puede exceder los 2000 caracteres']
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  leido: {
    type: Boolean,
    default: false
  },
  leidoEn: {
    type: Date
  },
  esTemporal: {
    type: Boolean,
    default: false
  },
  expiraEn: {
    type: Date
  },
  // ahora almacenamos objetos con metadatos
  archivosAdjuntos: {
    type: [ArchivoAdjuntoSchema],
    default: []
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
MensajeChatSchema.index({ chatId: 1, fecha: -1 });
MensajeChatSchema.index({ emisorId: 1 });
MensajeChatSchema.index({ leido: 1 });
MensajeChatSchema.index({ expiraEn: 1 });

MensajeChatSchema.pre('save', function(next) {
  if (this.esTemporal) {
    if (!this.expiraEn) {
      const error = new Error('Los mensajes temporales deben tener una fecha de expiración');
      return next(error);
    }
    const unDia = 24 * 60 * 60 * 1000;
    if (this.expiraEn.getTime() - this.fecha.getTime() > unDia) {
      const error = new Error('Los mensajes temporales no pueden durar más de 1 día');
      return next(error);
    }
  }
  next();
});

MensajeChatSchema.methods.marcarComoLeido = function() {
  this.leido = true;
  this.leidoEn = new Date();
  return this.save();
};

MensajeChatSchema.methods.haExpirado = function() {
  if (!this.esTemporal || !this.expiraEn) return false;
  return new Date() > this.expiraEn;
};

MensajeChatSchema.methods.puedeVer = function(usuarioId) {
  return this.chatId.participaUsuario(usuarioId);
};

module.exports = model('MensajeChat', MensajeChatSchema, 'mensajes_chat');
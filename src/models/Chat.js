const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const ChatSchema = new Schema({
  participantes: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }],
  creadoEn: {
    type: Date,
    default: Date.now,
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  ultimoMensaje: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
ChatSchema.index({ participantes: 1 });
ChatSchema.index({ ultimoMensaje: -1 });
ChatSchema.index({ activo: 1 });

// Middleware para validar que hay al menos 2 participantes
ChatSchema.pre('save', function(next) {
  if (this.participantes.length < 2) {
    const error = new Error('Un chat debe tener al menos 2 participantes');
    return next(error);
  }
  
  // Validar que no hay participantes duplicados
  const participantesUnicos = [...new Set(this.participantes.map(p => p.toString()))];
  if (participantesUnicos.length !== this.participantes.length) {
    const error = new Error('No puede haber participantes duplicados en un chat');
    return next(error);
  }
  
  next();
});

// Método para verificar si un usuario participa en el chat
ChatSchema.methods.participaUsuario = function(usuarioId) {
  return this.participantes.some(p => p.toString() === usuarioId.toString());
};

// Método para obtener el otro participante (para chats de 2 personas)
ChatSchema.methods.obtenerOtroParticipante = function(usuarioId) {
  if (this.participantes.length !== 2) {
    return null;
  }
  
  const otroParticipante = this.participantes.find(p => p.toString() !== usuarioId.toString());
  return otroParticipante;
};

module.exports = model('Chat', ChatSchema, 'chats');

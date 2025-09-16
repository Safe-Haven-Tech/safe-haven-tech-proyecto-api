const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const PublicacionSchema = new Schema({
  autorId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID del autor es obligatorio']
  },
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  contenido: {
    type: String,
    required: [true, 'El contenido de la publicación es obligatorio'],
    trim: true,
    minlength: [1, 'El contenido debe tener al menos 1 carácter'],
    maxlength: [5000, 'El contenido no puede exceder los 5000 caracteres']
  },
  tipo: {
    type: String,
    enum: {
      values: ['foro', 'perfil'],
      message: 'El tipo debe ser: foro o perfil'
    },
    required: [true, 'El tipo de publicación es obligatorio']
  },
  anonimo: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0,
    min: [0, 'Los likes no pueden ser negativos']
  },
  // Campos específicos para publicaciones de perfil
  multimedia: [{
    type: String,
    trim: true,
    maxlength: [1024, 'La URL del archivo multimedia no puede exceder los 1024 caracteres']
  }],
  etiquetasUsuarios: [{
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    validate: {
      validator: function(valores) {
        return valores.length <= 10; 
      },
      message: 'No se pueden etiquetar más de 10 usuarios'
    }
  }],
  // Campos específicos para publicaciones de foro
  archivosAdjuntos: [{
    type: String,
    trim: true,
    maxlength: [1024, 'La URL del archivo adjunto no puede exceder los 1024 caracteres']
  }],
  // Campos de moderación
  moderada: {
    type: Boolean,
    default: false
  },
  motivoModeracion: {
    type: String,
    maxlength: [500, 'El motivo de moderación no puede exceder los 500 caracteres']
  },
  moderadaPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  moderadaEn: {
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
PublicacionSchema.index({ autorId: 1, fecha: -1 });
PublicacionSchema.index({ tipo: 1, fecha: -1 });
PublicacionSchema.index({ visible: 1, moderada: 1 });
PublicacionSchema.index({ anonimo: 1 });
PublicacionSchema.index({ likes: -1 });

// Middleware para validaciones específicas por tipo
PublicacionSchema.pre('save', function(next) {
  // Validar que las publicaciones de perfil no tengan archivos adjuntos
  if (this.tipo === 'perfil' && this.archivosAdjuntos && this.archivosAdjuntos.length > 0) {
    const error = new Error('Las publicaciones de perfil no pueden tener archivos adjuntos');
    return next(error);
  }

  // Validar que las publicaciones de foro no tengan multimedia ni etiquetas
  if (this.tipo === 'foro') {
    if (this.multimedia && this.multimedia.length > 0) {
      const error = new Error('Las publicaciones de foro no pueden tener contenido multimedia');
      return next(error);
    }
    if (this.etiquetasUsuarios && this.etiquetasUsuarios.length > 0) {
      const error = new Error('Las publicaciones de foro no pueden etiquetar usuarios');
      return next(error);
    }
  }

  // Validar que no se etiquete al mismo usuario
  if (this.etiquetasUsuarios && this.etiquetasUsuarios.includes(this.autorId)) {
    const error = new Error('Un usuario no puede etiquetarse a sí mismo');
    return next(error);
  }

  next();
});

// Método para obtener información del autor (respetando anonimato)
PublicacionSchema.methods.obtenerInfoAutor = function() {
  if (this.anonimo) {
    return {
      _id: null,
      nombreCompleto: 'Usuario Anónimo',
      fotoPerfil: null,
      anonimo: true
    };
  }
  
  return {
    _id: this.autorId,
    anonimo: false
  };
};

// Método para verificar si el usuario puede ver la publicación
PublicacionSchema.methods.puedeVer = function(usuarioId, esAdmin = false) {
  // Los administradores pueden ver todo
  if (esAdmin) return true;
  
  // Si la publicación no es visible, solo el autor puede verla
  if (!this.visible) {
    return this.autorId.toString() === usuarioId.toString();
  }
  
  // Si está moderada, solo administradores y el autor pueden verla
  if (this.moderada) {
    return this.autorId.toString() === usuarioId.toString() || esAdmin;
  }
  
  return true;
};

module.exports = model('Publicacion', PublicacionSchema, 'publicaciones');

const mongoose = require('mongoose');

const recursoInformativoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede exceder los 200 caracteres']
  },
  
  contenido: {
    type: String,
    required: [true, 'El contenido es obligatorio'],
    maxlength: [50000, 'El contenido no puede exceder los 50,000 caracteres']
  },
  
  contenidoHTML: {
    type: String,
    required: [true, 'El contenido HTML es obligatorio'],
    maxlength: [100000, 'El contenido HTML no puede exceder los 100,000 caracteres']
  },
  
  resumen: {
    type: String,
    maxlength: [500, 'El resumen no puede exceder los 500 caracteres']
  },
  
  // Tópicos como array simple (no modelo separado)
  topicos: [{
    type: String,
    required: [true, 'Al menos un tópico es obligatorio'],
    trim: true
  }],
  
  fuente: {
    type: String,
    required: [true, 'La fuente es obligatoria'],
    trim: true,
    maxlength: [200, 'La fuente no puede exceder los 200 caracteres']
  },
  
  descripcion: {
    type: String,
    maxlength: [1000, 'La descripción no puede exceder los 1,000 caracteres']
  },
  
  tipo: {
    type: String,
    required: [true, 'El tipo es obligatorio'],
    enum: {
      values: ['articulo', 'guia', 'manual', 'video', 'infografia'],
      message: 'El tipo debe ser: articulo, guia, manual, video o infografia'
    }
  },
  
  etiquetas: [{
    type: String,
    trim: true,
    maxlength: [50, 'Cada etiqueta no puede exceder los 50 caracteres']
  }],
  
  destacado: {
    type: Boolean,
    default: false
  },
  
  // Archivos multimedia
  imagenPrincipal: {
    type: String, // URL de la imagen
    default: ''
  },
  
  galeria: [{
    type: String // URLs de imágenes
  }],
  
  archivosAdjuntos: [{
    type: String // URLs de documentos
  }],
  
  // Sistema de calificaciones
  calificacion: {
    promedio: {
      type: Number,
      default: 0,
      min: [0, 'La calificación promedio no puede ser menor a 0'],
      max: [5, 'La calificación promedio no puede ser mayor a 5']
    },
    totalVotos: {
      type: Number,
      default: 0,
      min: [0, 'El total de votos no puede ser menor a 0']
    },
    votos: [{
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
      },
      calificacion: {
        type: Number,
        required: [true, 'La calificación es obligatoria'],
        min: [1, 'La calificación debe ser al menos 1'],
        max: [5, 'La calificación no puede exceder 5']
      },
      fecha: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Estadísticas
  visitas: {
    type: Number,
    default: 0,
    min: [0, 'Las visitas no pueden ser menores a 0']
  },
  
  descargas: {
    type: Number,
    default: 0,
    min: [0, 'Las descargas no pueden ser menores a 0']
  },
  
  compartidos: {
    type: Number,
    default: 0,
    min: [0, 'Los compartidos no pueden ser menores a 0']
  },
  
  // Campos de auditoría
  añadidoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario que añade el recurso es obligatorio']
  },
  
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar el rendimiento de las consultas
recursoInformativoSchema.index({ titulo: 'text', contenido: 'text', resumen: 'text' });
recursoInformativoSchema.index({ topicos: 1 });
recursoInformativoSchema.index({ tipo: 1 });
recursoInformativoSchema.index({ destacado: 1 });
recursoInformativoSchema.index({ fechaCreacion: -1 });
recursoInformativoSchema.index({ 'calificacion.promedio': -1 });
recursoInformativoSchema.index({ visitas: -1 });

// Middleware pre-save para actualizar fechaActualizacion
recursoInformativoSchema.pre('save', function(next) {
  this.fechaActualizacion = new Date();
  next();
});

// Métodos estáticos
recursoInformativoSchema.statics.buscarPorTopico = function(topico) {
  return this.find({ topicos: { $regex: topico, $options: 'i' } });
};

recursoInformativoSchema.statics.obtenerDestacados = function() {
  return this.find({ destacado: true }).sort({ fechaCreacion: -1 });
};

recursoInformativoSchema.statics.buscarPorTipo = function(tipo) {
  return this.find({ tipo: tipo });
};

// Métodos de instancia
recursoInformativoSchema.methods.incrementarVisitas = function() {
  this.visitas += 1;
  return this.save();
};

recursoInformativoSchema.methods.incrementarDescargas = function() {
  this.descargas += 1;
  return this.save();
};

recursoInformativoSchema.methods.incrementarCompartidos = function() {
  this.compartidos += 1;
  return this.save();
};

recursoInformativoSchema.methods.agregarCalificacion = function(usuarioId, calificacion) {
  // Verificar si el usuario ya calificó
  const votoExistente = this.calificacion.votos.find(voto => 
    voto.usuario.toString() === usuarioId.toString()
  );
  
  if (votoExistente) {
    // Actualizar calificación existente
    votoExistente.calificacion = calificacion;
    votoExistente.fecha = new Date();
  } else {
    // Agregar nueva calificación
    this.calificacion.votos.push({
      usuario: usuarioId,
      calificacion: calificacion,
      fecha: new Date()
    });
  }
  
  // Recalcular promedio
  const totalVotos = this.calificacion.votos.length;
  const sumaVotos = this.calificacion.votos.reduce((sum, voto) => sum + voto.calificacion, 0);
  
  this.calificacion.totalVotos = totalVotos;
  this.calificacion.promedio = totalVotos > 0 ? Math.round((sumaVotos / totalVotos) * 10) / 10 : 0;
  
  return this.save();
};

// Virtual para calcular la calificación promedio redondeada
recursoInformativoSchema.virtual('calificacionPromedio').get(function() {
  return Math.round(this.calificacion.promedio * 10) / 10;
});

// Virtual para verificar si tiene calificaciones
recursoInformativoSchema.virtual('tieneCalificaciones').get(function() {
  return this.calificacion.totalVotos > 0;
});

// Virtual para obtener el número de archivos adjuntos
recursoInformativoSchema.virtual('numeroArchivosAdjuntos').get(function() {
  return this.archivosAdjuntos.length;
});

// Virtual para obtener el número de imágenes en galería
recursoInformativoSchema.virtual('numeroImagenesGaleria').get(function() {
  return this.galeria.length;
});

module.exports = mongoose.model('RecursoInformativo', recursoInformativoSchema);

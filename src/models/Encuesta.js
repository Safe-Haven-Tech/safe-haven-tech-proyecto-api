const mongoose = require('mongoose');

const { Schema, model } = mongoose;

// Schema para las preguntas de la encuesta
const PreguntaSchema = new Schema({
  enunciado: {
    type: String,
    required: [true, 'El enunciado de la pregunta es obligatorio'],
    trim: true,
    minlength: [10, 'El enunciado debe tener al menos 10 caracteres'],
    maxlength: [500, 'El enunciado no puede exceder los 500 caracteres']
  },
  opciones: {
    type: [String],
    required: [true, 'Las opciones de respuesta son obligatorias'],
    validate: {
      validator: function(opciones) {
        return opciones && opciones.length >= 2 && opciones.length <= 10;
      },
      message: 'La pregunta debe tener entre 2 y 10 opciones de respuesta'
    }
  },
  tipo: {
    type: String,
    enum: {
      values: ['opcion_unica', 'opcion_multiple', 'escala', 'texto_libre'],
      message: 'El tipo de pregunta debe ser: opcion_unica, opcion_multiple, escala o texto_libre'
    },
    default: 'opcion_unica'
  },
  orden: {
    type: Number,
    required: [true, 'El orden de la pregunta es obligatorio'],
    min: [1, 'El orden debe ser mayor a 0']
  },
  obligatoria: {
    type: Boolean,
    default: true
  }
});

// Schema principal de la encuesta
const EncuestaSchema = new Schema({
  titulo: {
    type: String,
    required: [true, 'El título de la encuesta es obligatorio'],
    trim: true,
    minlength: [5, 'El título debe tener al menos 5 caracteres'],
    maxlength: [200, 'El título no puede exceder los 200 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder los 1000 caracteres']
  },
  preguntas: {
    type: [PreguntaSchema],
    required: [true, 'La encuesta debe tener al menos una pregunta'],
    validate: {
      validator: function(preguntas) {
        return preguntas && preguntas.length > 0 && preguntas.length <= 50;
      },
      message: 'La encuesta debe tener entre 1 y 50 preguntas'
    }
  },
  activa: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaModificacion: {
    type: Date,
    default: Date.now
  },
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El creador de la encuesta es obligatorio']
  },
  categoria: {
    type: String,
    enum: {
      values: ['salud_mental', 'bienestar', 'estres', 'ansiedad', 'depresion', 'otro'],
      message: 'La categoría debe ser válida'
    },
    default: 'otro'
  },
  tiempoEstimado: {
    type: Number, // en minutos
    min: [1, 'El tiempo estimado debe ser al menos 1 minuto'],
    max: [120, 'El tiempo estimado no puede exceder 120 minutos']
  },
  version: {
    type: String,
    default: '1.0'
  },
  // Recomendaciones dinámicas por rango de puntaje
  // Si no se definen, se usarán las recomendaciones por defecto del código
  recomendacionesPorNivel: [{
    rangoMin: {
      type: Number,
      required: true,
      min: 0
    },
    rangoMax: {
      type: Number,
      required: true,
      min: 0
    },
    nivel: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'El nombre del nivel no puede exceder 50 caracteres']
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción del nivel no puede exceder 200 caracteres']
    },
    recomendaciones: [{
      type: String,
      trim: true,
      maxlength: [500, 'Cada recomendación no puede exceder 500 caracteres']
    }],
    colorHexadecimal: {
      type: String,
      match: [/^#[0-9A-F]{6}$/i, 'El color debe estar en formato hexadecimal (ej: #FF5733)'],
      default: '#4CAF50'
    }
  }]
}, {
  timestamps: true
});

// Middleware para actualizar fechaModificacion
EncuestaSchema.pre('save', function(next) {
  this.fechaModificacion = new Date();
  next();
});

// Método para validar que las preguntas tengan orden único
EncuestaSchema.methods.validarOrdenPreguntas = function() {
  const ordenes = this.preguntas.map(p => p.orden);
  const ordenesUnicos = [...new Set(ordenes)];
  return ordenes.length === ordenesUnicos.length;
};

// Método para obtener la siguiente pregunta
EncuestaSchema.methods.obtenerSiguientePregunta = function(ordenActual) {
  return this.preguntas
    .filter(p => p.orden > ordenActual)
    .sort((a, b) => a.orden - b.orden)[0];
};

// Método para obtener la pregunta anterior
EncuestaSchema.methods.obtenerPreguntaAnterior = function(ordenActual) {
  return this.preguntas
    .filter(p => p.orden < ordenActual)
    .sort((a, b) => b.orden - a.orden)[0];
};

// Método para obtener recomendaciones según puntaje
EncuestaSchema.methods.obtenerRecomendacionesPorPuntaje = function(puntaje) {
  // Si no hay recomendaciones personalizadas, retornar null (usará las por defecto)
  if (!this.recomendacionesPorNivel || this.recomendacionesPorNivel.length === 0) {
    return null;
  }

  // Buscar el nivel que corresponda al puntaje
  // Los rangos deben estar ordenados por rangoMin
  const nivelEncontrado = this.recomendacionesPorNivel.find(nivel => 
    puntaje >= nivel.rangoMin && puntaje <= nivel.rangoMax
  );

  if (nivelEncontrado) {
    return {
      nivel: nivelEncontrado.nivel,
      descripcion: nivelEncontrado.descripcion,
      recomendaciones: nivelEncontrado.recomendaciones,
      color: nivelEncontrado.colorHexadecimal
    };
  }

  // Si no se encuentra un rango, retornar null (usará las por defecto)
  return null;
};

// Índices para optimizar consultas
EncuestaSchema.index({ activa: 1, categoria: 1 });
EncuestaSchema.index({ creadoPor: 1 });
EncuestaSchema.index({ fechaCreacion: -1 });

module.exports = model('Encuesta', EncuestaSchema);

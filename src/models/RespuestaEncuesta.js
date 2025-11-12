const mongoose = require('mongoose');

const { Schema, model } = mongoose;

// Schema para las respuestas individuales
const RespuestaIndividualSchema = new Schema({
  preguntaOrden: {
    type: Number,
    required: [true, 'El orden de la pregunta es obligatorio']
  },
  respuesta: {
    type: Schema.Types.Mixed, // Puede ser string, array, o number según el tipo de pregunta
    required: [true, 'La respuesta es obligatoria']
  },
  preguntaEnunciado: {
    type: String,
    required: [true, 'El enunciado de la pregunta es obligatorio']
  },
  preguntaTipo: {
    type: String,
    required: [true, 'El tipo de pregunta es obligatorio']
  },
  preguntaOpciones: {
    type: [String],
    required: false
  }
});

// Schema principal de respuesta a encuesta
const RespuestaEncuestaSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false, // Permitir null para usuarios anónimos
    default: null
  },
  encuestaId: {
    type: Schema.Types.ObjectId,
    ref: 'Encuesta',
    required: [true, 'El ID de la encuesta es obligatorio']
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  respuestas: {
    type: [RespuestaIndividualSchema],
    default: []
  },
  resultadoPDF: {
    type: String, // URL o ruta del archivo PDF generado
    required: false
  },
  copiaEncuesta: {
    titulo: {
      type: String,
      required: true
    },
    descripcion: String,
    categoria: String,
    version: String,
    preguntas: [{
      enunciado: String,
      opciones: [String],
      tipo: String,
      orden: Number,
      obligatoria: Boolean
    }]
  },
  tiempoCompletado: {
    type: Number, // en segundos
    min: [0, 'El tiempo no puede ser negativo']
  },
  completada: {
    type: Boolean,
    default: false
  },
  fechaCompletado: {
    type: Date,
    required: false
  },
  puntajeTotal: {
    type: Number,
    required: false,
    min: [0, 'El puntaje no puede ser negativo']
  },
  nivelRiesgo: {
    type: String,
    enum: {
      values: ['bajo', 'medio', 'alto', 'crítico'],
      message: 'El nivel de riesgo debe ser: bajo, medio, alto o crítico'
    },
    required: false
  },
  recomendaciones: {
    type: [String],
    required: false
  },
  estado: {
    type: String,
    enum: {
      values: ['en_progreso', 'completada', 'abandonada'],
      message: 'El estado debe ser: en_progreso, completada o abandonada'
    },
    default: 'en_progreso'
  }
}, {
  timestamps: true
});

// Middleware para actualizar fechaCompletado cuando se complete la encuesta
RespuestaEncuestaSchema.pre('save', function(next) {
  if (this.completada && !this.fechaCompletado) {
    this.fechaCompletado = new Date();
  }
  next();
});

// Método para calcular el puntaje total
RespuestaEncuestaSchema.methods.calcularPuntaje = function() {
  // Implementar lógica de cálculo según el tipo de encuesta
  let puntaje = 0;
  
  this.respuestas.forEach(respuesta => {


    if (respuesta.preguntaTipo === 'escala') {
      if(typeof respuesta.respuesta === 'string'){
        const index = respuesta.preguntaOpciones.indexOf(respuesta.respuesta);

        if(index!== -1){
          puntaje += index + 1;
        }
      }
      else{
        puntaje += parseInt(respuesta.respuesta) || 0;
      }
    }
  });
  
  this.puntajeTotal = puntaje;
  return puntaje;
};

// Método para determinar el nivel de riesgo
RespuestaEncuestaSchema.methods.determinarNivelRiesgo = function() {
  if (!this.puntajeTotal) {
    this.calcularPuntaje();
  }
  
  // Lógica básica de determinación de riesgo (puede ser personalizada)
  if (this.puntajeTotal <= 10) {
    this.nivelRiesgo = 'bajo';
  } else if (this.puntajeTotal <= 20) {
    this.nivelRiesgo = 'medio';
  } else if (this.puntajeTotal <= 30) {
    this.nivelRiesgo = 'alto';
  } else {
    this.nivelRiesgo = 'crítico';
  }
  
  return this.nivelRiesgo;
};

// Método para generar recomendaciones (dinámicas o por defecto)
RespuestaEncuestaSchema.methods.generarRecomendaciones = async function(encuesta) {
  // Si se proporcionó la encuesta y tiene recomendaciones personalizadas, usarlas
  if (encuesta && encuesta.recomendacionesPorNivel && encuesta.recomendacionesPorNivel.length > 0) {
    const puntaje = this.puntajeTotal || 0;
    
    // Buscar el nivel que corresponda al puntaje
    const nivelEncontrado = encuesta.recomendacionesPorNivel.find(nivel => 
      puntaje >= nivel.rangoMin && puntaje <= nivel.rangoMax
    );

    if (nivelEncontrado) {
      // El nivel ya viene del enum: bajo, medio, alto, crítico
      this.nivelRiesgo = nivelEncontrado.nivel;
      this.recomendaciones = nivelEncontrado.recomendaciones || [];
      return this.recomendaciones;
    }
  }

  // Si no hay recomendaciones personalizadas, usar las por defecto
  const recomendaciones = [];
  
  switch (this.nivelRiesgo) {
    case 'bajo':
      recomendaciones.push('Mantén tus buenos hábitos de bienestar');
      recomendaciones.push('Considera actividades de relajación regular');
      break;
    case 'medio':
      recomendaciones.push('Considera hablar con un profesional de la salud mental');
      recomendaciones.push('Practica técnicas de respiración y relajación');
      recomendaciones.push('Mantén una rutina regular de ejercicio');
      break;
    case 'alto':
      recomendaciones.push('Es recomendable consultar con un profesional de la salud mental');
      recomendaciones.push('Busca apoyo en familiares y amigos cercanos');
      recomendaciones.push('Considera grupos de apoyo o terapia');
      break;
    case 'crítico':
      recomendaciones.push('Busca ayuda profesional inmediatamente');
      recomendaciones.push('Contacta líneas de crisis o emergencias');
      recomendaciones.push('No dudes en pedir ayuda a profesionales de la salud');
      break;
    default:
      recomendaciones.push('Revisa tus resultados con un profesional de confianza');
  }
  
  this.recomendaciones = recomendaciones;
  return recomendaciones;
};

// Método para marcar como completada
RespuestaEncuestaSchema.methods.marcarCompletada = async function(encuesta = null) {
  this.completada = true;
  this.estado = 'completada';
  this.fechaCompletado = new Date();
  this.calcularPuntaje();
  
  // Si la encuesta tiene recomendaciones personalizadas, usar esas para determinar nivel
  if (encuesta && encuesta.recomendacionesPorNivel && encuesta.recomendacionesPorNivel.length > 0) {
    // No llamar determinarNivelRiesgo, lo hará generarRecomendaciones
    await this.generarRecomendaciones(encuesta);
  } else {
    // Usar el sistema por defecto
    this.determinarNivelRiesgo();
    await this.generarRecomendaciones();
  }
};

// Índices para optimizar consultas
RespuestaEncuestaSchema.index({ usuarioId: 1, encuestaId: 1 });
RespuestaEncuestaSchema.index({ encuestaId: 1, fecha: -1 });
RespuestaEncuestaSchema.index({ usuarioId: 1, fecha: -1 });
RespuestaEncuestaSchema.index({ estado: 1, fecha: -1 });

module.exports = model('RespuestaEncuesta', RespuestaEncuestaSchema);

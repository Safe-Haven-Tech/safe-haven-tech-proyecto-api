const RecursoInformativo = require('../models/RecursoInformativo');

class RecursosInformativosService {
  // Crear un nuevo recurso informativo
  async crearRecurso(datosRecurso) {
    try {
      const nuevoRecurso = new RecursoInformativo(datosRecurso);
      const recursoGuardado = await nuevoRecurso.save();
      return await recursoGuardado.populate('añadidoPor', 'nombreCompleto rol');
    } catch (error) {
      throw new Error(`Error al crear el recurso: ${error.message}`);
    }
  }

  // Obtener todos los recursos con paginación y filtros
  async obtenerRecursos(filtros = {}, opciones = {}) {
    try {
      const {
        pagina = 1,
        limite = 10,
        topico,
        tipo,
        destacado,
        busqueda
      } = filtros;

      const {
        ordenarPor = 'fechaCreacion',
        orden = 'desc'
      } = opciones;

      // Construir filtros de consulta
      const filtrosQuery = {};

      if (topico) {
        filtrosQuery.topicos = { $regex: topico, $options: 'i' };
      }

      if (tipo) {
        filtrosQuery.tipo = tipo;
      }

      if (destacado !== undefined) {
        filtrosQuery.destacado = destacado;
      }

      if (busqueda) {
        filtrosQuery.$text = { $search: busqueda };
      }

      // Calcular skip para paginación
      const skip = (pagina - 1) * limite;

      // Construir ordenamiento
      const ordenamiento = {};
      ordenamiento[ordenarPor] = orden === 'desc' ? -1 : 1;

      // Ejecutar consulta
      const recursos = await RecursoInformativo.find(filtrosQuery)
        .populate('añadidoPor', 'nombreCompleto rol')
        .sort(ordenamiento)
        .skip(skip)
        .limit(limite);

      // Contar total de documentos para paginación
      const total = await RecursoInformativo.countDocuments(filtrosQuery);

      return {
        recursos,
        paginacion: {
          pagina,
          limite,
          total,
          totalPaginas: Math.ceil(total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener recursos: ${error.message}`);
    }
  }

  // Obtener un recurso por ID
async obtenerRecursoPorId(id) {
  try {
    const recurso = await RecursoInformativo.findById(id)
      .populate('añadidoPor', 'nombreCompleto rol')
      .populate('calificacion.votos.usuario', '_id') 
      .lean();
    
    if (!recurso) {
      throw new Error('Recurso no encontrado');
    }

    return recurso;
  } catch (error) {
    throw new Error(`Error al obtener el recurso: ${error.message}`);
  }
}

  // Buscar recursos por texto
  async buscarRecursos(termino, opciones = {}) {
    try {
      const { limite = 10, topico } = opciones;

      const filtrosQuery = { $text: { $search: termino } };

      if (topico) {
        filtrosQuery.topicos = { $regex: topico, $options: 'i' };
      }

      const recursos = await RecursoInformativo.find(filtrosQuery)
        .populate('añadidoPor', 'nombreCompleto rol')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limite);

      return recursos;
    } catch (error) {
      throw new Error(`Error al buscar recursos: ${error.message}`);
    }
  }

  // Obtener recursos por tópico
  async obtenerRecursosPorTopico(topico, opciones = {}) {
    try {
      const { limite = 10, ordenarPor = 'fechaCreacion' } = opciones;

      const recursos = await RecursoInformativo.find({
        topicos: { $regex: topico, $options: 'i' }
      })
        .populate('añadidoPor', 'nombreCompleto rol')
        .sort({ [ordenarPor]: -1 })
        .limit(limite);

      return recursos;
    } catch (error) {
      throw new Error(`Error al obtener recursos por tópico: ${error.message}`);
    }
  }

  // Obtener recursos destacados
  async obtenerRecursosDestacados(limite = 10) {
    try {
      const recursos = await RecursoInformativo.find({ destacado: true })
        .populate('añadidoPor', 'nombreCompleto rol')
        .sort({ fechaCreacion: -1 })
        .limit(limite);

      return recursos;
    } catch (error) {
      throw new Error(`Error al obtener recursos destacados: ${error.message}`);
    }
  }

  // Obtener recursos por tipo
  async obtenerRecursosPorTipo(tipo, opciones = {}) {
    try {
      const { limite = 10, ordenarPor = 'fechaCreacion' } = opciones;

      const recursos = await RecursoInformativo.find({ tipo })
        .populate('añadidoPor', 'nombreCompleto rol')
        .sort({ [ordenarPor]: -1 })
        .limit(limite);

      return recursos;
    } catch (error) {
      throw new Error(`Error al obtener recursos por tipo: ${error.message}`);
    }
  }

  // Actualizar un recurso
  async actualizarRecurso(id, datosActualizados) {
    try {
      const recurso = await RecursoInformativo.findByIdAndUpdate(
        id,
        { ...datosActualizados, fechaActualizacion: new Date() },
        { new: true, runValidators: true }
      ).populate('añadidoPor', 'nombreCompleto rol');

      if (!recurso) {
        throw new Error('Recurso no encontrado');
      }

      return recurso;
    } catch (error) {
      throw new Error(`Error al actualizar el recurso: ${error.message}`);
    }
  }

  // Eliminar un recurso
  async eliminarRecurso(id) {
    try {
      const recurso = await RecursoInformativo.findById(id);
      
      if (!recurso) {
        throw new Error('Recurso no encontrado');
      }

      // Eliminar archivos de Cloudinary antes de eliminar el recurso
      const { cloudinaryRecursos } = require('../utils');
      
      try {
        // Eliminar imagen principal
        if (recurso.imagenPrincipal) {
          const publicId = `recursos-informativos/imagenes-principales/recurso_${id}_principal`;
          await cloudinaryRecursos.eliminarImagenCloudinary(publicId);
        }

        // Eliminar imágenes de galería
        if (recurso.galeria && recurso.galeria.length > 0) {
          for (const imagenUrl of recurso.galeria) {
            // Extraer publicId de la URL de Cloudinary
            const publicIdMatch = imagenUrl.match(/\/recursos-informativos\/galeria\/([^\/]+)$/);
            if (publicIdMatch) {
              const publicId = publicIdMatch[1];
              await cloudinaryRecursos.eliminarImagenCloudinary(publicId);
            }
          }
        }

        // Eliminar documentos adjuntos
        if (recurso.archivosAdjuntos && recurso.archivosAdjuntos.length > 0) {
          for (const archivo of recurso.archivosAdjuntos) {
            // Extraer publicId de la URL si es posible
            const publicId = archivo.match(/\/recursos-informativos\/documentos\/([^\/]+)$/)?.[1];
            if (publicId) {
              await cloudinaryRecursos.eliminarDocumentoCloudinary(publicId);
            }
          }
        }
      } catch (cloudinaryError) {
        console.warn('⚠️ Error al eliminar archivos de Cloudinary:', cloudinaryError.message);
        // Continuar con la eliminación del recurso incluso si falla la eliminación de archivos
      }

      // Eliminar el recurso de la base de datos
      await RecursoInformativo.findByIdAndDelete(id);
      
      console.log(`✅ Recurso eliminado: ${recurso.titulo}`);
      return recurso;
    } catch (error) {
      throw new Error(`Error al eliminar el recurso: ${error.message}`);
    }
  }

  // Calificar un recurso
  async calificarRecurso(id, usuarioId, calificacion) {
    try {
      const recurso = await RecursoInformativo.findById(id);
      
      if (!recurso) {
        throw new Error('Recurso no encontrado');
      }

      await recurso.agregarCalificacion(usuarioId, calificacion);
      
      return await recurso.populate('añadidoPor', 'nombreCompleto rol');
    } catch (error) {
      throw new Error(`Error al calificar el recurso: ${error.message}`);
    }
  }

  // Incrementar visitas
async incrementarVisitas(id) {
  try {
    
    const recurso = await RecursoInformativo.findByIdAndUpdate(
      id,
      { $inc: { visitas: 1 } },
      { new: true }
    );
    
    if (!recurso) {
      throw new Error('Recurso no encontrado');
    }

    return recurso;
  } catch (error) {
    throw new Error(`Error al incrementar visitas: ${error.message}`);
  }
}
  // Incrementar descargas
async incrementarDescargas(id) {
  try {
    const recurso = await RecursoInformativo.findByIdAndUpdate(
      id,
      { $inc: { descargas: 1 } },
      { new: true }
    );
    
    if (!recurso) {
      throw new Error('Recurso no encontrado');
    }

    return recurso;
  } catch (error) {
    throw new Error(`Error al incrementar descargas: ${error.message}`);
  }
}

  // Incrementar compartidos
async incrementarCompartidos(id) {
  try {
    const recurso = await RecursoInformativo.findByIdAndUpdate(
      id,
      { $inc: { compartidos: 1 } },
      { new: true }
    );
    
    if (!recurso) {
      throw new Error('Recurso no encontrado');
    }

    return recurso;
  } catch (error) {
    throw new Error(`Error al incrementar compartidos: ${error.message}`);
  }
}


  // Obtener estadísticas generales
  async obtenerEstadisticas() {
    try {
      const totalRecursos = await RecursoInformativo.countDocuments();
      const recursosDestacados = await RecursoInformativo.countDocuments({ destacado: true });
      
      // Calcular promedio de calificaciones
      const recursosConCalificacion = await RecursoInformativo.find({
        'calificacion.totalVotos': { $gt: 0 }
      });
      
      const promedioGeneral = recursosConCalificacion.length > 0
        ? recursosConCalificacion.reduce((sum, r) => sum + r.calificacion.promedio, 0) / recursosConCalificacion.length
        : 0;

      // Contar por tipo
      const tipos = await RecursoInformativo.aggregate([
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Contar por tópicos
      const topicos = await RecursoInformativo.aggregate([
        { $unwind: '$topicos' },
        { $group: { _id: '$topicos', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return {
        totalRecursos,
        recursosDestacados,
        promedioCalificacion: Math.round(promedioGeneral * 10) / 10,
        recursosConCalificacion: recursosConCalificacion.length,
        distribucionPorTipo: tipos,
        distribucionPorTopicos: topicos
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Obtener tópicos disponibles
  async obtenerTopicosDisponibles() {
    try {
      const topicos = await RecursoInformativo.aggregate([
        { $unwind: '$topicos' },
        { $group: { _id: '$topicos' } },
        { $sort: { _id: 1 } }
      ]);

      return topicos.map(t => t._id);
    } catch (error) {
      throw new Error(`Error al obtener tópicos: ${error.message}`);
    }
  }

  // Obtener tipos disponibles
  async obtenerTiposDisponibles() {
    try {
      const tipos = await RecursoInformativo.aggregate([
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return tipos;
    } catch (error) {
      throw new Error(`Error al obtener tipos: ${error.message}`);
    }
  }
}

module.exports = new RecursosInformativosService();

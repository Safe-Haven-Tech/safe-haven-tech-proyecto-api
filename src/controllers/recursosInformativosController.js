const recursosInformativosService = require('../services/recursosInformativosService');

const { cloudinaryRecursos, multerRecursos } = require("../utils");

// Obtener todos los recursos informativos
const obtenerRecursos = async (req, res) => {
  try {
    const { pagina, limite, topico, tipo, destacado, busqueda } = req.query;

    const filtros = {};
    if (topico) filtros.topico = topico;
    if (tipo) filtros.tipo = tipo;
    if (destacado !== undefined) filtros.destacado = destacado === "true";
    if (busqueda) filtros.busqueda = busqueda;

    const opciones = {
      pagina: parseInt(pagina) || 1,
      limite: parseInt(limite) || 10,
    };

    const resultado = await recursosInformativosService.obtenerRecursos(
      filtros,
      opciones
    );

    res.json({
      success: true,
      data: resultado.recursos,
      paginacion: resultado.paginacion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener recursos informativos",
      error: error.message,
    });
  }
};

// Obtener un recurso por ID
const obtenerRecursoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const recurso = await recursosInformativosService.obtenerRecursoPorId(id);

    res.json({
      success: true,
      status: 200,
      data: recurso,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "Recurso no encontrado",
      error: error.message,
    });
  }
};

// Crear un nuevo recurso informativo
const crearRecurso = async (req, res) => {
  try {
    const datosRecurso = {
      ...req.body,
      añadidoPor: req.usuario.userId,
    };

    const nuevoRecurso = await recursosInformativosService.crearRecurso(
      datosRecurso
    );

    res.status(201).json({
      success: true,
      message: "Recurso informativo creado exitosamente",
      data: nuevoRecurso,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error al crear el recurso informativo",
      error: error.message,
    });
  }
};

// Actualizar un recurso informativo
const actualizarRecurso = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    const recursoActualizado =
      await recursosInformativosService.actualizarRecurso(
        id,
        datosActualizados
      );

    res.json({
      success: true,
      message: "Recurso informativo actualizado exitosamente",
      data: recursoActualizado,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error al actualizar el recurso informativo",
      error: error.message,
    });
  }
};

// Eliminar un recurso informativo
const eliminarRecurso = async (req, res) => {
  try {
    const { id } = req.params;
    await recursosInformativosService.eliminarRecurso(id);

    res.json({
      success: true,
      message: "Recurso informativo eliminado exitosamente",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error al eliminar el recurso informativo",
      error: error.message,
    });
  }
};

// Buscar recursos por texto
const buscarRecursos = async (req, res) => {
  try {
    const { q, topico, limite } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "El término de búsqueda es obligatorio",
      });
    }

    const opciones = {
      limite: parseInt(limite) || 10,
      topico: topico || null,
    };

    const recursos = await recursosInformativosService.buscarRecursos(
      q,
      opciones
    );

    res.json({
      success: true,
      data: recursos,
      total: recursos.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al buscar recursos",
      error: error.message,
    });
  }
};

// Obtener recursos por tópico
const obtenerRecursosPorTopico = async (req, res) => {
  try {
    const { topico } = req.params;
    const { limite, ordenarPor } = req.query;

    const opciones = {
      limite: parseInt(limite) || 10,
      ordenarPor: ordenarPor || "fechaCreacion",
    };

    const recursos = await recursosInformativosService.obtenerRecursosPorTopico(
      topico,
      opciones
    );

    res.json({
      success: true,
      data: recursos,
      topico: topico,
      total: recursos.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener recursos por tópico",
      error: error.message,
    });
  }
};

// Obtener recursos destacados
const obtenerRecursosDestacados = async (req, res) => {
  try {
    const { limite } = req.query;
    const recursos =
      await recursosInformativosService.obtenerRecursosDestacados(
        parseInt(limite) || 10
      );

    res.json({
      success: true,
      data: recursos,
      total: recursos.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener recursos destacados",
      error: error.message,
    });
  }
};

// Obtener recursos por tipo
const obtenerRecursosPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const { limite, ordenarPor } = req.query;

    const opciones = {
      limite: parseInt(limite) || 10,
      ordenarPor: ordenarPor || "fechaCreacion",
    };

    const recursos = await recursosInformativosService.obtenerRecursosPorTipo(
      tipo,
      opciones
    );

    res.json({
      success: true,
      data: recursos,
      tipo: tipo,
      total: recursos.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener recursos por tipo",
      error: error.message,
    });
  }
};

// Calificar un recurso
const calificarRecurso = async (req, res) => {
  try {
    const { id } = req.params;
    const { calificacion } = req.body;
    const usuarioId = req.usuario.userId;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        success: false,
        message: "La calificación debe estar entre 1 y 5",
      });
    }

    const recursoCalificado =
      await recursosInformativosService.calificarRecurso(
        id,
        usuarioId,
        calificacion
      );

    res.json({
      success: true,
      message: "Recurso calificado exitosamente",
      data: recursoCalificado,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error al calificar el recurso",
      error: error.message,
    });
  }
};


// Incrementar visitas 
const incrementarVisitas = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recurso = await recursosInformativosService.incrementarVisitas(id);

    res.json({
      success: true,
      message: "Visitas incrementadas exitosamente",
      data: { 
        visitas: recurso.visitas,
        id: recurso._id
      },
    });
  } catch (error) {
    console.error('Error en incrementarVisitas:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: "Recurso no encontrado",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al incrementar visitas",
      error: error.message,
    });
  }
};

// Incrementar descargas 
const incrementarDescargas = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recurso = await recursosInformativosService.incrementarDescargas(id);

    res.json({
      success: true,
      message: "Descargas incrementadas exitosamente",
      data: { 
        descargas: recurso.descargas,
        id: recurso._id
      },
    });
  } catch (error) {
    console.error('Error en incrementarDescargas:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: "Recurso no encontrado",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al incrementar descargas",
      error: error.message,
    });
  }
};

// Incrementar compartidos 
const incrementarCompartidos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recurso = await recursosInformativosService.incrementarCompartidos(id);

    res.json({
      success: true,
      message: "Compartidos incrementados exitosamente",
      data: { 
        compartidos: recurso.compartidos,
        id: recurso._id
      },
    });
  } catch (error) {
    console.error('Error en incrementarCompartidos:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: "Recurso no encontrado",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al incrementar compartidos",
      error: error.message,
    });
  }
};

// Obtener estadísticas
const obtenerEstadisticas = async (req, res) => {
  try {
    console.log('📊 Solicitando estadísticas de recursos informativos...');
    
    const estadisticas = await recursosInformativosService.obtenerEstadisticas();
    
    res.status(200).json({
      exito: true,
      mensaje: 'Estadísticas obtenidas exitosamente',
      data: estadisticas
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: error.message || 'Error interno del servidor',
      data: null
    });
  }
};

// Obtener tópicos disponibles
const obtenerTopicosDisponibles = async (req, res) => {
  try {
    const topicos =
      await recursosInformativosService.obtenerTopicosDisponibles();

    res.json({
      success: true,
      data: topicos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener tópicos",
      error: error.message,
    });
  }
};

// Obtener tipos disponibles
const obtenerTiposDisponibles = async (req, res) => {
  try {
    const tipos = await recursosInformativosService.obtenerTiposDisponibles();

    res.json({
      success: true,
      data: tipos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos",
      error: error.message,
    });
  }
};

// Subir imagen principal
const subirImagenPrincipal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se ha proporcionado ninguna imagen",
      });
    }

    // Obtener el recurso actual para verificar si ya tiene imagen
    const recursoActual = await recursosInformativosService.obtenerRecursoPorId(
      id
    );
    const publicIdAnterior = recursoActual.imagenPrincipal
      ? `recursos-informativos/imagenes-principales/recurso_${id}_principal`
      : null;

    // Subir a Cloudinary
    const resultado = await cloudinaryRecursos.subirImagenPrincipal(
      req.file.path,
      id,
      publicIdAnterior
    );

    // Actualizar el recurso
    const recursoActualizado =
      await recursosInformativosService.actualizarRecurso(id, {
        imagenPrincipal: resultado.url,
      });

    res.json({
      success: true,
      message: "Imagen principal subida exitosamente",
      data: {
        imagenPrincipal: resultado.url,
        publicId: resultado.publicId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al subir imagen principal",
      error: error.message,
    });
  }
};

// Subir imágenes a galería
const subirImagenesGaleria = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se han proporcionado imágenes",
      });
    }

    // Obtener el recurso actual para verificar si ya tiene imágenes
    const recurso = await recursosInformativosService.obtenerRecursoPorId(id);

    // Eliminar imágenes anteriores de Cloudinary si existen
    if (recurso.galeria && recurso.galeria.length > 0) {
      try {
        console.log(
          `🗑️ Eliminando ${recurso.galeria.length} imágenes anteriores de galería...`
        );
        console.log(`📋 URLs de imágenes en BD:`, recurso.galeria);

        let eliminadasExitosamente = 0;
        let noEncontradas = 0;

        for (let i = 0; i < recurso.galeria.length; i++) {
          const urlImagen = recurso.galeria[i];

          console.log(`🔍 Procesando imagen ${i}:`);
          console.log(`   - URL en BD: ${urlImagen}`);

          // Extraer publicId de la URL de Cloudinary incluyendo la carpeta completa
          let publicId = null;

          // Método 1: Buscar después de "galeria/" e incluir la carpeta
          if (urlImagen.includes("/galeria/")) {
            const partes = urlImagen.split("/galeria/");
            if (partes.length > 1) {
              // Incluir la carpeta completa: "recursos-informativos/galeria/archivo.jpg"
              publicId = `recursos-informativos/galeria/${partes[1].split("?")[0]}`;
            }
          }

          // Método 2: Si no funciona, extraer manualmente la ruta completa
          if (!publicId) {
            // Buscar el patrón: /recursos-informativos/galeria/nombreArchivo
            const match = urlImagen.match(/\/recursos-informativos\/galeria\/([^\/\?]+)/);
            if (match) {
              publicId = `recursos-informativos/galeria/${match[1]}`;
            }
          }

          // Método 3: Fallback - extraer la última parte y construir la ruta
          if (!publicId) {
            const urlParts = urlImagen.split("/");
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes("recurso_") && lastPart.includes("_galeria_")) {
              publicId = `recursos-informativos/galeria/${lastPart.split("?")[0]}`;
            }
          }

          if (publicId) {
            console.log(`   - PublicId extraído: ${publicId}`);
            console.log(`   - PublicId completo para Cloudinary: ${publicId}`);

            try {
              const eliminada =
                await cloudinaryRecursos.eliminarImagenCloudinary(publicId);
              if (eliminada) {
                eliminadasExitosamente++;
                console.log(
                  `✅ Imagen anterior eliminada exitosamente: ${publicId}`
                );
              } else {
                noEncontradas++;
                console.log(`⚠️ Imagen anterior no encontrada: ${publicId}`);
              }
            } catch (deleteError) {
              console.warn(
                `❌ Error al eliminar imagen ${publicId}:`,
                deleteError.message
              );
            }
          } else {
            console.warn(`⚠️ No se pudo extraer publicId de: ${urlImagen}`);
          }
        }

        console.log(
          `📊 Resumen de eliminación: ${eliminadasExitosamente} eliminadas, ${noEncontradas} no encontradas`
        );
        console.log(
          `✅ Proceso de eliminación de imágenes anteriores completado`
        );

        // Verificar que las imágenes se eliminaron realmente
        if (eliminadasExitosamente > 0) {
          console.log(
            `🎯 Se eliminaron ${eliminadasExitosamente} imágenes de Cloudinary exitosamente`
          );
        } else {
          console.log(
            `⚠️ No se eliminó ninguna imagen de Cloudinary (${noEncontradas} no encontradas)`
          );
        }
      } catch (cloudinaryError) {
        console.warn(
          "⚠️ Error general al eliminar imágenes anteriores de Cloudinary:",
          cloudinaryError.message
        );
      }
    }

    const urlsImagenes = [];
    const publicIds = [];

    // Subir cada imagen a Cloudinary con números secuenciales únicos
    for (let i = 0; i < req.files.length; i++) {
      const archivo = req.files[i];
      const resultado = await cloudinaryRecursos.subirImagenGaleria(
        archivo.path,
        id,
        i
      );
      urlsImagenes.push(resultado.url);
      publicIds.push(resultado.publicId);
    }

    // Actualizar el recurso REEMPLAZANDO la galería (no agregando)
    const recursoActualizado =
      await recursosInformativosService.actualizarRecurso(id, {
        galeria: urlsImagenes, // Reemplazar completamente, no agregar
      });

    res.json({
      success: true,
      message: "Imágenes de galería subidas exitosamente",
      data: {
        galeria: recursoActualizado.galeria,
        nuevasImagenes: urlsImagenes,
        publicIds: publicIds,
        imagenesAnterioresEliminadas: recurso.galeria
          ? recurso.galeria.length
          : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al subir imágenes de galería",
      error: error.message,
    });
  }
};

// Subir documentos adjuntos
const subirDocumentosAdjuntos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se han proporcionado documentos",
      });
    }

    console.log(
      `📚 Subiendo ${req.files.length} documentos para recurso ${id}`
    );
    console.log(
      `📋 Archivos recibidos:`,
      req.files.map((f) => f.originalname)
    );

    // Obtener el recurso actual para verificar si ya tiene documentos
    const recurso = await recursosInformativosService.obtenerRecursoPorId(id);

         // Eliminar documentos anteriores de Cloudinary si existen
     if (recurso.archivosAdjuntos && recurso.archivosAdjuntos.length > 0) {
       try {
         console.log(
           `🗑️ Eliminando ${recurso.archivosAdjuntos.length} documentos anteriores...`
         );
         console.log(`📋 URLs de documentos en BD:`, recurso.archivosAdjuntos);
         
         let eliminadosExitosamente = 0;
         let noEncontrados = 0;

        for (let i = 0; i < recurso.archivosAdjuntos.length; i++) {
          const urlDocumento = recurso.archivosAdjuntos[i];

          console.log(`🔍 Procesando documento ${i}:`);
          console.log(`   - URL en BD: ${urlDocumento}`);

          // Extraer publicId de la URL de Cloudinary incluyendo la carpeta completa
          let publicId = null;

          // Método 1: Buscar después de "documentos/" e incluir la carpeta
          if (urlDocumento.includes("/documentos/")) {
            const partes = urlDocumento.split("/documentos/");
            if (partes.length > 1) {
              // Incluir la carpeta completa: "recursos-informativos/documentos/archivo.pdf"
              // PERO remover la extensión del archivo para que coincida con public_id de Cloudinary
              const nombreArchivo = partes[1].split("?")[0];
              const nombreSinExtension = nombreArchivo.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip)$/i, '');
              publicId = `recursos-informativos/documentos/${nombreSinExtension}`;
            }
          }

          // Método 2: Si no funciona, extraer manualmente la ruta completa
          if (!publicId) {
            // Buscar el patrón: /recursos-informativos/documentos/nombreArchivo
            const match = urlDocumento.match(/\/recursos-informativos\/documentos\/([^\/\?]+)/);
            if (match) {
              const nombreArchivo = match[1];
              const nombreSinExtension = nombreArchivo.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip)$/i, '');
              publicId = `recursos-informativos/documentos/${nombreSinExtension}`;
            }
          }

          // Método 3: Fallback - extraer la última parte y construir la ruta
          if (!publicId) {
            const urlParts = urlDocumento.split("/");
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes("recurso_") && lastPart.includes("_doc_")) {
              const nombreSinExtension = lastPart.split("?")[0].replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip)$/i, '');
              publicId = `recursos-informativos/documentos/${nombreSinExtension}`;
            }
          }

          if (publicId) {
            console.log(`   - PublicId extraído: ${publicId}`);
            console.log(`   - PublicId completo para Cloudinary: ${publicId}`);

            try {
              const eliminado =
                await cloudinaryRecursos.eliminarDocumentoCloudinary(publicId);
              if (eliminado) {
                eliminadosExitosamente++;
                console.log(
                  `✅ Documento anterior eliminado exitosamente: ${publicId}`
                );
              } else {
                noEncontrados++;
                console.log(`⚠️ Documento anterior no encontrado: ${publicId}`);
              }
            } catch (deleteError) {
              console.warn(
                `❌ Error al eliminar documento ${publicId}:`,
                deleteError.message
              );
            }
          } else {
            console.warn(`⚠️ No se pudo extraer publicId de: ${urlDocumento}`);
            console.warn(`   - Intentando extraer manualmente...`);
            
            // Extracción manual más agresiva como fallback
            const urlParts = urlDocumento.split('/');
            for (let j = urlParts.length - 1; j >= 0; j--) {
              const part = urlParts[j];
              if (part && part.includes('recurso_') && part.includes('doc_')) {
                const manualPublicId = part.split('?')[0];
                console.log(`   - PublicId manual extraído: ${manualPublicId}`);
                
                try {
                  const eliminado = await cloudinaryRecursos.eliminarDocumentoCloudinary(manualPublicId);
                  if (eliminado) {
                    eliminadosExitosamente++;
                    console.log(`✅ Documento anterior eliminado exitosamente (manual): ${manualPublicId}`);
                  } else {
                    noEncontrados++;
                    console.log(`⚠️ Documento anterior no encontrado (manual): ${manualPublicId}`);
                  }
                } catch (deleteError) {
                  console.warn(`❌ Error al eliminar documento ${manualPublicId}:`, deleteError.message);
                }
                break;
              }
            }
          }
        }

                 console.log(
           `📊 Resumen de eliminación: ${eliminadosExitosamente} eliminados, ${noEncontrados} no encontrados`
         );
         console.log(
           `✅ Proceso de eliminación de documentos anteriores completado`
         );
         
         // Verificar que los documentos se eliminaron realmente
         if (eliminadosExitosamente > 0) {
           console.log(`🎯 Se eliminaron ${eliminadosExitosamente} documentos de Cloudinary exitosamente`);
         } else {
           console.log(`⚠️ No se eliminó ningún documento de Cloudinary (${noEncontrados} no encontrados)`);
         }
       } catch (cloudinaryError) {
         console.warn(
           "⚠️ Error general al eliminar documentos anteriores de Cloudinary:",
           cloudinaryError.message
         );
       }
    }

    const urlsDocumentos = [];
    const publicIds = [];
    const errores = [];

    // Subir cada documento a Cloudinary
    for (let i = 0; i < req.files.length; i++) {
      const archivo = req.files[i];
      const nombreArchivo = archivo.originalname || `documento_${Date.now()}`;

      console.log(
        `📤 Procesando documento ${i + 1}/${req.files.length}: ${nombreArchivo}`
      );

      try {
        const resultado = await cloudinaryRecursos.subirDocumentoAdjunto(
          archivo.path,
          id,
          nombreArchivo
        );
        urlsDocumentos.push(resultado.url);
        publicIds.push(resultado.publicId);
        console.log(`✅ Documento ${nombreArchivo} subido exitosamente`);
      } catch (uploadError) {
        console.error(
          `❌ Error subiendo documento ${nombreArchivo}:`,
          uploadError.message
        );
        errores.push({
          archivo: nombreArchivo,
          error: uploadError.message,
        });
      }
    }

    // Verificar si se subieron documentos exitosamente
    if (urlsDocumentos.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No se pudo subir ningún documento",
        errores: errores,
      });
    }

    // Actualizar el recurso REEMPLAZANDO los documentos (no agregando)
    const recursoActualizado =
      await recursosInformativosService.actualizarRecurso(id, {
        archivosAdjuntos: urlsDocumentos, // Reemplazar completamente, no agregar
      });

    console.log(
      `📊 Resumen: ${urlsDocumentos.length} documentos subidos, ${errores.length} errores`
    );
    console.log(
      `📊 Documentos anteriores eliminados: ${
        recurso.archivosAdjuntos ? recurso.archivosAdjuntos.length : 0
      }`
    );

    res.json({
      success: true,
      message: "Documentos adjuntos subidos exitosamente",
      data: {
        archivosAdjuntos: recursoActualizado.archivosAdjuntos,
        nuevosDocumentos: urlsDocumentos,
        publicIds: publicIds,
        totalSubidos: urlsDocumentos.length,
        totalErrores: errores.length,
        documentosAnterioresEliminados: recurso.archivosAdjuntos
          ? recurso.archivosAdjuntos.length
          : 0,
        errores: errores.length > 0 ? errores : undefined,
      },
    });
  } catch (error) {
    console.error("❌ Error general al subir documentos:", error);
    res.status(500).json({
      success: false,
      message: "Error al subir documentos adjuntos",
      error: error.message,
    });
  }
};

// Eliminar archivo
const eliminarArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { archivoId } = req.query; // Cambiar de req.params a req.query

    // Validar que se proporcione el archivoId
    if (!archivoId) {
      return res.status(400).json({
        success: false,
        message: "El archivoId es obligatorio",
      });
    }

    // Obtener el recurso
    const recurso = await recursosInformativosService.obtenerRecursoPorId(id);

    // Buscar el archivo en galería o archivos adjuntos
    let archivoEncontrado = null;
    let tipoArchivo = null;

    // Buscar en galería
    if (recurso.galeria && recurso.galeria.includes(archivoId)) {
      archivoEncontrado = archivoId;
      tipoArchivo = "galeria";
    }

    // Buscar en archivos adjuntos
    if (
      recurso.archivosAdjuntos &&
      recurso.archivosAdjuntos.includes(archivoId)
    ) {
      archivoEncontrado = archivoId;
      tipoArchivo = "archivosAdjuntos";
    }

    if (!archivoEncontrado) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado",
      });
    }

    // Eliminar de Cloudinary (asumiendo que el archivoId es la URL)
    try {
      await cloudinaryRecursos.eliminarArchivosCloudinary([archivoId]);
    } catch (cloudinaryError) {
      console.warn("Error al eliminar de Cloudinary:", cloudinaryError.message);
    }

    // Actualizar el recurso
    const datosActualizados = {};
    if (tipoArchivo === "galeria") {
      datosActualizados.galeria = recurso.galeria.filter(
        (url) => url !== archivoId
      );
    } else if (tipoArchivo === "archivosAdjuntos") {
      datosActualizados.archivosAdjuntos = recurso.archivosAdjuntos.filter(
        (url) => url !== archivoId
      );
    }

    const recursoActualizado =
      await recursosInformativosService.actualizarRecurso(
        id,
        datosActualizados
      );

    res.json({
      success: true,
      message: "Archivo eliminado exitosamente",
      data: {
        [tipoArchivo]: recursoActualizado[tipoArchivo],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar archivo",
      error: error.message,
    });
  }
};



module.exports = {
  obtenerRecursos,
  obtenerRecursoPorId,
  crearRecurso,
  actualizarRecurso,
  eliminarRecurso,
  buscarRecursos,
  obtenerRecursosPorTopico,
  obtenerRecursosDestacados,
  obtenerRecursosPorTipo,
  calificarRecurso,
  incrementarVisitas,
  incrementarDescargas,
  incrementarCompartidos,
  obtenerTopicosDisponibles,
  obtenerTiposDisponibles,
  subirImagenPrincipal,
  subirImagenesGaleria,
  subirDocumentosAdjuntos,
  eliminarArchivo,
  obtenerEstadisticas,
};

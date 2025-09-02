const { cloudinary } = require('../config/index.js');
const fs = require('fs').promises;
const path = require('path');

// Función para subir imagen principal a Cloudinary
const subirImagenPrincipal = async (filePath, recursoId, publicIdAnterior = null) => {
  try {
    // Eliminar imagen anterior si existe
    if (publicIdAnterior) {
      await cloudinary.uploader.destroy(publicIdAnterior);
      console.log(`✅ Imagen anterior eliminada: ${publicIdAnterior}`);
    }

    // Subir nueva imagen
    const resultado = await cloudinary.uploader.upload(filePath, {
      folder: 'recursos-informativos/imagenes-principales',
      public_id: `recurso_${recursoId}_principal`,
      overwrite: true,
      transformation: [
        { quality: 'auto:good' }
      ]
    });

    // Eliminar archivo temporal
    await fs.unlink(filePath);
    console.log(`✅ Archivo temporal eliminado: ${filePath}`);

    return {
      url: resultado.secure_url,
      publicId: resultado.public_id
    };
  } catch (error) {
    console.error('❌ Error subiendo imagen principal a Cloudinary:', error);
    throw new Error('No se pudo subir la imagen principal');
  }
};

// Función para subir imagen de galería a Cloudinary
const subirImagenGaleria = async (filePath, recursoId, orden = 0) => {
  try {
    // Usar un nombre simple y predecible
    const resultado = await cloudinary.uploader.upload(filePath, {
      folder: 'recursos-informativos/galeria',
      public_id: `recurso_${recursoId}_galeria_${orden}`,
      transformation: [
        { quality: 'auto:good' }
      ]
    });

    // Eliminar archivo temporal
    await fs.unlink(filePath);
    console.log(`✅ Imagen de galería subida: ${filePath}`);

    return {
      url: resultado.secure_url,
      publicId: resultado.public_id
    };
  } catch (error) {
    console.error('❌ Error subiendo imagen de galería a Cloudinary:', error);
    throw new Error('No se pudo subir la imagen de galería');
  }
};

// Función para subir documento adjunto a Cloudinary
const subirDocumentoAdjunto = async (filePath, recursoId, nombreArchivo) => {
  try {
    console.log(`📤 Subiendo documento: ${nombreArchivo} (${filePath})`);
    
    // Configuración mínima para evitar restricciones de seguridad
    const resultado = await cloudinary.uploader.upload(filePath, {
      folder: 'recursos-informativos/documentos',
      public_id: `recurso_${recursoId}_doc_${Date.now()}`
      // Sin resource_type, sin format, sin flags, sin transformation
    });

    console.log(`📊 Respuesta de Cloudinary:`, resultado);

    // Eliminar archivo temporal
    await fs.unlink(filePath);
    console.log(`✅ Documento subido exitosamente: ${nombreArchivo}`);

    return {
      url: resultado.secure_url,
      publicId: resultado.public_id,
      tipo: resultado.format || 'otro'
    };
  } catch (error) {
    console.error('❌ Error subiendo documento a Cloudinary:', error);
    throw new Error(`No se pudo subir el documento ${nombreArchivo}: ${error.message}`);
  }
};

// Función para eliminar imagen de Cloudinary
const eliminarImagenCloudinary = async (publicId) => {
  if (!publicId) return false;
  
  try {
    console.log(`🗑️ Intentando eliminar imagen: ${publicId}`);
    
    // Usar resource_type 'image' (correcto para imágenes)
    const resultado = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    
    console.log(`📊 Respuesta de Cloudinary para imagen:`, resultado);
    
    if (resultado.result === 'ok') {
      console.log(`✅ Imagen eliminada exitosamente de Cloudinary: ${publicId}`);
      return true;
    } else {
      console.warn(`⚠️ Respuesta inesperada de Cloudinary para imagen: ${resultado.result}`);
      return false;
    }
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Invalid public ID')) {
      console.warn(`⚠️ Imagen no encontrada en Cloudinary: ${publicId}`);
      return false;
    } else {
      console.error(`❌ Error eliminando imagen de Cloudinary ${publicId}:`, error.message);
      return false;
    }
  }
};

// Función para eliminar documento de Cloudinary
const eliminarDocumentoCloudinary = async (publicId) => {
  if (!publicId) return false;
  
  try {
    console.log(`🗑️ Intentando eliminar documento: ${publicId}`);
    
    // Intentar primero con resource_type 'image' (Cloudinary trata PDFs como imágenes)
    let resultado = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    
    console.log(`📊 Respuesta de Cloudinary para documento (image):`, resultado);
    
    if (resultado.result === 'ok') {
      console.log(`✅ Documento eliminado exitosamente de Cloudinary: ${publicId}`);
      return true;
    }
    
    // Si falla con 'image', intentar con 'raw'
    console.log(`🔄 Intentando con resource_type 'raw' para: ${publicId}`);
    resultado = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    
    console.log(`📊 Respuesta de Cloudinary para documento (raw):`, resultado);
    
    if (resultado.result === 'ok') {
      console.log(`✅ Documento eliminado exitosamente de Cloudinary: ${publicId}`);
      return true;
    } else {
      console.warn(`⚠️ Respuesta inesperada de Cloudinary para documento: ${resultado.result}`);
      return false;
    }
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Invalid public ID')) {
      console.warn(`⚠️ Documento no encontrado en Cloudinary: ${publicId}`);
      return false;
    } else {
      console.error(`❌ Error eliminando documento de Cloudinary ${publicId}:`, error.message);
      return false;
    }
  }
};

// Función para eliminar múltiples archivos de Cloudinary
const eliminarArchivosCloudinary = async (archivos) => {
  if (!archivos || archivos.length === 0) return;
  
  const promesas = archivos.map(async (archivo) => {
    try {
      // Si es un string (URL), extraer el publicId
      if (typeof archivo === 'string') {
        const publicId = extraerPublicIdDeURL(archivo);
        if (publicId) {
          // Determinar si es documento o imagen basándose en la URL
          if (archivo.includes('/documentos/')) {
            await eliminarDocumentoCloudinary(publicId);
          } else {
            await eliminarImagenCloudinary(publicId);
          }
        }
      } 
      // Si es un objeto con publicId y tipo
      else if (archivo.publicId) {
        if (archivo.tipo && ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'].includes(archivo.tipo)) {
          await eliminarDocumentoCloudinary(archivo.publicId);
        } else {
          await eliminarImagenCloudinary(archivo.publicId);
        }
      }
    } catch (error) {
      console.error(`❌ Error eliminando archivo ${archivo}:`, error);
    }
  });
  
  await Promise.all(promesas);
};

// Función auxiliar para extraer publicId de URL de Cloudinary
const extraerPublicIdDeURL = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    console.log(`🔍 Extrayendo publicId de URL: ${url}`);
    
    // Método 1: Buscar después de "upload/" en la URL de Cloudinary (con versión)
    const match = url.match(/\/upload\/v\d+\/(.+?)(?:\?|$)/);
    if (match && match[1]) {
      const publicId = match[1];
      console.log(`✅ PublicId extraído (método 1): ${publicId}`);
      
      // Si es un documento, remover la extensión
      if (publicId.includes('/documentos/')) {
        const publicIdSinExtension = publicId.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip)$/i, '');
        console.log(`🔧 PublicId sin extensión: ${publicIdSinExtension}`);
        return publicIdSinExtension;
      }
      
      return publicId;
    }
    
    // Método 2: Buscar después de "upload/" sin versión
    const match2 = url.match(/\/upload\/(.+?)(?:\?|$)/);
    if (match2 && match2[1]) {
      const publicId = match2[1];
      console.log(`✅ PublicId extraído (método 2): ${publicId}`);
      
      // Si es un documento, remover la extensión
      if (publicId.includes('/documentos/')) {
        const publicIdSinExtension = publicId.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip)$/i, '');
        console.log(`🔧 PublicId sin extensión: ${publicIdSinExtension}`);
        return publicIdSinExtension;
      }
      
      return publicId;
    }
    
    // Método 3: Buscar el patrón específico de recursos-informativos
    if (url.includes('recursos-informativos/')) {
      const match3 = url.match(/recursos-informativos\/(.+?)(?:\?|$)/);
      if (match3 && match3[1]) {
        const publicId = match3[1];
        console.log(`✅ PublicId extraído (método 3): ${publicId}`);
        
        // Si es un documento, remover la extensión
        if (publicId.includes('/documentos/')) {
          const publicIdSinExtension = publicId.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip)$/i, '');
          console.log(`🔧 PublicId sin extensión: ${publicIdSinExtension}`);
          return publicIdSinExtension;
        }
        
        return publicId;
      }
    }
    
    // Método 4: Fallback - extraer la última parte de la URL
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('?')) {
      const publicId = lastPart.split('?')[0];
      console.log(`✅ PublicId extraído (método 4): ${publicId}`);
      
      // Si es un documento, remover la extensión
      if (publicId.includes('/documentos/')) {
        const publicIdSinExtension = publicId.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip)$/i, '');
        console.log(`🔧 PublicId sin extensión: ${publicIdSinExtension}`);
        return publicIdSinExtension;
      }
      
      return publicId;
    }
    
    console.warn(`⚠️ No se pudo extraer publicId de la URL`);
    return null;
  } catch (error) {
    console.warn('❌ Error extrayendo publicId de URL:', error);
    return null;
  }
};

// Función para obtener URL de imagen optimizada
const obtenerImagenOptimizada = (publicId, opciones = {}) => {
  const { width = 800, height = 600, crop = 'fill', gravity = 'auto' } = opciones;
  
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop, gravity },
      { quality: 'auto:good' }
    ]
  });
};

// Función para obtener URL de documento
const obtenerDocumentoURL = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'auto'
  });
};

// Función para obtener URL de vista previa de documento PDF
const obtenerVistaPreviaDocumento = (publicId, opciones = {}) => {
  const { width = 800, height = 600, page = 1 } = opciones;
  
  return cloudinary.url(publicId, {
    resource_type: 'auto',
    transformation: [
      { page: page, width: width, height: height, crop: 'fill' }
    ]
  });
};

// Función para obtener URL de descarga de documento
const obtenerDescargaDocumento = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'auto'
  });
};

module.exports = {
  subirImagenPrincipal,
  subirImagenGaleria,
  subirDocumentoAdjunto,
  eliminarImagenCloudinary,
  eliminarDocumentoCloudinary,
  eliminarArchivosCloudinary,
  extraerPublicIdDeURL,
  obtenerImagenOptimizada,
  obtenerDocumentoURL,
  obtenerVistaPreviaDocumento,
  obtenerDescargaDocumento
};

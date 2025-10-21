const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Subir archivo de postulación a Cloudinary
 * @param {String} filePath - Ruta del archivo local
 * @param {String} usuarioId - ID del usuario que postula
 * @param {String} tipoArchivo - Tipo de archivo (titulo, certificado, identificacion, otro)
 * @returns {Object} { url, publicId } - URL y public_id del archivo en Cloudinary
 */
const subirArchivoPostulacion = async (filePath, usuarioId, tipoArchivo) => {
  try {
    // Determinar el tipo de recurso
    const extension = filePath.split('.').pop().toLowerCase();
    const resourceType = ['pdf', 'doc', 'docx'].includes(extension) ? 'raw' : 'image';

    const publicId = `postulacion_${usuarioId}_${tipoArchivo}_${Date.now()}`;
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'postulaciones',
      public_id: publicId,
      resource_type: resourceType,
      // Para PDFs y documentos
      ...(resourceType === 'raw' && {
        format: extension
      })
    });

    // Eliminar archivo local después de subir
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      publicId: result.public_id
    };

  } catch (error) {
    // Eliminar archivo local en caso de error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Error al subir archivo a Cloudinary: ${error.message}`);
  }
};

/**
 * Eliminar archivo de postulación de Cloudinary
 * @param {String} publicId - Public ID del archivo en Cloudinary
 * @returns {Boolean} - true si se eliminó correctamente
 */
const eliminarArchivoPostulacion = async (publicId) => {
  try {
    // Determinar el tipo de recurso por la extensión en el publicId
    const isPdf = publicId.includes('.pdf');
    const resourceType = isPdf ? 'raw' : 'image';
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return result.result === 'ok';
  } catch (error) {
    console.error('Error al eliminar archivo de Cloudinary:', error);
    return false;
  }
};

/**
 * Eliminar múltiples archivos de postulación
 * @param {Array} archivos - Array de objetos con publicId
 * @returns {Boolean} - true si todos se eliminaron correctamente
 */
const eliminarArchivosPostulacion = async (archivos) => {
  try {
    const promises = archivos.map(archivo => 
      eliminarArchivoPostulacion(archivo.publicId)
    );
    
    const results = await Promise.all(promises);
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error al eliminar archivos de Cloudinary:', error);
    return false;
  }
};

module.exports = {
  subirArchivoPostulacion,
  eliminarArchivoPostulacion,
  eliminarArchivosPostulacion
};


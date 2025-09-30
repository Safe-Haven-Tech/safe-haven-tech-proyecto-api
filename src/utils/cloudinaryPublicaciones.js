const { cloudinary } = require('../config');
const fs = require('fs').promises;

/**
 * Subir archivo multimedia a Cloudinary para publicaciones
 */
const subirArchivoCloudinary = async (filePath, publicacionId, tipoArchivo = 'multimedia', publicIdAnterior = null) => {
  try {
    // Eliminar archivo anterior si existe
    if (publicIdAnterior) {
      await cloudinary.uploader.destroy(publicIdAnterior);
      console.log(`✅ Archivo anterior eliminado: ${publicIdAnterior}`);
    }

    // Determinar el folder según el tipo de archivo
    const folder = tipoArchivo === 'multimedia' ? 'publicaciones/multimedia' : 'publicaciones/adjuntos';
    
    // Generar public_id único
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1E9);
    const publicId = `publicacion_${publicacionId}_${tipoArchivo}_${timestamp}_${randomId}`;

    const resultado = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      public_id: publicId,
      resource_type: 'auto', // Detecta automáticamente el tipo de archivo
      quality: 'auto',
      fetch_format: 'auto'
    });

    // Eliminar archivo temporal
    await fs.unlink(filePath);
    console.log(`✅ Archivo temporal eliminado: ${filePath}`);

    return {
      url: resultado.secure_url,
      publicId: resultado.public_id,
      tipo: resultado.resource_type
    };
  } catch (error) {
    console.error('❌ Error subiendo archivo a Cloudinary:', error);
    throw new Error('No se pudo subir el archivo');
  }
};

/**
 * Subir múltiples archivos multimedia
 */
const subirMultiplesArchivos = async (files, publicacionId, tipoArchivo = 'multimedia') => {
  try {
    const resultados = [];
    
    for (const file of files) {
      const resultado = await subirArchivoCloudinary(file.path, publicacionId, tipoArchivo);
      resultados.push(resultado);
    }
    
    return resultados;
  } catch (error) {
    console.error('❌ Error subiendo múltiples archivos:', error);
    throw new Error('No se pudieron subir los archivos');
  }
};

/**
 * Eliminar archivo de Cloudinary
 */
const eliminarArchivoCloudinary = async (publicId) => {
  if (!publicId) return;
  
  try {
    // Intentar eliminar como imagen primero
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      // Si falla como imagen, intentar como video
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (error) {
        // Si falla como video, intentar como raw (documentos)
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      }
    }
    
    console.log(`✅ Archivo eliminado: ${publicId}`);
  } catch (error) {
    console.error('❌ Error eliminando archivo en Cloudinary:', error);
  }
};

/**
 * Eliminar múltiples archivos de Cloudinary
 */
const eliminarMultiplesArchivos = async (publicIds) => {
  try {
    for (const publicId of publicIds) {
      await eliminarArchivoCloudinary(publicId);
    }
  } catch (error) {
    console.error('❌ Error eliminando múltiples archivos:', error);
  }
};

module.exports = {
  subirArchivoCloudinary,
  subirMultiplesArchivos,
  eliminarArchivoCloudinary,
  eliminarMultiplesArchivos
};

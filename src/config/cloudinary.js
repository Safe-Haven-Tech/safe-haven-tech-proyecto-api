const cloudinary = require('cloudinary').v2;

/**
 * Configuración de Cloudinary para el sistema SafeHaven
 */
const configurarCloudinary = () => {
  try {
    // Verificar variables de entorno requeridas
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('⚠️ Variables de entorno de Cloudinary no configuradas');
      console.warn('Los PDFs se generarán pero no se subirán a la nube');
      return false;
    }

    // Configurar Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    console.log('✅ Cloudinary configurado correctamente');
    console.log(`   Cloud: ${cloudName}`);
    return true;

  } catch (error) {
    console.error('❌ Error configurando Cloudinary:', error);
    return false;
  }
};

/**
 * Verificar conexión con Cloudinary
 */
const verificarConexion = async () => {
  try {
    const resultado = await cloudinary.api.ping();
    if (resultado.status === 'ok') {
      console.log('✅ Conexión con Cloudinary verificada');
      return true;
    } else {
      console.warn('⚠️ Conexión con Cloudinary no disponible');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando conexión con Cloudinary:', error);
    return false;
  }
};

/**
 * Obtener estadísticas de uso de Cloudinary
 */
const obtenerEstadisticas = async () => {
  try {
    const resultado = await cloudinary.api.usage();
    return {
      plan: resultado.plan,
      recursos: resultado.resources,
      almacenamiento: resultado.objects,
      transferencia: resultado.bandwidth,
      requests: resultado.requests
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de Cloudinary:', error);
    return null;
  }
};

/**
 * Eliminar archivo de Cloudinary
 */
const eliminarArchivo = async (publicId) => {
  try {
    const resultado = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    
    if (resultado.result === 'ok') {
      console.log(`✅ Archivo eliminado de Cloudinary: ${publicId}`);
      return true;
    } else {
      console.warn(`⚠️ No se pudo eliminar archivo: ${publicId}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error eliminando archivo ${publicId}:`, error);
    return false;
  }
};

module.exports = {
  configurarCloudinary,
  verificarConexion,
  obtenerEstadisticas,
  eliminarArchivo,
  cloudinary
};

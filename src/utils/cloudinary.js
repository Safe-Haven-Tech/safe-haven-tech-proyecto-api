import { cloudinary } from '../config/index.js';

export const subirImagenCloudinary = async (filePath, usuarioId, publicIdAnterior = null) => {
    try {

      if (publicIdAnterior) {
        await cloudinary.uploader.destroy(publicIdAnterior);
        console.log(`✅ Imagen anterior eliminada: ${publicIdAnterior}`);
      }
      const resultado = await cloudinary.uploader.upload(filePath, {
        folder: 'usuarios',              
        public_id: `usuario_${usuarioId}`, 
        overwrite: true
      });
  
      return resultado.secure_url; // URL pública de la imagen
    } catch (error) {
      console.error('❌ Error subiendo imagen a Cloudinary:', error);
      throw new Error('No se pudo subir la imagen');
    }
  };

  export const eliminarImagenCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(`usuarios/${publicId}`, { resource_type: 'image' });
      console.log(`✅ Imagen eliminada: ${publicId}`);
    } catch (error) {
      console.error('❌ Error eliminando imagen en Cloudinary:', error);
    }
  };
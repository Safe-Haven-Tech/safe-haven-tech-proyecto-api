const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
const uploadDir = path.join(__dirname, '../uploads/publicaciones');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `publicacion_${uniqueSuffix}${extension}`);
  }
});

// Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    // Imágenes
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    // Videos
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogg',
    // Documentos
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'application/rtf': '.rtf'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
    files: 10 // Máximo 10 archivos por request
  }
});

// Middleware para subir archivos multimedia (publicaciones de perfil)
const uploadMultimedia = upload.fields([
  { name: 'multimedia', maxCount: 10 }
]);

// Middleware para subir archivos adjuntos (publicaciones de foro)
const uploadAdjuntos = upload.fields([
  { name: 'archivosAdjuntos', maxCount: 5 }
]);

// Middleware para subir cualquier tipo de archivo
const uploadCualquierArchivo = upload.any();

// Función para eliminar archivo
const eliminarArchivo = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
};

// Función para obtener la URL del archivo
const obtenerUrlArchivo = (filename) => {
  return `/uploads/publicaciones/${filename}`;
};

module.exports = {
  uploadMultimedia,
  uploadAdjuntos,
  uploadCualquierArchivo,
  eliminarArchivo,
  obtenerUrlArchivo
};

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads para chat si no existe
const uploadDir = path.join(__dirname, '../uploads/chat');
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
    cb(null, `chat_${uniqueSuffix}${extension}`);
  }
});

// Filtro de archivos permitidos para chat
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    // Imágenes
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    // Videos (tamaño limitado para chat)
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogg',
    'video/avi': '.avi',
    'video/mov': '.mov',
    'video/wmv': '.wmv',
    'video/3gp': '.3gp',
    // Audio
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/m4a': '.m4a',
    'audio/aac': '.aac',
    'audio/flac': '.flac',
    'audio/webm': '.webm',
    // Documentos
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'application/rtf': '.rtf',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'application/x-7z-compressed': '.7z'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

// Configuración de multer para chat
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo por archivo (menor que publicaciones)
    files: 5 // Máximo 5 archivos por mensaje
  }
});

// Middleware para subir archivos adjuntos en chat
const uploadArchivosChat = upload.fields([
  { name: 'archivosAdjuntos', maxCount: 5 }
]);

// Middleware para subir cualquier archivo en chat
const uploadCualquierArchivoChat = upload.any();

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
  return `/uploads/chat/${filename}`;
};

module.exports = {
  uploadArchivosChat,
  uploadCualquierArchivoChat,
  eliminarArchivo,
  obtenerUrlArchivo
};

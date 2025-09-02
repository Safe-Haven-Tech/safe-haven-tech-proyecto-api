const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta de la carpeta uploads para recursos informativos
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'recursos-informativos');

// Crear carpeta si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuración de almacenamiento para recursos informativos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, extension);
    
    // Limpiar nombre del archivo (solo letras, números y guiones)
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9-]/g, '-');
    
    cb(null, `${cleanName}-${uniqueSuffix}${extension}`);
  }
});

// Filtro para tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  // Tipos de imagen permitidos
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  // Tipos de documento permitidos
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  if (imageTypes.includes(file.mimetype) || documentTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes y documentos.'), false);
  }
};

// Configuración para subida de imágenes
const uploadImagenes = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo para imágenes
    files: 5 // Máximo 5 imágenes por vez
  }
});

// Configuración para subida de documentos
const uploadDocumentos = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (documentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten documentos'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo para documentos
    files: 3 // Máximo 3 documentos por vez
  }
});

// Configuración general para subida de archivos
const uploadArchivos = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 10 // Máximo 10 archivos por vez
  }
});

// Middleware para manejar errores de Multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande',
        detalles: 'El archivo excede el tamaño máximo permitido'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Demasiados archivos',
        detalles: 'Se excedió el número máximo de archivos permitidos'
      });
    }
    return res.status(400).json({
      error: 'Error en la subida de archivos',
      detalles: error.message
    });
  }
  
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      error: 'Tipo de archivo no permitido',
      detalles: 'Solo se permiten imágenes y documentos'
    });
  }
  
  next(error);
};

// Función para obtener la URL del archivo
const getFileUrl = (filename) => {
  return `/uploads/recursos-informativos/${filename}`;
};

// Función para eliminar archivo
const deleteFile = (filename) => {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

// Función para obtener información del archivo
const getFileInfo = (file) => {
  return {
    nombre: file.originalname,
    url: getFileUrl(file.filename),
    tipo: file.mimetype,
    tamaño: file.size,
    extension: path.extname(file.originalname).toLowerCase()
  };
};

module.exports = {
  uploadImagenes,
  uploadDocumentos,
  uploadArchivos,
  handleMulterError,
  getFileUrl,
  deleteFile,
  getFileInfo,
  UPLOADS_DIR
};

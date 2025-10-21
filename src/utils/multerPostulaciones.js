const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio si no existe
const uploadsDir = path.join(__dirname, '../uploads/postulaciones');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'postulacion_' + uniqueSuffix + ext);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Permitir PDFs, imágenes (JPG, PNG) y algunos formatos de documentos
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten: PDF, JPG, PNG, DOC, DOCX'));
  }
};

// Configuración de multer
const uploadPostulacion = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB por archivo
    files: 5 // Máximo 5 archivos
  },
  fileFilter: fileFilter
});

module.exports = {
  uploadPostulacion
};


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta de la carpeta uploads en la raíz del proyecto
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Crear carpeta si no existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${file.fieldname}${ext}`);
  }
});

// Filtro para tipos de archivo válidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes JPEG y PNG'));
  }
};

// Configuración final de Multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo
});

module.exports = upload;
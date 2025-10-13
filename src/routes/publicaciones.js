const express = require('express');
const router = express.Router();
const { autenticarToken, verificarRol } = require('../middlewares/auth');
const { validarPublicacion, validarActualizacionPublicacion, validarComentario, validarDenuncia } = require('../middlewares/validacion');
const { uploadCualquierArchivo, uploadMultimedia, uploadAdjuntos } = require('../utils/multerPublicaciones');

// Middleware para manejar errores de Multer
const handleMulterError = (error, req, res, next) => {
  if (error) {
    console.error('❌ Error en multer:', error);
    return res.status(400).json({
      error: 'Error procesando archivos',
      detalles: error.message
    });
  }
  next();
};

// Importar controladores
const {
  crearPublicacion,
  subirArchivosAPublicacion,
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  actualizarPublicacion,
  eliminarPublicacion,
  darLike,
  quitarLike,
  denunciarPublicacion,
  obtenerComentarios,
  crearComentario,
  eliminarComentario,
  obtenerPublicacionesPorUsuario,
} = require('../controllers/publicacionesController');

// Rutas públicas
router.get('/', obtenerPublicaciones);
router.get('/:id', obtenerPublicacionPorId);
router.get('/:id/comentarios', obtenerComentarios);

// Rutas que requieren autenticación
// Crear publicación (solo JSON, sin archivos)
router.post('/', autenticarToken, validarPublicacion, crearPublicacion);
// Subir archivos a publicación existente
router.post('/:id/upload', autenticarToken, uploadCualquierArchivo, handleMulterError, subirArchivosAPublicacion);
// Actualizar publicación (solo campos de texto, sin archivos)
router.put('/:id', autenticarToken, validarActualizacionPublicacion, actualizarPublicacion);
router.delete('/:id', autenticarToken, eliminarPublicacion);
router.post('/:id/like', autenticarToken, darLike);
router.delete('/:id/like', autenticarToken, quitarLike);
router.post('/:id/denunciar', autenticarToken, validarDenuncia, denunciarPublicacion);
router.post('/:id/comentarios', autenticarToken, validarComentario, crearComentario);

// Eliminar comentario (NUEVA RUTA)
router.delete('/:id/comentarios/:comentarioId', autenticarToken, eliminarComentario);

//Ruta para obtener publicaciones por usuario
router.get('/usuario/:usuarioId', obtenerPublicacionesPorUsuario);

module.exports = router;
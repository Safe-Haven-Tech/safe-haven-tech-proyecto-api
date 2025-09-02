const express = require('express');
const router = express.Router();
const recursosInformativosController = require('../controllers/recursosInformativosController');
const { autenticarToken, verificarRol } = require('../middlewares/auth');
const { validarIdMongo } = require('../middlewares/validacion');
const { multerRecursos } = require('../utils');

// Middleware para manejar errores de Multer
const handleMulterError = (error, req, res, next) => {
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Error en el archivo subido',
      error: error.message
    });
  }
  next();
};

// Rutas públicas
router.get('/', recursosInformativosController.obtenerRecursos);
router.get('/buscar', recursosInformativosController.buscarRecursos);
router.get('/destacados', recursosInformativosController.obtenerRecursosDestacados);
router.get('/buscar/topico/:topico', recursosInformativosController.obtenerRecursosPorTopico);
router.get('/tipo/:tipo', recursosInformativosController.obtenerRecursosPorTipo);
router.get('/estadisticas', recursosInformativosController.obtenerEstadisticas);
router.get('/topicos/disponibles', recursosInformativosController.obtenerTopicosDisponibles);
router.get('/tipos/disponibles', recursosInformativosController.obtenerTiposDisponibles);
router.get('/:id', validarIdMongo, recursosInformativosController.obtenerRecursoPorId);

// Rutas para estadísticas (públicas)
router.post('/:id/visitas', validarIdMongo, recursosInformativosController.incrementarVisitas);
router.post('/:id/descargas', validarIdMongo, recursosInformativosController.incrementarDescargas);
router.post('/:id/compartidos', validarIdMongo, recursosInformativosController.incrementarCompartidos);

// Rutas privadas (requieren autenticación)
router.use(autenticarToken);

// Rutas para administradores y profesionales
router.post('/', verificarRol(['administrador', 'profesional']), recursosInformativosController.crearRecurso);
router.put('/:id', verificarRol(['administrador', 'profesional']), validarIdMongo, recursosInformativosController.actualizarRecurso);
router.delete('/:id', verificarRol(['administrador']), validarIdMongo, recursosInformativosController.eliminarRecurso);

// Rutas para subir archivos (administradores y profesionales)
router.post('/:id/imagen-principal', 
  verificarRol(['administrador', 'profesional']),
  validarIdMongo,
  multerRecursos.uploadImagenes.single('imagen'),
  handleMulterError,
  recursosInformativosController.subirImagenPrincipal
);

router.post('/:id/galeria', 
  verificarRol(['administrador', 'profesional']),
  validarIdMongo,
  multerRecursos.uploadImagenes.array('imagenes', 5),
  handleMulterError,
  recursosInformativosController.subirImagenesGaleria
);

router.post('/:id/documentos', 
  verificarRol(['administrador', 'profesional']),
  validarIdMongo,
  multerRecursos.uploadDocumentos.array('documentos', 3),
  handleMulterError,
  recursosInformativosController.subirDocumentosAdjuntos
);

// Rutas para eliminar archivos (administradores y profesionales)
router.delete('/:id/archivos', 
  verificarRol(['administrador', 'profesional']),
  validarIdMongo,
  recursosInformativosController.eliminarArchivo
);

// Rutas para usuarios autenticados
router.post('/:id/calificar', validarIdMongo, recursosInformativosController.calificarRecurso);

module.exports = router;

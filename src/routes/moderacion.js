const express = require('express');
const router = express.Router();
const { autenticarToken, verificarRol } = require('../middlewares/auth');

// Importar controladores
const {
  moderarPublicacion,
  moderarComentario,
  obtenerDenuncias,
  resolverDenuncia,
  obtenerComentariosModerados,
  getDenunciaById
} = require('../controllers/moderacionController');

// Todas las rutas requieren autenticación y rol de administrador
router.use(autenticarToken);
router.use(verificarRol(['administrador']));

// Rutas de moderación
router.patch('/publicaciones/:id', moderarPublicacion);
router.patch('/comentarios/:id', moderarComentario);
router.get('/denuncias', obtenerDenuncias);
router.get('/denuncias/:id', getDenunciaById);
router.patch('/denuncias/:id', resolverDenuncia);
router.get('/comentarios', obtenerComentariosModerados);

module.exports = router;

const redSocialService = require('../services/redSocialService');
const publicacionesService = require('../services/publicacionesService');
const recursosInformativosService = require('../services/recursosInformativosService');
const { config } = require('../config');

/**
 * @desc    Búsqueda general en el sistema
 * @route   GET /api/buscar
 * @access  Private
 */
const buscarGeneral = async (req, res) => {
  try {
    const { termino, tipo, pagina = 1, limite = 20 } = req.query;
    const usuarioActualId = req.usuario.userId;

    if (!termino) {
      return res.status(400).json({
        error: 'Término de búsqueda requerido',
        detalles: 'Debes proporcionar un término de búsqueda'
      });
    }

    const resultados = {
      usuarios: [],
      publicaciones: [],
      recursos: [],
      totalResultados: 0
    };

    // Buscar usuarios si no se especifica tipo o si se busca específicamente usuarios
    if (!tipo || tipo === 'usuarios' || tipo === 'todo') {
      const usuariosResult = await redSocialService.buscarUsuarios(termino, parseInt(pagina), parseInt(limite));
      resultados.usuarios = usuariosResult.usuarios;
      resultados.totalResultados += usuariosResult.paginacion.totalElementos;
    }

    // Buscar publicaciones si no se especifica tipo o si se busca específicamente publicaciones
    if (!tipo || tipo === 'publicaciones' || tipo === 'todo') {
      const publicacionesResult = await redSocialService.buscarPublicaciones(termino, parseInt(pagina), parseInt(limite));
      resultados.publicaciones = publicacionesResult.publicaciones;
      resultados.totalResultados += publicacionesResult.paginacion.totalElementos;
    }

    // Buscar recursos informativos si no se especifica tipo o si se busca específicamente recursos
    if (!tipo || tipo === 'recursos' || tipo === 'todo') {
      try {
        const recursosResult = await recursosInformativosService.buscarRecursos(termino, parseInt(pagina), parseInt(limite));
        resultados.recursos = recursosResult.recursos || [];
        resultados.totalResultados += recursosResult.paginacion?.totalElementos || 0;
      } catch (error) {
        console.log('⚠️ Error buscando recursos informativos:', error.message);
        // Continuar sin recursos si hay error
      }
    }

    res.json({
      mensaje: 'Búsqueda completada exitosamente',
      termino,
      tipo: tipo || 'todo',
      resultados,
      paginacion: {
        paginaActual: parseInt(pagina),
        elementosPorPagina: parseInt(limite)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en búsqueda general:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al procesar la búsqueda'
    });
  }
};

/**
 * @desc    Obtener sugerencias de búsqueda
 * @route   GET /api/buscar/sugerencias
 * @access  Private
 */
const obtenerSugerencias = async (req, res) => {
  try {
    const { termino, limite = 5 } = req.query;
    const usuarioActualId = req.usuario.userId;

    if (!termino || termino.length < 2) {
      return res.json({
        sugerencias: [],
        mensaje: 'Proporciona al menos 2 caracteres para obtener sugerencias'
      });
    }

    const sugerencias = [];

    // Obtener sugerencias de usuarios
    try {
      const usuariosResult = await redSocialService.buscarUsuarios(termino, 1, parseInt(limite));
      sugerencias.push(...usuariosResult.usuarios.map(usuario => ({
        tipo: 'usuario',
        id: usuario._id,
        titulo: usuario.nombreCompleto,
        subtitulo: `@${usuario.nombreUsuario}`,
        imagen: usuario.fotoPerfil
      })));
    } catch (error) {
      console.log('⚠️ Error obteniendo sugerencias de usuarios:', error.message);
    }

    // Obtener sugerencias de publicaciones
    try {
      const publicacionesResult = await redSocialService.buscarPublicaciones(termino, 1, parseInt(limite));
      sugerencias.push(...publicacionesResult.publicaciones.map(publicacion => ({
        tipo: 'publicacion',
        id: publicacion._id,
        titulo: publicacion.contenido.substring(0, 50) + (publicacion.contenido.length > 50 ? '...' : ''),
        subtitulo: `Por ${publicacion.autorId.nombreCompleto}`,
        imagen: publicacion.autorId.fotoPerfil
      })));
    } catch (error) {
      console.log('⚠️ Error obteniendo sugerencias de publicaciones:', error.message);
    }

    // Obtener sugerencias de recursos informativos
    try {
      const recursosResult = await recursosInformativosService.buscarRecursos(termino, 1, parseInt(limite));
      sugerencias.push(...(recursosResult.recursos || []).map(recurso => ({
        tipo: 'recurso',
        id: recurso._id,
        titulo: recurso.titulo,
        subtitulo: recurso.topico,
        imagen: null
      })));
    } catch (error) {
      console.log('⚠️ Error obteniendo sugerencias de recursos:', error.message);
    }

    // Limitar el número total de sugerencias
    const sugerenciasLimitadas = sugerencias.slice(0, parseInt(limite) * 3);

    res.json({
      sugerencias: sugerenciasLimitadas,
      termino,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo sugerencias:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: config.servidor.entorno === 'development' ? error.message : 'Error al obtener sugerencias'
    });
  }
};

module.exports = {
  buscarGeneral,
  obtenerSugerencias
};

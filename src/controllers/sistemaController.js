const sistemaService = require('../services/sistemaService');

/**
 * @desc    Obtener health check del sistema
 * @route   GET /api/health
 * @access  Public
 */
const obtenerHealthCheck = async (req, res) => {
  try {
    const healthInfo = sistemaService.obtenerHealthCheck();
    
    res.json(healthInfo);
  } catch (error) {
    console.error('❌ Error al obtener health check:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al obtener información del sistema',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc    Obtener información del sistema
 * @route   GET /api/info
 * @access  Public
 */
const obtenerInformacionSistema = async (req, res) => {
  try {
    const infoSistema = sistemaService.obtenerInformacionSistema();
    
    res.json(infoSistema);
  } catch (error) {
    console.error('❌ Error al obtener información del sistema:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al obtener información del sistema',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc    Obtener estadísticas del sistema
 * @route   GET /api/stats
 * @access  Private (solo administradores)
 */
const obtenerEstadisticasSistema = async (req, res) => {
  try {
    const stats = sistemaService.obtenerEstadisticasSistema();
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del sistema:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalles: 'Error al obtener estadísticas del sistema',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  obtenerHealthCheck,
  obtenerInformacionSistema,
  obtenerEstadisticasSistema
};

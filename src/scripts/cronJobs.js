const cron = require('node-cron');
const limpiarMensajesTemporales = require('./limpiarMensajesTemporales');

/**
 * Configurar trabajos programados (cron jobs)
 */

// Limpiar mensajes temporales expirados cada hora
cron.schedule('0 * * * *', () => {
  console.log('🕐 Ejecutando limpieza de mensajes temporales...');
  limpiarMensajesTemporales();
}, {
  scheduled: true,
  timezone: "America/Mexico_City"
});

console.log('✅ Cron jobs configurados correctamente');

module.exports = {
  limpiarMensajesTemporales
};

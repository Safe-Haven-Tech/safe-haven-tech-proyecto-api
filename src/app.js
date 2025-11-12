const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { config } = require('./config');

const app = express();

// Helmet CSP: permitir imágenes desde el backend y orígenes externos si están configurados
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", config.cors?.origen || 'http://localhost:3000'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS global (ajusta origen si quieres restringir)
app.use(cors({
  origin: config.cors?.origen || '*',
  credentials: config.cors?.credenciales || false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*'
}));

// Rate limiter desactivado para desarrollo
// Si necesitas activarlo en producción, descomenta el código siguiente:
/*
const limiter = rateLimit({
  windowMs: config.seguridad.rateLimitWindow,
  max: config.seguridad.rateLimitMax,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    retryAfter: Math.ceil(config.seguridad.rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
console.log(`✅ Rate limiter activo: ${config.seguridad.rateLimitMax} solicitudes cada ${config.seguridad.rateLimitWindow / 1000} segundos`);
*/
console.log('⚠️ Rate limiter desactivado');

const formatoLog = config.servidor.entorno === 'production' ? 'combined' : 'dev';
app.use(morgan(formatoLog, {
  skip: (req, res) => {
    return req.path.startsWith('/_next/') ||
           req.path.startsWith('/favicon.ico') ||
           req.path.startsWith('/.well-known/') ||
           req.path === '/' ||
           req.path.includes('webpack-hmr') ||
           req.path.includes('hot-reload') ||
           req.path.includes('__webpack_hmr');
  }
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (buf.length === 0) return;
    try { JSON.parse(buf); } catch (e) {
      const error = new Error('JSON inválido');
      error.statusCode = 400;
      error.expose = true;
      throw error;
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Filtrar rutas HMR/webpack no deseadas
app.use((req, res, next) => {
  if (req.path.includes('webpack-hmr') ||
      req.path.includes('__webpack_hmr') ||
      req.path.includes('hot-reload') ||
      req.path.includes('hmr') ||
      req.path.includes('hot') ||
      req.path.includes('reload')) {
    return res.status(404).end();
  }
  next();
});

// Servir /uploads con cabeceras que permitan carga desde el front (CORS/CORP)
app.use(
  '/uploads',
  (req, res, next) => {
    const origen = config.cors?.origen || '*';
    res.setHeader('Access-Control-Allow-Origin', origen);
    // permitir que recursos estáticos sean usados desde otros orígenes
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'uploads'))
);

// Importar y usar rutas API (después de servir estáticos públicos)
const routes = require('./routes');
app.use('/api', routes);

// Configurar cron jobs para producción si aplica
if (config.servidor.entorno === 'production') {
  try { require('./scripts/cronJobs'); } catch (e) { /* noop */ }
}

// Logging adicional por petición (filtrado)
app.use((req, res, next) => {
  const shouldSkip = req.path.startsWith('/_next/') ||
                     req.path.startsWith('/favicon.ico') ||
                     req.path.startsWith('/.well-known/') ||
                     req.path === '/' ||
                     req.path.includes('webpack-hmr') ||
                     req.path.includes('hot-reload') ||
                     req.path.includes('__webpack_hmr') ||
                     req.path.includes('hmr') ||
                     req.path.includes('hot') ||
                     req.path.includes('reload');

  if (!shouldSkip) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  }
  next();
});

// Manejo de errores centralizado
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Error de validación', detalles: error.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido', detalles: 'El formato del ID proporcionado no es válido' });
  }

  if (error.code === 11000) {
    return res.status(409).json({ error: 'Conflicto', detalles: 'El recurso ya existe' });
  }

  const statusCode = error.statusCode || 500;
  const message = config.servidor.entorno === 'production'
    ? 'Error interno del servidor'
    : error.message;

  res.status(statusCode).json({
    error: message,
    ...(config.servidor.entorno === 'development' && { stack: error.stack })
  });
});

// Ruta catch-all 404 JSON
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: `La ruta ${req.originalUrl} no existe en este servidor`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
});

app.getServerInfo = () => ({
  entorno: config.servidor.entorno,
  puerto: config.servidor.puerto,
  host: config.servidor.host,
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || '1.0.0'
});

module.exports = app;
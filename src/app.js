const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { config } = require('./config');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: config.cors.origen,
  credentials: config.cors.credenciales,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*'
}));

const limiter = rateLimit({
  windowMs: config.seguridad.rateLimitWindow,
  max: config.seguridad.rateLimitMax,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    retryAfter: Math.ceil(config.seguridad.rateLimitWindow / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

const formatoLog = config.servidor.entorno === 'production' ? 'combined' : 'dev';
app.use(morgan(formatoLog, {
  skip: (req, res) => {
    // Filtrar rutas de frontend y archivos estáticos que no queremos ver
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
   
    if (buf.length === 0) {
      return;
    }
    
    try {
      JSON.parse(buf);
    } catch (e) {
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

// Filtrar rutas de webpack HMR antes de las rutas principales
app.use((req, res, next) => {
  // Bloquear completamente las rutas de webpack HMR
  if (req.path.includes('webpack-hmr') || 
      req.path.includes('__webpack_hmr') || 
      req.path.includes('hot-reload') ||
      req.path.includes('hmr') ||
      req.path.includes('hot') ||
      req.path.includes('reload')) {
    return res.status(404).end(); // Respuesta silenciosa
  }
  next();
});

// Importar y usar rutas
const routes = require('./routes');
app.use('/api', routes);

// Configurar cron jobs para tareas programadas
if (config.servidor.entorno === 'production') {
  require('./scripts/cronJobs');
}

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  // Filtrar logs de frontend, archivos estáticos y rutas no relevantes
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

app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      detalles: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido',
      detalles: 'El formato del ID proporcionado no es válido'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Conflicto',
      detalles: 'El recurso ya existe'
    });
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

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: `La ruta ${req.originalUrl} no existe en este servidor`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
});

app.getServerInfo = () => {
  return {
    entorno: config.servidor.entorno,
    puerto: config.servidor.puerto,
    host: config.servidor.host,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  };
};

module.exports = app;

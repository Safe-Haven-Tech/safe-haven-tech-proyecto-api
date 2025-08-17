const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
  skip: (req, res) => res.statusCode < 400
}));

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'JSON inválido' });
      throw new Error('JSON inválido');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Importar y usar rutas
const routes = require('./routes');
app.use('/api', routes);

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
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

# SafeHaven - Backend API

Backend robusto y seguro para la aplicación SafeHaven, construido con Node.js, Express y MongoDB.

## 🚀 Características

- ✅ **Arquitectura modular** y escalable
- ✅ **Validaciones robustas** en modelos de datos
- ✅ **Sistema de configuración** centralizado por entorno
- ✅ **Conexión optimizada** a MongoDB con Mongoose
- ✅ **Seguridad avanzada** con Helmet, CORS y Rate Limiting
- ✅ **Manejo de errores** robusto y logging detallado
- ✅ **Graceful shutdown** para cierre limpio del servidor
- ✅ **Validación de dependencias** al inicio
- ✅ **Configuración por entorno** (development, production, test)

## 📁 Estructura del Proyecto

```
safehaven-proyecto-backend/
├── src/
│   ├── config/           # Configuración del sistema
│   │   ├── index.js      # Punto de entrada principal
│   │   ├── database.js   # Conexión a MongoDB
│   │   ├── config.js     # Configuraciones específicas
│   │   └── README.md     # Documentación de configuración
│   ├── models/           # Modelos de Mongoose
│   │   └── Usuario.js    # Modelo de usuario con validaciones
│   ├── utils/            # Utilidades y helpers
│   │   └── validaciones.js # Funciones de validación
│   ├── app.js            # Configuración de Express
│   └── index.js          # Punto de entrada de la aplicación
├── env.example           # Ejemplo de variables de entorno
├── package.json          # Dependencias del proyecto
└── README.md             # Este archivo
```

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd safehaven-proyecto-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar .env con tus configuraciones
nano .env  # o usar tu editor preferido
```

### 4. Configurar MongoDB
```bash

# Para MongoDB Atlas
MONGO_CONNECTION=mongodb+srv://usuario:contraseña@cluster.mongodb.net/safehaven
```

## 🚀 Uso

### Desarrollo
```bash
# Iniciar en modo desarrollo
npm run dev

# O directamente
node src/index.js
```

### Producción
```bash
# Construir para producción
npm run build

# Iniciar en producción
npm start
```

### Testing
```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## 🔧 Configuración

### Variables de Entorno Requeridas

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `MONGO_CONNECTION` | URL de conexión a MongoDB | **Requerida** |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PUERTO` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Secreto para JWT | `tu_secreto_super_seguro_aqui` |

### Configuraciones por Entorno

- **Development**: Logs detallados, auto-indexación MongoDB
- **Production**: Logs mínimos, optimizaciones de rendimiento
- **Test**: Configuración específica para testing

## 📊 Estado del Sistema

La aplicación proporciona endpoints para monitorear el estado:

- **Estado del servidor**: Puerto, entorno, host
- **Estado de la base de datos**: Conexión, nombre de BD
- **Configuraciones activas**: JWT, CORS, logging

## 🔒 Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre orígenes
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Validación de datos**: Sanitización y validación robusta
- **JWT**: Autenticación segura con tokens

## 🐛 Solución de Problemas

### Error: "MONGO_CONNECTION no está definida"
1. Verifica que el archivo `.env` existe
2. Confirma que `MONGO_CONNECTION` está configurada
3. Reinicia la aplicación

### Error: "Puerto ya en uso"
1. Cambia el puerto en `.env`
2. Detén otros servicios en ese puerto
3. Usa: `lsof -i :3000` (Linux/Mac) o `netstat -an | findstr :3000` (Windows)

### Error de conexión a MongoDB
1. Verifica que MongoDB esté ejecutándose
2. Confirma la URL de conexión
3. Verifica credenciales si usas autenticación

## 📝 Logs

La aplicación genera logs detallados:

- **Inicio**: Estado del sistema y configuración
- **Requests**: Método, ruta, IP y timestamp
- **Errores**: Stack traces y contexto detallado
- **Base de datos**: Estado de conexión y operaciones

## 🔄 Graceful Shutdown

La aplicación maneja señales del sistema:

- **SIGINT** (Ctrl+C): Cierre limpio
- **SIGTERM**: Cierre por terminación
- **Errores no manejados**: Logging y cierre seguro

## 📈 Monitoreo

### Endpoints de Estado
- `/api/health` - Estado general del sistema
- `/api/status` - Estado detallado de servicios
- `/api/info` - Información del servidor

### Métricas
- Tiempo de respuesta
- Uso de memoria
- Estado de conexiones
- Errores y warnings

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm run test:models
npm run test:config

# Coverage
npm run test:coverage
```

## 📚 Dependencias Principales

- **Express**: Framework web
- **Mongoose**: ODM para MongoDB
- **Helmet**: Seguridad HTTP
- **CORS**: Control de acceso entre orígenes
- **Morgan**: Logging de requests
- **Express Rate Limit**: Protección contra spam

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación en `src/config/README.md`
2. Verifica los logs de la aplicación
3. Abre un issue en el repositorio

---

**SafeHaven Backend** - Construido con ❤️ para proporcionar una API robusta y segura.
# SafeHaven - Backend API

Backend robusto y seguro para la aplicación SafeHaven, construido con Node.js, Express y MongoDB.

## 🚀 Características

- ✅ **Arquitectura modular** y escalable (MVC pattern)
- ✅ **Validaciones robustas** en modelos de datos
- ✅ **Sistema de configuración** centralizado por entorno
- ✅ **Conexión optimizada** a MongoDB con Mongoose
- ✅ **Seguridad avanzada** con Helmet, CORS y autenticación JWT
- ✅ **Manejo de errores** robusto y logging detallado
- ✅ **Cloudinary integration** para almacenamiento de archivos
- ✅ **Generación de PDFs** con Puppeteer
- ✅ **Sistema de encuestas** con recomendaciones personalizadas
- ✅ **Red social** con publicaciones, comentarios y reacciones
- ✅ **Chat en tiempo real** para comunicación usuario-profesional
- ✅ **Sistema de moderación** y denuncias
- ✅ **Recursos informativos** con multimedia
- ✅ **Postulaciones profesionales** con gestión de documentos
- ✅ **Graceful shutdown** para cierre limpio del servidor
- ✅ **Configuración por entorno** (development, production, test)

## 📁 Estructura del Proyecto

```
safehaven-proyecto-backend/
├── src/
│   ├── config/                    # Configuración del sistema
│   │   ├── index.js              # Configuración centralizada
│   │   ├── database.js           # Conexión a MongoDB
│   │   └── cloudinary.js         # Configuración de Cloudinary
│   │
│   ├── models/                    # Modelos de Mongoose
│   │   ├── Usuario.js            # Usuarios del sistema
│   │   ├── Encuesta.js           # Encuestas de autoevaluación
│   │   ├── RespuestaEncuesta.js  # Respuestas con PDFs y recomendaciones
│   │   ├── Publicacion.js        # Publicaciones en red social
│   │   ├── Comentario.js         # Comentarios en publicaciones
│   │   ├── Reaccion.js           # Likes y reacciones
│   │   ├── Chat.js               # Conversaciones de chat
│   │   ├── MensajeChat.js        # Mensajes individuales
│   │   ├── RecursoInformativo.js # Recursos educativos
│   │   ├── PostulacionProfesional.js # Postulaciones de profesionales
│   │   ├── Denuncia.js           # Sistema de denuncias
│   │   └── Notificacion.js       # Notificaciones de usuarios
│   │
│   ├── controllers/               # Controladores de rutas
│   │   ├── authController.js     # Autenticación y registro
│   │   ├── usuariosController.js # Gestión de usuarios
│   │   ├── encuestasController.js # Encuestas y autoevaluaciones
│   │   ├── publicacionesController.js # Red social
│   │   ├── chatController.js     # Chat en tiempo real
│   │   ├── recursosInformativosController.js # Recursos educativos
│   │   ├── postulacionesController.js # Postulaciones profesionales
│   │   ├── moderacionController.js # Moderación y denuncias
│   │   ├── redSocialController.js # Funciones sociales
│   │   ├── busquedaController.js # Búsqueda global
│   │   └── sistemaController.js  # Estado del sistema
│   │
│   ├── services/                  # Lógica de negocio
│   │   ├── authService.js        # Servicios de autenticación
│   │   ├── usuariosService.js    # Servicios de usuarios
│   │   ├── encuestasService.js   # Servicios de encuestas
│   │   ├── publicacionesService.js # Servicios de publicaciones
│   │   ├── chatService.js        # Servicios de chat
│   │   ├── recursosInformativosService.js # Servicios de recursos
│   │   ├── postulacionesService.js # Servicios de postulaciones
│   │   ├── comentariosService.js # Servicios de comentarios
│   │   ├── redSocialService.js   # Servicios de red social
│   │   └── sistemaService.js     # Servicios del sistema
│   │
│   ├── routes/                    # Definición de rutas
│   │   ├── index.js              # Router principal
│   │   ├── auth.js               # Rutas de autenticación
│   │   ├── usuarios.js           # Rutas de usuarios
│   │   ├── encuestas.js          # Rutas de encuestas
│   │   ├── publicaciones.js      # Rutas de publicaciones
│   │   ├── chat.js               # Rutas de chat
│   │   ├── recursosInformativos.js # Rutas de recursos
│   │   ├── postulaciones.js      # Rutas de postulaciones
│   │   ├── moderacion.js         # Rutas de moderación
│   │   ├── redSocial.js          # Rutas de red social
│   │   └── busqueda.js           # Rutas de búsqueda
│   │
│   ├── middlewares/               # Middlewares personalizados
│   │   ├── auth.js               # Autenticación JWT y autorización
│   │   └── validacion.js         # Validaciones de datos
│   │
│   ├── utils/                     # Utilidades y helpers
│   │   ├── pdfGenerator.js       # Generación de PDFs con Puppeteer
│   │   ├── validaciones.js       # Funciones de validación
│   │   ├── validacionesRecursos.js # Validaciones de recursos
│   │   ├── cloudinary.js         # Helpers de Cloudinary
│   │   ├── cloudinaryPostulaciones.js # Cloudinary para postulaciones
│   │   ├── cloudinaryPublicaciones.js # Cloudinary para publicaciones
│   │   ├── cloudinaryRecursos.js # Cloudinary para recursos
│   │   ├── multer.js             # Configuración de Multer
│   │   ├── multerChat.js         # Multer para chat
│   │   ├── multerPostulaciones.js # Multer para postulaciones
│   │   ├── multerPublicaciones.js # Multer para publicaciones
│   │   └── multerRecursos.js     # Multer para recursos
│   │
│   ├── scripts/                   # Scripts de utilidad
│   │   ├── crearUsuarios.js      # Crear usuarios de prueba
│   │   ├── crearUsuarioProfesional.js # Crear profesional
│   │   ├── crearEncuestas.js     # Crear encuestas de prueba
│   │   ├── crearPublicacionesPrueba.js # Crear publicaciones
│   │   ├── crearNotificacionesPrueba.js # Crear notificaciones
│   │   ├── crearDatosPrueba.js   # Datos completos de prueba
│   │   ├── rellenarDatosIniciales.js # Datos iniciales
│   │   ├── rellenarPublicacionesIniciales.js # Publicaciones iniciales
│   │   ├── cronJobs.js           # Tareas programadas
│   │   ├── limpiarMensajesTemporales.js # Limpieza de mensajes
│   │   └── crearMensajesTemporalesValidos.js # Mensajes de prueba
│   │
│   ├── uploads/                   # Archivos subidos localmente
│   │   ├── chat/                 # Archivos de chat
│   │   ├── postulaciones/        # Documentos de postulaciones
│   │   ├── publicaciones/        # Multimedia de publicaciones
│   │   └── recursos-informativos/ # Archivos de recursos
│   │
│   ├── tmp/                       # Archivos temporales
│   ├── app.js                     # Configuración de Express
│   └── index.js                   # Punto de entrada de la aplicación
│
├── env.example                    # Ejemplo de variables de entorno
├── package.json                   # Dependencias del proyecto
└── README.md                      # Este archivo
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
| `JWT_SECRET` | Secreto para JWT | **Requerida** |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | **Requerida** |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud de Cloudinary | **Requerida** |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | **Requerida** |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | **Requerida** |
| `CORS_ORIGIN` | Origen permitido para CORS | `*` |
| `RATE_LIMIT_MAX` | Máximo de solicitudes | `1000` |

### Configuraciones por Entorno

- **Development**: Logs detallados, rate limiting flexible, auto-indexación MongoDB
- **Production**: Logs optimizados, rate limiting estricto, optimizaciones de rendimiento
- **Test**: Configuración específica para testing, base de datos separada

## 🎯 Funcionalidades Principales

### 🔐 Sistema de Autenticación
- Registro de usuarios con validaciones robustas
- Login con JWT (access + refresh tokens)
- Roles: usuario, profesional, administrador
- Middleware de autorización por roles

### 📊 Sistema de Encuestas (Autoevaluaciones)
- Creación y gestión de encuestas por administradores
- **Recomendaciones personalizadas** por rango de puntaje
- Generación automática de PDFs con resultados
- Almacenamiento en Cloudinary
- Historial de respuestas por usuario
- Estadísticas para administradores
- Soporte para usuarios autenticados y anónimos

### 🌐 Red Social
- Publicaciones de perfil y foro
- Publicaciones anónimas
- Sistema de likes y reacciones
- Comentarios en publicaciones
- Sistema de denuncias y moderación
- Notificaciones en tiempo real

### 💬 Chat en Tiempo Real
- Chat privado usuario-profesional
- Soporte para archivos multimedia
- Mensajes temporales auto-eliminables
- Estado de lectura de mensajes

### 📚 Recursos Informativos
- Gestión de artículos educativos
- Soporte para imágenes y documentos
- Categorización por temas
- Sistema de visualizaciones
- Galería de imágenes

### 👨‍⚕️ Sistema de Postulaciones
- Postulación para profesionales
- Gestión de documentos (títulos, certificados, etc.)
- Estados: pendiente, aprobada, rechazada
- Panel de administración

### 🛡️ Moderación y Seguridad
- Sistema de denuncias para publicaciones
- Panel de moderación para administradores
- Ocultación automática de contenido denunciado
- Revisión y aprobación de postulaciones

## 📊 API Endpoints

### 🔐 Autenticación (`/api/auth`)
- `POST /register` - Registro de usuarios
- `POST /login` - Inicio de sesión
- `POST /refresh` - Renovar token
- `POST /logout` - Cerrar sesión

### 👤 Usuarios (`/api/usuarios`)
- `GET /` - Listar usuarios (admin)
- `GET /:id` - Obtener usuario específico
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Eliminar usuario (admin)
- `GET /perfil/:nickname` - Ver perfil público
- `PUT /perfil` - Actualizar perfil

### 📋 Encuestas (`/api/encuestas`)
- `GET /` - Listar encuestas activas
- `GET /:id` - Obtener encuesta específica
- `POST /` - Crear encuesta (admin)
- `PUT /:id` - Actualizar encuesta (admin)
- `POST /:id/iniciar` - Iniciar encuesta
- `POST /:id/completar` - Completar encuesta y obtener PDF
- `GET /respuestas/usuario` - Historial del usuario
- `GET /:id/estadisticas` - Estadísticas (admin)

### 📱 Publicaciones (`/api/publicaciones`)
- `GET /` - Listar publicaciones
- `GET /:id` - Obtener publicación
- `POST /` - Crear publicación
- `PUT /:id` - Actualizar publicación
- `DELETE /:id` - Eliminar publicación
- `POST /:id/like` - Dar like
- `POST /:id/comentar` - Agregar comentario

### 💬 Chat (`/api/chat`)
- `GET /conversaciones` - Listar conversaciones
- `GET /conversaciones/:id/mensajes` - Obtener mensajes
- `POST /conversaciones` - Iniciar conversación
- `POST /mensajes` - Enviar mensaje
- `PUT /mensajes/:id/leer` - Marcar como leído

### 📚 Recursos Informativos (`/api/recursos-informativos`)
- `GET /` - Listar recursos
- `GET /:id` - Obtener recurso
- `POST /` - Crear recurso (admin/profesional)
- `PUT /:id` - Actualizar recurso
- `DELETE /:id` - Eliminar recurso

### 👨‍⚕️ Postulaciones (`/api/postulaciones`)
- `POST /` - Crear postulación
- `GET /mis-postulaciones` - Ver mis postulaciones
- `GET /` - Listar todas (admin)
- `PUT /:id/aprobar` - Aprobar postulación (admin)
- `PUT /:id/rechazar` - Rechazar postulación (admin)

### 🔍 Búsqueda (`/api/buscar`)
- `GET /` - Búsqueda global
- `GET /sugerencias` - Sugerencias de búsqueda

### 🛡️ Moderación (`/api/moderacion`)
- `GET /denuncias` - Listar denuncias (admin)
- `PUT /denuncias/:id/revisar` - Revisar denuncia (admin)
- `POST /publicaciones/:id/denunciar` - Denunciar publicación

## 🔒 Seguridad

- **Helmet**: Headers de seguridad HTTP (CSP, HSTS, etc.)
- **CORS**: Control de acceso entre orígenes configurable
- **Rate Limiting**: Desactivado en desarrollo, configurable en producción
- **Validación de datos**: Sanitización y validación robusta en todos los endpoints
- **JWT**: Autenticación segura con tokens de acceso y refresco
- **Bcrypt**: Hashing seguro de contraseñas (12 rounds)
- **Autorización por roles**: Middleware para verificar permisos
- **Cloudinary**: Almacenamiento seguro de archivos en la nube
- **Validación de archivos**: Multer con restricciones de tamaño y tipo

## 🛠️ Scripts Disponibles

```bash
# Servidor
npm start              # Iniciar servidor en producción
npm run dev            # Iniciar en modo desarrollo (nodemon)

# Datos de prueba
npm run crear-usuarios        # Crear usuarios de ejemplo
npm run crear-profesional     # Crear usuario profesional
npm run crear-encuestas       # Crear encuestas de prueba
npm run crear-datos-prueba    # Crear conjunto completo de datos
npm run setup-testing         # Configurar entorno de testing completo
```

## 🐛 Solución de Problemas

### Error: "MONGO_CONNECTION no está definida"
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Confirma que `MONGO_CONNECTION` está configurada correctamente
3. Reinicia la aplicación

### Error: "Puerto ya en uso"
1. Cambia el puerto en `.env` (variable `PUERTO`)
2. Detén otros servicios en ese puerto
3. Windows: `netstat -an | findstr :3000`
4. Linux/Mac: `lsof -i :3000`

### Error de conexión a MongoDB
1. Verifica que MongoDB esté ejecutándose
2. Confirma la URL de conexión en `MONGO_CONNECTION`
3. Verifica credenciales si usas autenticación
4. Para MongoDB Atlas, verifica que tu IP esté en la whitelist

### Error: "Cloudinary no está configurado"
1. Verifica que las variables de Cloudinary estén en `.env`:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Reinicia el servidor
3. El sistema funcionará pero los archivos se guardarán localmente

### Error al generar PDFs
1. Verifica que Puppeteer esté instalado correctamente
2. En algunos sistemas, puede requerir dependencias adicionales
3. Linux: `sudo apt-get install -y libgbm-dev`
4. Revisa los logs para más detalles

### Error: "Rate Limiting bloqueando solicitudes"
1. El rate limiter está desactivado por defecto en desarrollo
2. Si necesitas ajustarlo, modifica `RATE_LIMIT_MAX` en `.env`
3. Para desarrollo: usa valores altos (1000+)
4. Para producción: usa valores bajos (100-200)

## 🔄 Graceful Shutdown

La aplicación maneja señales del sistema para un cierre limpio:

- **SIGINT** (Ctrl+C): Cierra conexiones activas y guarda estado
- **SIGTERM**: Terminación controlada del proceso
- **Errores no manejados**: Logging detallado antes de cerrar
- **Conexión MongoDB**: Se cierra limpiamente antes de terminar
- **Tareas en progreso**: Se completan antes del cierre

## 📈 Monitoreo y Logs

### Endpoints de Estado
- `GET /api/sistema/health` - Health check básico
- `GET /api/sistema/info` - Información detallada del sistema

### Logs del Sistema
La aplicación genera logs detallados en la consola:

```bash
✅ Servidor iniciado en puerto 3000
✅ MongoDB conectado exitosamente
✅ Cloudinary configurado correctamente
⚠️ Rate limiter desactivado
📥 [2025-11-12T10:30:00] POST /api/auth/login - 192.168.1.1
✅ Usuario autenticado: admin@safehaven.com
💾 Creando encuesta con datos: {...}
📄 PDF subido a Cloudinary: https://...
```

### Logs Filtrados
- Se filtran rutas de frontend (webpack, HMR, etc.)
- Solo se muestran requests de API relevantes
- Timestamps en formato ISO para trazabilidad

### Métricas
- Tiempo de respuesta por endpoint
- Uso de memoria del proceso
- Estado de conexión a MongoDB
- Tamaño de archivos subidos
- Errores y warnings categorizados

## 🧪 Testing y Desarrollo

### Configurar Datos de Prueba
```bash
# Opción 1: Todo en uno
npm run setup-testing

# Opción 2: Paso a paso
npm run crear-usuarios        # Usuarios: admin, profesional, usuarios normales
npm run crear-profesional     # Usuario profesional adicional
npm run crear-encuestas       # Encuestas con recomendaciones personalizadas
npm run crear-datos-prueba    # Publicaciones, comentarios, etc.
```

### Usuarios de Prueba Creados

| Email | Contraseña | Rol | Nickname |
|-------|------------|-----|----------|
| `admin@safehaven.com` | `Admin123!` | administrador | admin_safehaven |
| `profesional@safehaven.com` | `Prof123!` | profesional | dr_mendez |
| `usuario1@safehaven.com` | `User123!` | usuario | maria_rodriguez |

## 💡 Características Especiales

### Recomendaciones Personalizadas en Encuestas
Los administradores pueden configurar umbrales de puntaje con recomendaciones específicas:

```javascript
{
  recomendacionesPorNivel: [
    {
      rangoMin: 0,
      rangoMax: 20,
      nivel: "bajo",           // bajo, medio, alto, crítico
      descripcion: "Estado óptimo",
      recomendaciones: [
        "Mantén tus buenos hábitos",
        "Practica meditación diaria"
      ],
      colorHexadecimal: "#4CAF50"
    }
  ]
}
```

### Generación de PDFs
- PDFs generados automáticamente con Puppeteer
- Almacenados en Cloudinary para acceso permanente
- Incluyen puntaje, nivel de riesgo y recomendaciones
- Formato profesional y descargable

### Sistema de Notificaciones
- Notificaciones en tiempo real
- Tipos: likes, comentarios, mensajes, postulaciones, moderación
- Estado leído/no leído
- Limpieza automática de notificaciones antiguas

### Tareas Programadas (Cron Jobs)
- Limpieza de mensajes temporales vencidos
- Limpieza de notificaciones antiguas (>30 días)
- Optimización de base de datos

## 📚 Dependencias Principales

### Core
- **Express** (^4.21.2): Framework web minimalista
- **Mongoose** (^8.17.1): ODM para MongoDB
- **dotenv** (^17.2.1): Gestión de variables de entorno

### Seguridad
- **Helmet** (^8.1.0): Headers de seguridad HTTP
- **CORS** (^2.8.5): Control de acceso entre orígenes
- **Express Rate Limit** (^8.0.1): Protección contra spam
- **bcrypt** (^6.0.0): Hashing de contraseñas
- **jsonwebtoken** (^9.0.2): Autenticación JWT

### Archivos y Multimedia
- **Cloudinary** (^2.7.0): Almacenamiento en la nube
- **Multer** (^2.0.2): Manejo de archivos multipart
- **Puppeteer** (^24.17.0): Generación de PDFs

### Utilidades
- **Morgan** (^1.10.1): Logging de requests HTTP
- **node-cron** (^4.2.1): Tareas programadas

### Desarrollo
- **nodemon** (^3.1.10): Auto-reload en desarrollo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🏗️ Arquitectura

### Patrón MVC (Modelo-Vista-Controlador)

```
Request → Middleware → Router → Controller → Service → Model → Database
                                      ↓
                                  Response
```

### Flujo de Autenticación
```
Login → authController → authService → Usuario.findOne()
     → Generar JWT → Devolver tokens
     → Frontend guarda en localStorage
     → Siguientes requests incluyen: Authorization: Bearer <token>
     → Middleware auth.js valida → Permite acceso
```

### Flujo de Encuestas con Recomendaciones
```
Admin crea encuesta con umbrales personalizados
     ↓
Usuario completa encuesta
     ↓
Sistema calcula puntaje
     ↓
Busca nivel según rango (personalizado o por defecto)
     ↓
Genera PDF con Puppeteer
     ↓
Sube a Cloudinary
     ↓
Devuelve URL al usuario
```

## 📋 Modelos de Datos Principales

### Usuario
- Roles: usuario, profesional, administrador
- Perfil completo con datos personales
- Configuración de privacidad
- Historial de actividades

### Encuesta
- Preguntas tipo escala
- Categorías: salud_mental, bienestar, estrés, ansiedad, depresión
- **Recomendaciones personalizadas** por rango de puntaje
- Versionado

### RespuestaEncuesta
- Vinculada a usuario y encuesta
- Copia de la encuesta (snapshot)
- Puntaje total calculado
- Nivel de riesgo determinado
- Recomendaciones generadas (personalizadas o por defecto)
- PDF almacenado en Cloudinary

### Publicacion
- Tipos: foro, perfil
- Soporte para anonimato
- Multimedia (imágenes, archivos)
- Sistema de likes
- Moderación

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa la sección **🐛 Solución de Problemas**
2. Verifica los logs de la aplicación (muy descriptivos)
3. Revisa las variables de entorno en `.env`
4. Consulta los ejemplos en `env.example`
5. Ejecuta los scripts de prueba para verificar el sistema

## 🔄 Workflow Recomendado para Desarrollo

1. **Configuración inicial:**
   ```bash
   npm install
   cp env.example .env
   # Editar .env con tus credenciales
   ```

2. **Primera ejecución:**
   ```bash
   npm run crear-usuarios
   npm run crear-encuestas
   npm run dev
   ```

3. **Desarrollo:**
   - El servidor se auto-recarga con nodemon
   - Los logs muestran cada request en tiempo real
   - Usa Postman/Thunder Client para probar endpoints

4. **Testing:**
   ```bash
   npm run crear-datos-prueba
   # Prueba con los usuarios creados
   ```

---

**SafeHaven Backend** - Construido con ❤️ para proporcionar una plataforma segura de salud mental y bienestar.
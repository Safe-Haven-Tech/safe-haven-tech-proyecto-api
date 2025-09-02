const mongoose = require('mongoose');
const RecursoInformativo = require('../models/RecursoInformativo');
const Usuario = require('../models/Usuario');
require('dotenv').config();

// Tópicos disponibles como array simple
const TOPICOS_DISPONIBLES = [
  'Salud Mental',
  'Violencia Doméstica',
  'Acoso Escolar',
  'Acoso Laboral',
  'Ciberacoso',
  'Acoso Sexual',
  'Autoestima',
  'Relaciones Saludables',
  'Estrés y Ansiedad',
  'Bienestar Emocional'
];

// Datos de recursos informativos de ejemplo simplificados
const recursosIniciales = [
  {
    titulo: 'Guía Completa para Identificar el Acoso Escolar',
    contenido: `El acoso escolar es un problema serio que afecta a millones de estudiantes en todo el mundo. Esta guía te ayudará a identificar las señales de alerta y tomar acción.

    **Señales de que un niño está siendo acosado:**
    - Cambios en el comportamiento o estado de ánimo
    - Pérdida de interés en actividades que antes disfrutaba
    - Problemas para dormir o pesadillas
    - Quejas físicas como dolores de cabeza o estómago
    - Disminución del rendimiento académico
    
    **Qué hacer si tu hijo está siendo acosado:**
    1. Mantén la calma y escucha sin juzgar
    2. Documenta todos los incidentes
    3. Contacta a la escuela inmediatamente
    4. Busca apoyo profesional si es necesario
    5. Enséñale estrategias de asertividad
    
    **Recursos adicionales:**
    - Líneas de ayuda disponibles 24/7
    - Grupos de apoyo para padres
    - Materiales educativos para escuelas`,
    contenidoHTML: `<h2>Guía Completa para Identificar el Acoso Escolar</h2>
    <p>El acoso escolar es un problema serio que afecta a millones de estudiantes en todo el mundo. Esta guía te ayudará a identificar las señales de alerta y tomar acción.</p>
    
    <h3>Señales de que un niño está siendo acosado:</h3>
    <ul>
      <li>Cambios en el comportamiento o estado de ánimo</li>
      <li>Pérdida de interés en actividades que antes disfrutaba</li>
      <li>Problemas para dormir o pesadillas</li>
      <li>Quejas físicas como dolores de cabeza o estómago</li>
      <li>Disminución del rendimiento académico</li>
    </ul>
    
    <h3>Qué hacer si tu hijo está siendo acosado:</h3>
    <ol>
      <li>Mantén la calma y escucha sin juzgar</li>
      <li>Documenta todos los incidentes</li>
      <li>Contacta a la escuela inmediatamente</li>
      <li>Busca apoyo profesional si es necesario</li>
      <li>Enséñale estrategias de asertividad</li>
    </ol>
    
    <h3>Recursos adicionales:</h3>
    <ul>
      <li>Líneas de ayuda disponibles 24/7</li>
      <li>Grupos de apoyo para padres</li>
      <li>Materiales educativos para escuelas</li>
    </ul>`,
    resumen: 'Una guía completa para padres y educadores sobre cómo identificar y abordar el acoso escolar',
    topicos: ['Acoso Escolar', 'Educación'],
    fuente: 'Centro Nacional de Prevención del Acoso',
    descripcion: 'Una guía completa para padres y educadores sobre cómo identificar y prevenir el acoso escolar',
    tipo: 'guia',
    etiquetas: ['bullying', 'escuela', 'prevención', 'padres', 'educadores'],
    destacado: true
  },
  {
    titulo: 'Cómo Construir una Autoestima Sana',
    contenido: `La autoestima es la base de nuestro bienestar emocional. Una autoestima saludable nos permite enfrentar los desafíos de la vida con confianza y resiliencia.

    **Pilares de una autoestima sana:**
    
    **1. Autoconocimiento**
    - Reconoce tus fortalezas y debilidades
    - Acepta que eres único e imperfecto
    - Identifica tus valores y creencias
    
    **2. Autocompasión**
    - Trátate con la misma bondad que tratarías a un amigo
    - Perdónate por los errores del pasado
    - Celebra tus logros, por pequeños que sean
    
    **3. Autocuidado**
    - Prioriza tus necesidades físicas y emocionales
    - Establece límites saludables
    - Dedica tiempo a actividades que te gusten
    
    **4. Crecimiento personal**
    - Establece metas realistas y alcanzables
    - Aprende de los fracasos
    - Busca oportunidades de desarrollo
    
    **Ejercicios prácticos:**
    - Escribe tres cosas que te gusten de ti cada día
    - Practica la gratitud diariamente
    - Rodéate de personas que te apoyen
    - Aprende a decir "no" cuando sea necesario`,
    contenidoHTML: `<h2>Cómo Construir una Autoestima Sana</h2>
    <p>La autoestima es la base de nuestro bienestar emocional. Una autoestima saludable nos permite enfrentar los desafíos de la vida con confianza y resiliencia.</p>
    
    <h3>Pilares de una autoestima sana:</h3>
    
    <h4>1. Autoconocimiento</h4>
    <ul>
      <li>Reconoce tus fortalezas y debilidades</li>
      <li>Acepta que eres único e imperfecto</li>
      <li>Identifica tus valores y creencias</li>
    </ul>
    
    <h4>2. Autocompasión</h4>
    <ul>
      <li>Trátate con la misma bondad que tratarías a un amigo</li>
      <li>Perdónate por los errores del pasado</li>
      <li>Celebra tus logros, por pequeños que sean</li>
    </ul>
    
    <h4>3. Autocuidado</h4>
    <ul>
      <li>Prioriza tus necesidades físicas y emocionales</li>
      <li>Establece límites saludables</li>
      <li>Dedica tiempo a actividades que te gusten</li>
    </ul>
    
    <h4>4. Crecimiento personal</h4>
    <ul>
      <li>Establece metas realistas y alcanzables</li>
      <li>Aprende de los fracasos</li>
      <li>Busca oportunidades de desarrollo</li>
    </ul>
    
    <h3>Ejercicios prácticos:</h3>
    <ul>
      <li>Escribe tres cosas que te gusten de ti cada día</li>
      <li>Practica la gratitud diariamente</li>
      <li>Rodéate de personas que te apoyen</li>
      <li>Aprende a decir "no" cuando sea necesario</li>
    </ul>`,
    resumen: 'Estrategias prácticas para desarrollar y mantener una autoestima saludable',
    topicos: ['Autoestima', 'Bienestar Emocional'],
    fuente: 'Instituto de Psicología Positiva',
    descripcion: 'Estrategias prácticas para desarrollar y mantener una autoestima saludable',
    tipo: 'articulo',
    etiquetas: ['autoestima', 'bienestar', 'psicología', 'crecimiento', 'autocuidado'],
    destacado: true
  },
  {
    titulo: 'Protocolo de Actuación ante Violencia Doméstica',
    contenido: `La violencia doméstica es un delito grave que requiere acción inmediata. Este protocolo te guiará paso a paso para protegerte y buscar ayuda.

    **En caso de emergencia:**
    - Llama al 911 o al número de emergencia local
    - Si es seguro, sal de la casa inmediatamente
    - Lleva solo lo esencial (documentos, dinero, teléfono)
    
    **Plan de seguridad:**
    1. **Preparación:**
       - Ten un teléfono cargado siempre
       - Guarda dinero en efectivo en un lugar seguro
       - Ten copias de documentos importantes
       - Identifica una ruta de escape
    
    2. **Durante un incidente:**
       - Mantén la calma
       - No confrontes al agresor
       - Busca una salida segura
       - Llama a la policía
    
    3. **Después del incidente:**
       - Busca un lugar seguro
       - Documenta las lesiones
       - Contacta a servicios de apoyo
       - Considera obtener una orden de protección
    
    **Recursos de ayuda:**
    - Refugios para víctimas de violencia
    - Líneas de crisis 24/7
    - Asesoría legal gratuita
    - Grupos de apoyo`,
    contenidoHTML: `<h2>Protocolo de Actuación ante Violencia Doméstica</h2>
    <p>La violencia doméstica es un delito grave que requiere acción inmediata. Este protocolo te guiará paso a paso para protegerte y buscar ayuda.</p>
    
    <h3>En caso de emergencia:</h3>
    <ul>
      <li>Llama al 911 o al número de emergencia local</li>
      <li>Si es seguro, sal de la casa inmediatamente</li>
      <li>Lleva solo lo esencial (documentos, dinero, teléfono)</li>
    </ul>
    
    <h3>Plan de seguridad:</h3>
    
    <h4>1. Preparación:</h4>
    <ul>
      <li>Ten un teléfono cargado siempre</li>
      <li>Guarda dinero en efectivo en un lugar seguro</li>
      <li>Ten copias de documentos importantes</li>
      <li>Identifica una ruta de escape</li>
    </ul>
    
    <h4>2. Durante un incidente:</h4>
    <ul>
      <li>Mantén la calma</li>
      <li>No confrontes al agresor</li>
      <li>Busca una salida segura</li>
      <li>Llama a la policía</li>
    </ul>
    
    <h4>3. Después del incidente:</h4>
    <ul>
      <li>Busca un lugar seguro</li>
      <li>Documenta las lesiones</li>
      <li>Contacta a servicios de apoyo</li>
      <li>Considera obtener una orden de protección</li>
    </ul>
    
    <h3>Recursos de ayuda:</h3>
    <ul>
      <li>Refugios para víctimas de violencia</li>
      <li>Líneas de crisis 24/7</li>
      <li>Asesoría legal gratuita</li>
      <li>Grupos de apoyo</li>
    </ul>`,
    resumen: 'Protocolo completo de actuación para víctimas de violencia doméstica',
    topicos: ['Violencia Doméstica', 'Seguridad'],
    fuente: 'Oficina de Violencia Doméstica del Estado',
    descripcion: 'Protocolo completo de actuación para víctimas de violencia doméstica',
    tipo: 'manual',
    etiquetas: ['violencia', 'doméstica', 'emergencia', 'seguridad', 'ayuda'],
    destacado: true
  },
  {
    titulo: 'Prevención del Ciberacoso en Redes Sociales',
    contenido: `El ciberacoso es una forma moderna de acoso que puede tener consecuencias devastadoras. Aprende a protegerte y proteger a otros en el mundo digital.

    **¿Qué es el ciberacoso?**
    El ciberacoso incluye:
    - Envío de mensajes amenazantes o hirientes
    - Difusión de información privada sin consentimiento
    - Creación de perfiles falsos para acosar
    - Exclusión intencional de grupos en línea
    - Envío de contenido inapropiado
    
    **Estrategias de prevención:**
    
    **1. Configuración de privacidad:**
    - Revisa y ajusta la configuración de privacidad
    - Limita quién puede ver tu información personal
    - No aceptes solicitudes de desconocidos
    
    **2. Comportamiento en línea:**
    - Piensa antes de publicar
    - No compartas información personal
    - Respeta a otros usuarios
    - Reporta contenido inapropiado
    
    **3. Si eres víctima:**
    - No respondas al acosador
    - Guarda evidencia (capturas de pantalla)
    - Bloquea al acosador
    - Reporta el incidente a la plataforma
    - Busca apoyo emocional
    
    **Recursos de ayuda:**
    - Líneas de ayuda especializadas
    - Herramientas de denuncia en redes sociales
    - Grupos de apoyo en línea`,
    contenidoHTML: `<h2>Prevención del Ciberacoso en Redes Sociales</h2>
    <p>El ciberacoso es una forma moderna de acoso que puede tener consecuencias devastadoras. Aprende a protegerte y proteger a otros en el mundo digital.</p>
    
    <h3>¿Qué es el ciberacoso?</h3>
    <p>El ciberacoso incluye:</p>
    <ul>
      <li>Envío de mensajes amenazantes o hirientes</li>
      <li>Difusión de información privada sin consentimiento</li>
      <li>Creación de perfiles falsos para acosar</li>
      <li>Exclusión intencional de grupos en línea</li>
      <li>Envío de contenido inapropiado</li>
    </ul>
    
    <h3>Estrategias de prevención:</h3>
    
    <h4>1. Configuración de privacidad:</h4>
    <ul>
      <li>Revisa y ajusta la configuración de privacidad</li>
      <li>Limita quién puede ver tu información personal</li>
      <li>No aceptes solicitudes de desconocidos</li>
    </ul>
    
    <h4>2. Comportamiento en línea:</h4>
    <ul>
      <li>Piensa antes de publicar</li>
      <li>No compartas información personal</li>
      <li>Respeta a otros usuarios</li>
      <li>Reporta contenido inapropiado</li>
    </ul>
    
    <h4>3. Si eres víctima:</h4>
    <ul>
      <li>No respondas al acosador</li>
      <li>Guarda evidencia (capturas de pantalla)</li>
      <li>Bloquea al acosador</li>
      <li>Reporta el incidente a la plataforma</li>
      <li>Busca apoyo emocional</li>
    </ul>
    
    <h3>Recursos de ayuda:</h3>
    <ul>
      <li>Líneas de ayuda especializadas</li>
      <li>Herramientas de denuncia en redes sociales</li>
      <li>Grupos de apoyo en línea</li>
    </ul>`,
    resumen: 'Guía completa para prevenir y combatir el ciberacoso en redes sociales',
    topicos: ['Ciberacoso', 'Tecnología'],
    fuente: 'Centro de Seguridad Digital',
    descripcion: 'Guía completa para prevenir y combatir el ciberacoso en redes sociales',
    tipo: 'guia',
    etiquetas: ['ciberacoso', 'redes sociales', 'seguridad', 'prevención', 'digital'],
    destacado: false
  },
  {
    titulo: 'Construyendo Relaciones Saludables',
    contenido: `Las relaciones saludables son fundamentales para nuestro bienestar emocional. Aprende a identificar y cultivar relaciones que te enriquezcan.

    **Características de una relación saludable:**
    
    **Respeto mutuo:**
    - Ambos valoran las opiniones del otro
    - No hay insultos ni humillaciones
    - Se respetan los límites personales
    
    **Comunicación abierta:**
    - Pueden hablar honestamente sobre sentimientos
    - Resuelven conflictos de manera constructiva
    - Se escuchan mutuamente sin interrumpir
    
    **Confianza:**
    - No hay celos excesivos o control
    - Pueden confiar en la palabra del otro
    - No hay secretos que dañen la relación
    
    **Apoyo mutuo:**
    - Se apoyan en los momentos difíciles
    - Celebran los logros del otro
    - Permiten el crecimiento individual
    
    **Señales de alerta:**
    - Control excesivo
    - Aislamiento de amigos y familia
    - Críticas constantes
    - Manipulación emocional
    - Violencia física o verbal
    
    **Cómo construir relaciones saludables:**
    1. Establece límites claros
    2. Comunica tus necesidades
    3. Practica la empatía
    4. Invierte tiempo en la relación
    5. Busca ayuda profesional si es necesario`,
    contenidoHTML: `<h2>Construyendo Relaciones Saludables</h2>
    <p>Las relaciones saludables son fundamentales para nuestro bienestar emocional. Aprende a identificar y cultivar relaciones que te enriquezcan.</p>
    
    <h3>Características de una relación saludable:</h3>
    
    <h4>Respeto mutuo:</h4>
    <ul>
      <li>Ambos valoran las opiniones del otro</li>
      <li>No hay insultos ni humillaciones</li>
      <li>Se respetan los límites personales</li>
    </ul>
    
    <h4>Comunicación abierta:</h4>
    <ul>
      <li>Pueden hablar honestamente sobre sentimientos</li>
      <li>Resuelven conflictos de manera constructiva</li>
      <li>Se escuchan mutuamente sin interrumpir</li>
    </ul>
    
    <h4>Confianza:</h4>
    <ul>
      <li>No hay celos excesivos o control</li>
      <li>Pueden confiar en la palabra del otro</li>
      <li>No hay secretos que dañen la relación</li>
    </ul>
    
    <h4>Apoyo mutuo:</h4>
    <ul>
      <li>Se apoyan en los momentos difíciles</li>
      <li>Celebran los logros del otro</li>
      <li>Permiten el crecimiento individual</li>
    </ul>
    
    <h3>Señales de alerta:</h3>
    <ul>
      <li>Control excesivo</li>
      <li>Aislamiento de amigos y familia</li>
      <li>Críticas constantes</li>
      <li>Manipulación emocional</li>
      <li>Violencia física o verbal</li>
    </ul>
    
    <h3>Cómo construir relaciones saludables:</h3>
    <ol>
      <li>Establece límites claros</li>
      <li>Comunica tus necesidades</li>
      <li>Practica la empatía</li>
      <li>Invierte tiempo en la relación</li>
      <li>Busca ayuda profesional si es necesario</li>
    </ol>`,
    resumen: 'Guía para construir y mantener relaciones saludables y respetuosas',
    topicos: ['Relaciones Saludables', 'Bienestar Emocional'],
    fuente: 'Centro de Terapia de Parejas',
    descripcion: 'Guía para construir y mantener relaciones saludables y respetuosas',
    tipo: 'articulo',
    etiquetas: ['relaciones', 'salud', 'comunicación', 'confianza', 'límites'],
    destacado: false
  },
  {
    titulo: 'Manejo del Estrés en Tiempos Difíciles',
    contenido: `El estrés es una respuesta natural del cuerpo, pero cuando se vuelve crónico puede afectar nuestra salud física y mental. Aprende técnicas efectivas para manejarlo.

    **Técnicas de relajación:**
    - Respiración profunda y consciente
    - Meditación mindfulness
    - Ejercicios de relajación muscular progresiva
    - Yoga y estiramientos suaves
    
    **Estrategias de afrontamiento:**
    - Identifica tus desencadenantes de estrés
    - Establece límites claros
    - Practica la gestión del tiempo
    - Busca apoyo social
    
    **Autocuidado diario:**
    - Mantén una rutina regular
    - Prioriza el sueño de calidad
    - Aliméntate de manera saludable
    - Haz ejercicio regularmente`,
    contenidoHTML: `<h2>Manejo del Estrés en Tiempos Difíciles</h2>
    <p>El estrés es una respuesta natural del cuerpo, pero cuando se vuelve crónico puede afectar nuestra salud física y mental. Aprende técnicas efectivas para manejarlo.</p>
    
    <h3>Técnicas de relajación:</h3>
    <ul>
      <li>Respiración profunda y consciente</li>
      <li>Meditación mindfulness</li>
      <li>Ejercicios de relajación muscular progresiva</li>
      <li>Yoga y estiramientos suaves</li>
    </ul>
    
    <h3>Estrategias de afrontamiento:</h3>
    <ul>
      <li>Identifica tus desencadenantes de estrés</li>
      <li>Establece límites claros</li>
      <li>Practica la gestión del tiempo</li>
      <li>Busca apoyo social</li>
    </ul>
    
    <h3>Autocuidado diario:</h3>
    <ul>
      <li>Mantén una rutina regular</li>
      <li>Prioriza el sueño de calidad</li>
      <li>Aliméntate de manera saludable</li>
      <li>Haz ejercicio regularmente</li>
    </ul>`,
    resumen: 'Técnicas efectivas para manejar el estrés y mantener el bienestar mental',
    topicos: ['Estrés y Ansiedad', 'Salud Mental'],
    fuente: 'Instituto de Salud Mental',
    descripcion: 'Técnicas efectivas para manejar el estrés y mantener el bienestar mental',
    tipo: 'articulo',
    etiquetas: ['estrés', 'salud mental', 'relajación', 'autocuidado', 'bienestar'],
    destacado: false
  },
  {
    titulo: 'Guía de Prevención del Acoso Laboral',
    contenido: `El acoso laboral puede tener consecuencias devastadoras en la salud mental y el rendimiento profesional. Conoce tus derechos y cómo protegerte.

    **Formas de acoso laboral:**
    - Críticas constantes e injustificadas
    - Aislamiento social en el trabajo
    - Asignación de tareas imposibles
    - Difusión de rumores falsos
    - Intimidación y amenazas
    
    **Qué hacer si eres víctima:**
    1. Documenta todos los incidentes
    2. Busca testigos y apoyo
    3. Reporta a recursos humanos
    4. Considera asesoría legal
    5. Cuida tu salud mental
    
    **Prevención:**
    - Conoce las políticas de la empresa
    - Mantén comunicación profesional
    - Establece límites claros
    - Busca apoyo cuando sea necesario`,
    contenidoHTML: `<h2>Guía de Prevención del Acoso Laboral</h2>
    <p>El acoso laboral puede tener consecuencias devastadoras en la salud mental y el rendimiento profesional. Conoce tus derechos y cómo protegerte.</p>
    
    <h3>Formas de acoso laboral:</h3>
    <ul>
      <li>Críticas constantes e injustificadas</li>
      <li>Aislamiento social en el trabajo</li>
      <li>Asignación de tareas imposibles</li>
      <li>Difusión de rumores falsos</li>
      <li>Intimidación y amenazas</li>
    </ul>
    
    <h3>Qué hacer si eres víctima:</h3>
    <ol>
      <li>Documenta todos los incidentes</li>
      <li>Busca testigos y apoyo</li>
      <li>Reporta a recursos humanos</li>
      <li>Considera asesoría legal</li>
      <li>Cuida tu salud mental</li>
    </ol>
    
    <h3>Prevención:</h3>
    <ul>
      <li>Conoce las políticas de la empresa</li>
      <li>Mantén comunicación profesional</li>
      <li>Establece límites claros</li>
      <li>Busca apoyo cuando sea necesario</li>
    </ul>`,
    resumen: 'Guía completa para prevenir y abordar el acoso laboral',
    topicos: ['Acoso Laboral', 'Trabajo'],
    fuente: 'Oficina de Derechos Laborales',
    descripcion: 'Guía completa para prevenir y abordar el acoso laboral',
    tipo: 'manual',
    etiquetas: ['acoso laboral', 'mobbing', 'derechos laborales', 'prevención', 'trabajo'],
    destacado: false
  }
];

// Función para conectar a la base de datos
const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION || 'mongodb://localhost:27017/safehaven');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función para limpiar índices problemáticos
const limpiarIndicesProblematicos = async () => {
  try {
    console.log('\n🔧 Limpiando índices problemáticos...');
    const db = mongoose.connection.db;
    const collection = db.collection('recursoinformativos');

    // Lista de índices problemáticos que ya no existen en el modelo
    const indicesProblematicos = ['slug_1', 'estado_1', 'fechaPublicacion_1', 'permitirComentarios_1'];
    
    for (const indice of indicesProblematicos) {
      try {
        await collection.dropIndex(indice);
        console.log(`✅ Índice ${indice} eliminado correctamente`);
      } catch (error) {
        if (error.message.includes('index not found')) {
          console.log(`ℹ️  El índice ${indice} ya no existe`);
        } else {
          console.log(`❌ Error eliminando índice ${indice}:`, error.message);
        }
      }
    }
    
    console.log('✅ Limpieza de índices completada');
  } catch (error) {
    console.error('❌ Error durante la limpieza de índices:', error.message);
  }
};

// Función para crear un usuario administrador si no existe
const crearUsuarioAdmin = async () => {
  try {
    let admin = await Usuario.findOne({ rol: 'administrador' });
    
    if (!admin) {
      admin = new Usuario({
        nombreUsuario: 'admin_safehaven',
        correo: 'admin@safehaven.com',
        contraseña: 'Admin123!',
        rol: 'administrador',
        nombreCompleto: 'Administrador SafeHaven',
        fechaNacimiento: new Date('1990-01-01'),
        activo: true
      });
      
      await admin.save();
      console.log('✅ Usuario administrador creado');
    } else {
      console.log('✅ Usuario administrador ya existe');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
    throw error;
  }
};

// Función para crear recursos informativos
const crearRecursos = async (admin) => {
  try {
    console.log('\n📖 Creando recursos informativos...');
    
    for (const datosRecurso of recursosIniciales) {
      const recursoExistente = await RecursoInformativo.findOne({ 
        titulo: { $regex: new RegExp(`^${datosRecurso.titulo}$`, 'i') } 
      });
      
      if (!recursoExistente) {
        // Preparar datos del recurso con campos adicionales
        const datosCompletos = {
          ...datosRecurso,
          añadidoPor: admin._id,
          // Campos de archivos (inicialmente vacíos)
          imagenPrincipal: null,
          galeria: [],
          archivosAdjuntos: [],
          // Campos de calificación (inicialmente vacíos)
          calificacion: {
            promedio: 0,
            totalVotos: 0,
            votos: []
          },
          // Campos de estadísticas (inicialmente en 0)
          visitas: 0,
          descargas: 0,
          compartidos: 0
        };
        
        const nuevoRecurso = new RecursoInformativo(datosCompletos);
        
        await nuevoRecurso.save();
        console.log(`✅ Recurso creado: ${datosRecurso.titulo}`);
      } else {
        console.log(`⏭️  Recurso ya existe: ${datosRecurso.titulo}`);
      }
    }
    
    console.log('✅ Recursos procesados correctamente');
  } catch (error) {
    console.error('❌ Error creando recursos:', error.message);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    console.log('🚀 Iniciando rellenado de datos iniciales...\n');
    
    // Conectar a la base de datos
    await conectarDB();
    
    // Limpiar índices problemáticos
    await limpiarIndicesProblematicos();
    
    // Crear usuario administrador
    const admin = await crearUsuarioAdmin();
    
    // Crear recursos informativos
    await crearRecursos(admin);
    
    console.log('\n🎉 ¡Datos iniciales rellenados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- Usuario administrador: ${admin.nombreUsuario}`);
    console.log(`- Recursos creados: ${recursosIniciales.length}`);
    
    // Mostrar estadísticas de los recursos
    const recursosCreados = await RecursoInformativo.find();
    const recursosDestacados = recursosCreados.filter(r => r.destacado).length;
    
    console.log('\n📚 Estadísticas de Recursos:');
    console.log(`- Total: ${recursosCreados.length}`);
    console.log(`- Destacados: ${recursosDestacados}`);
    
    console.log('\n🏷️ Tópicos disponibles:');
    console.log(TOPICOS_DISPONIBLES.map(topico => `  • ${topico}`).join('\n'));
    
    console.log('\n📋 Tipos de recursos:');
    const tiposUnicos = [...new Set(recursosCreados.map(r => r.tipo))];
    tiposUnicos.forEach(tipo => {
      const count = recursosCreados.filter(r => r.tipo === tipo).length;
      console.log(`  • ${tipo}: ${count} recursos`);
    });
    
  } catch (error) {
    console.error('\n❌ Error en el proceso:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = { main };

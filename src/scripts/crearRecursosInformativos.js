const mongoose = require('mongoose');
const RecursoInformativo = require('../models/RecursoInformativo');
const Usuario = require('../models/Usuario');
require('dotenv').config();

/**
 * Script para crear recursos informativos de ejemplo
 * 
 * IMPORTANTE: URLs de Placeholder
 * ===============================
 * Este script usa URLs de placeholder de Cloudinary.
 * Debes subir las imágenes/archivos a Cloudinary y reemplazar estas URLs.
 * 
 * Imágenes que necesitas buscar/crear:
 * 1. Salud Mental:
 *    - Imagen principal: Persona meditando, ambiente tranquilo (1200x800px)
 *    - Galería: 3 imágenes sobre bienestar mental, ejercicios de respiración, etc.
 *    - Documento: PDF sobre técnicas de manejo de ansiedad
 * 
 * 2. Violencia de Género:
 *    - Imagen principal: Imagen simbólica sobre apoyo/ayuda (1200x800px)
 *    - Galería: 3 imágenes sobre señales de alerta, apoyo, recursos
 *    - Documento: PDF con números de emergencia y guía de acción
 * 
 * 3. Autocuidado:
 *    - Imagen principal: Actividades de autocuidado (1200x800px)
 *    - Galería: 3 imágenes sobre rutinas saludables, ejercicio, descanso
 *    - Documento: PDF con plan de autocuidado semanal
 */

const crearRecursosInformativos = async () => {
  try {
    // Conectar a MongoDB usando MONGO_CONNECTION y MONGO_DB_NAME
    const mongoConnection = process.env.MONGO_CONNECTION;
    const mongoDbName = process.env.MONGO_DB_NAME || 'safehaven';
    
    if (!mongoConnection) {
      throw new Error('❌ MONGO_CONNECTION no está definida en las variables de entorno');
    }

    // Construir URL completa con el nombre de la base de datos
    const mongoUrl = `${mongoConnection}${mongoDbName}`;
    
    console.log('🔗 Conectando a MongoDB...');
    console.log(`📊 Base de datos: ${mongoDbName}`);
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB');

    // Buscar un administrador o profesional para asignar como creador
    let creador = await Usuario.findOne({ 
      rol: { $in: ['administrador', 'profesional'] }
    });
    
    if (!creador) {
      console.log('⚠️  No se encontró un administrador/profesional. Creando uno temporal...');
      const bcrypt = require('bcrypt');
      const contraseñaEncriptada = await bcrypt.hash('Admin123', 10);
      
      creador = new Usuario({
        nombreUsuario: 'admin_sistema',
        correo: 'admin@safehaven.com',
        contraseña: contraseñaEncriptada,
        nombreCompleto: 'Administrador Sistema',
        fechaNacimiento: new Date('1990-01-01'),
        rol: 'administrador',
        genero: 'Otro',
        activo: true,
        estado: 'activo'
      });
      
      await creador.save();
      console.log('✅ Administrador creado');
    }

    // ============================================================
    // RECURSOS INFORMATIVOS
    // ============================================================

    const recursos = [
      // Recurso 1: Salud Mental
      {
        titulo: 'Guía Completa para el Manejo de la Ansiedad',
        contenido: `La ansiedad es una respuesta natural del cuerpo ante situaciones estresantes. Sin embargo, cuando se vuelve excesiva o persistente, puede afectar significativamente nuestra calidad de vida.

¿Qué es la ansiedad?
La ansiedad es una emoción caracterizada por sentimientos de tensión, pensamientos preocupantes y cambios físicos como aumento de la presión arterial.

Síntomas comunes:
- Nerviosismo, agitación o tensión
- Sensación de peligro inminente
- Aumento del ritmo cardíaco
- Respiración acelerada
- Sudoración
- Temblores
- Dificultad para concentrarse
- Problemas para dormir

Técnicas de manejo:
1. Respiración profunda: Inhala por 4 segundos, mantén 4 segundos, exhala por 6 segundos
2. Mindfulness y meditación: Práctica diaria de 10-15 minutos
3. Ejercicio regular: Al menos 30 minutos, 3-5 veces por semana
4. Diario de pensamientos: Escribe tus preocupaciones para procesarlas
5. Establece rutinas: Horarios regulares de sueño y comidas
6. Limita cafeína y alcohol: Pueden aumentar la ansiedad
7. Conexión social: Mantén contacto con amigos y familia
8. Terapia cognitivo-conductual: Busca ayuda profesional si lo necesitas

Cuándo buscar ayuda profesional:
- La ansiedad interfiere con tu vida diaria
- Evitas situaciones por miedo
- Tienes pensamientos recurrentes que no puedes controlar
- Experimentas ataques de pánico
- Usas sustancias para manejar la ansiedad

Recursos de ayuda:
- Salud Responde: 600 360 7777
- Línea libre de violencia: 1455
- Fono Drogas y Alcohol: 1412`,
        
        contenidoHTML: `<h1>Guía Completa para el Manejo de la Ansiedad</h1>
<p>La ansiedad es una respuesta natural del cuerpo ante situaciones estresantes. Sin embargo, cuando se vuelve excesiva o persistente, puede afectar significativamente nuestra calidad de vida.</p>

<h2>¿Qué es la ansiedad?</h2>
<p>La ansiedad es una emoción caracterizada por sentimientos de tensión, pensamientos preocupantes y cambios físicos como aumento de la presión arterial.</p>

<h2>Síntomas comunes:</h2>
<ul>
  <li>Nerviosismo, agitación o tensión</li>
  <li>Sensación de peligro inminente</li>
  <li>Aumento del ritmo cardíaco</li>
  <li>Respiración acelerada</li>
  <li>Sudoración</li>
  <li>Temblores</li>
  <li>Dificultad para concentrarse</li>
  <li>Problemas para dormir</li>
</ul>

<h2>Técnicas de manejo:</h2>
<ol>
  <li><strong>Respiración profunda:</strong> Inhala por 4 segundos, mantén 4 segundos, exhala por 6 segundos</li>
  <li><strong>Mindfulness y meditación:</strong> Práctica diaria de 10-15 minutos</li>
  <li><strong>Ejercicio regular:</strong> Al menos 30 minutos, 3-5 veces por semana</li>
  <li><strong>Diario de pensamientos:</strong> Escribe tus preocupaciones para procesarlas</li>
  <li><strong>Establece rutinas:</strong> Horarios regulares de sueño y comidas</li>
  <li><strong>Limita cafeína y alcohol:</strong> Pueden aumentar la ansiedad</li>
  <li><strong>Conexión social:</strong> Mantén contacto con amigos y familia</li>
  <li><strong>Terapia cognitivo-conductual:</strong> Busca ayuda profesional si lo necesitas</li>
</ol>

<h2>Cuándo buscar ayuda profesional:</h2>
<ul>
  <li>La ansiedad interfiere con tu vida diaria</li>
  <li>Evitas situaciones por miedo</li>
  <li>Tienes pensamientos recurrentes que no puedes controlar</li>
  <li>Experimentas ataques de pánico</li>
  <li>Usas sustancias para manejar la ansiedad</li>
</ul>

<h2>Recursos de ayuda:</h2>
<ul>
  <li>Salud Responde: 600 360 7777</li>
  <li>Línea libre de violencia: 1455</li>
  <li>Fono Drogas y Alcohol: 1412</li>
</ul>`,
        
        resumen: 'Aprende técnicas efectivas para manejar la ansiedad, identifica síntomas y descubre cuándo buscar ayuda profesional.',
        
        topicos: ['salud_mental', 'ansiedad', 'bienestar'],
        
        fuente: 'Ministerio de Salud de Chile - Departamento de Salud Mental',
        
        descripcion: 'Guía completa con técnicas prácticas para identificar y manejar la ansiedad en el día a día.',
        
        tipo: 'guia',
        
        etiquetas: ['ansiedad', 'salud mental', 'técnicas de relajación', 'mindfulness', 'respiración'],
        
        destacado: true,
        
        // URLs de Cloudinary - Recurso 1
        imagenPrincipal: 'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763083375/pexels-lucaspezeta-2529375_lidd8o.jpg',
        
        galeria: [
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763083555/pexels-natalie-bond-320378-3759657_f6qvop.jpg',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763083663/pexels-roman-odintsov-6206146_tsfd4v.jpg',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763083725/ansiedad_spoq81.jpg'
        ],
        
        archivosAdjuntos: [
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084488/Gu%C3%ADa_para_manejar_la_ansiedad_gauhzo.pdf',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084620/EjerciciosRespiratorios_mwiwon.pdf'
        ],
        
        añadidoPor: creador._id,
        visible: true,
        aprobado: true
      },

      // Recurso 2: Violencia de Género
      {
        titulo: 'Identificación y Prevención de Violencia de Género',
        contenido: `La violencia de género es cualquier acto que resulte en daño físico, sexual o psicológico para las mujeres, incluyendo amenazas, coerción o privación arbitraria de libertad.

Tipos de violencia de género:

1. Violencia Física
- Empujones, golpes, cachetadas
- Uso de objetos para agredir
- Restricción física de movimientos
- Cualquier forma de agresión corporal

2. Violencia Psicológica
- Insultos, humillaciones, desvalorización
- Aislamiento de familiares y amigos
- Control excesivo de actividades
- Amenazas y manipulación emocional
- Gaslighting (hacer dudar de la realidad)

3. Violencia Sexual
- Cualquier acto sexual sin consentimiento
- Presión para actos sexuales no deseados
- Uso de la sexualidad para humillar
- Violación dentro de la relación

4. Violencia Económica
- Control del dinero y recursos
- Prohibición de trabajar
- Apropiación de ingresos
- Destrucción de bienes personales

Ciclo de la violencia:
1. Acumulación de tensión
2. Explosión violenta
3. Luna de miel (arrepentimiento, promesas)
4. Vuelta al punto 1

Señales de alerta:
✗ Celos excesivos
✗ Control de ropa, amistades, actividades
✗ Aislamiento social
✗ Culpabilización constante
✗ Cambios de humor impredecibles
✗ Amenazas de cualquier tipo
✗ Revisión de celular, redes sociales sin permiso

¿Qué hacer si estás en una relación violenta?

Inmediato:
1. Tu seguridad es lo primero
2. No estás sola/o - busca ayuda
3. La violencia NO es tu culpa
4. La violencia NO va a desaparecer sola

Acciones:
1. Habla con personas de confianza
2. Documenta los incidentes (fotos, mensajes, testimonios)
3. Conoce tus derechos legales
4. Crea un plan de seguridad
5. Ten a mano números de emergencia

Líneas de ayuda 24/7:
- Fono Mujer: 1455
- Fono Familia Carabineros: 149
- Salud Responde: 600 360 7777
- Orientación Violencia SERNAMEG: 800 104 008

Recuerda: Pedir ayuda es un acto de valentía, no de debilidad.`,
        
        contenidoHTML: `<h1>Identificación y Prevención de Violencia de Género</h1>
<p>La violencia de género es cualquier acto que resulte en daño físico, sexual o psicológico para las mujeres, incluyendo amenazas, coerción o privación arbitraria de libertad.</p>

<h2>Tipos de violencia de género:</h2>

<h3>1. Violencia Física</h3>
<ul>
  <li>Empujones, golpes, cachetadas</li>
  <li>Uso de objetos para agredir</li>
  <li>Restricción física de movimientos</li>
  <li>Cualquier forma de agresión corporal</li>
</ul>

<h3>2. Violencia Psicológica</h3>
<ul>
  <li>Insultos, humillaciones, desvalorización</li>
  <li>Aislamiento de familiares y amigos</li>
  <li>Control excesivo de actividades</li>
  <li>Amenazas y manipulación emocional</li>
  <li>Gaslighting (hacer dudar de la realidad)</li>
</ul>

<h3>3. Violencia Sexual</h3>
<ul>
  <li>Cualquier acto sexual sin consentimiento</li>
  <li>Presión para actos sexuales no deseados</li>
  <li>Uso de la sexualidad para humillar</li>
  <li>Violación dentro de la relación</li>
</ul>

<h3>4. Violencia Económica</h3>
<ul>
  <li>Control del dinero y recursos</li>
  <li>Prohibición de trabajar</li>
  <li>Apropiación de ingresos</li>
  <li>Destrucción de bienes personales</li>
</ul>

<h2>Ciclo de la violencia:</h2>
<ol>
  <li>Acumulación de tensión</li>
  <li>Explosión violenta</li>
  <li>Luna de miel (arrepentimiento, promesas)</li>
  <li>Vuelta al punto 1</li>
</ol>

<h2>Señales de alerta:</h2>
<ul>
  <li>✗ Celos excesivos</li>
  <li>✗ Control de ropa, amistades, actividades</li>
  <li>✗ Aislamiento social</li>
  <li>✗ Culpabilización constante</li>
  <li>✗ Cambios de humor impredecibles</li>
  <li>✗ Amenazas de cualquier tipo</li>
  <li>✗ Revisión de celular, redes sociales sin permiso</li>
</ul>

<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
  <h3 style="color: #856404;">¿Qué hacer si estás en una relación violenta?</h3>
  <h4>Inmediato:</h4>
  <ol>
    <li>Tu seguridad es lo primero</li>
    <li>No estás sola/o - busca ayuda</li>
    <li>La violencia NO es tu culpa</li>
    <li>La violencia NO va a desaparecer sola</li>
  </ol>
</div>

<h2>Líneas de ayuda 24/7:</h2>
<ul>
  <li><strong>Fono Mujer:</strong> 1455</li>
  <li><strong>Fono Familia Carabineros:</strong> 149</li>
  <li><strong>Salud Responde:</strong> 600 360 7777</li>
  <li><strong>Orientación Violencia SERNAMEG:</strong> 800 104 008</li>
</ul>

<p style="background: #e8f5e9; padding: 15px; border-radius: 8px; font-weight: bold;">
  Recuerda: Pedir ayuda es un acto de valentía, no de debilidad.
</p>`,
        
        resumen: 'Aprende a identificar los tipos de violencia de género, reconoce el ciclo de la violencia y accede a recursos de ayuda inmediata.',
        
        topicos: ['violencia_genero', 'prevencion_alerta', 'relaciones_cercanas'],
        
        fuente: 'SERNAMEG - Servicio Nacional de la Mujer y Equidad de Género',
        
        descripcion: 'Guía educativa sobre violencia de género con información sobre tipos, señales de alerta y recursos de ayuda en Chile.',
        
        tipo: 'guia',
        
        etiquetas: ['violencia de género', 'violencia intrafamiliar', 'prevención', 'ayuda', 'derechos'],
        
        destacado: true,
        
        // URLs de Cloudinary - Recurso 2
        imagenPrincipal: 'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763083422/pexels-ketut-subiyanto-4827405_dgmasu.jpg',
        
        galeria: [
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763083821/94888520_2766272603471383_993213811425017856_n_rcvmjy.jpg',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084078/06_qisjfu.jpg',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084180/infografia11-ciclo-de-la-violencia-UDLAP_zjegsz.jpg'
        ],
        
        archivosAdjuntos: [
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084581/Gu%C3%ADa_Violencia_de_G%C3%A9nero_-_World_Vision_Chile_gshl1y.pdf',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084739/GUIA-DE-VIOLENCIA-MINMUJER_r6zfe8.pdf'
        ],
        
        añadidoPor: creador._id,
        visible: true,
        aprobado: true
      },

      // Recurso 3: Autocuidado
      {
        titulo: 'Plan de Autocuidado para el Bienestar Emocional',
        contenido: `El autocuidado es la práctica de cuidar activamente tu salud física, mental y emocional. No es egoísmo, es una necesidad.

¿Por qué es importante el autocuidado?
- Reduce el estrés y la ansiedad
- Mejora la salud física y mental
- Aumenta la productividad
- Fortalece las relaciones
- Previene el burnout

Dimensiones del autocuidado:

1. Autocuidado Físico
- Dormir 7-9 horas diarias
- Alimentación balanceada
- Ejercicio regular (30 min/día)
- Hidratación adecuada (2L agua/día)
- Higiene personal
- Chequeos médicos regulares

2. Autocuidado Emocional
- Reconoce y valida tus emociones
- Expresa sentimientos de forma saludable
- Establece límites personales
- Practica la autocompasión
- Busca apoyo cuando lo necesites
- Lleva un diario emocional

3. Autocuidado Mental
- Lectura recreativa
- Aprendizaje de nuevas habilidades
- Desconexión digital regular
- Meditación y mindfulness
- Resolución de problemas
- Estimulación cognitiva

4. Autocuidado Social
- Tiempo de calidad con seres queridos
- Mantén conexiones significativas
- Participa en comunidades
- Pide ayuda cuando la necesites
- Contribuye al bienestar de otros

5. Autocuidado Espiritual
- Practica la gratitud diaria
- Conecta con la naturaleza
- Reflexiona sobre tus valores
- Meditación o oración
- Actividades que den sentido

Plan semanal de autocuidado:

Lunes: Ejercicio 30 min + meditación 10 min
Martes: Lectura recreativa + llamada a un amigo
Miércoles: Cocina saludable + baño relajante
Jueves: Caminata en naturaleza + diario emocional
Viernes: Hobby creativo + desconexión digital
Sábado: Tiempo en familia + actividad recreativa
Domingo: Descanso + planificación de la semana

Señales de que necesitas más autocuidado:
⚠ Agotamiento constante
⚠ Irritabilidad frecuente
⚠ Dificultad para concentrarte
⚠ Cambios en el apetito o sueño
⚠ Pérdida de interés en actividades
⚠ Sensación de estar "sobrepasado"

Recuerda: El autocuidado no es lujo, es mantenimiento básico para tu bienestar.`,
        
        contenidoHTML: `<h1>Plan de Autocuidado para el Bienestar Emocional</h1>
<p><strong>El autocuidado es la práctica de cuidar activamente tu salud física, mental y emocional. No es egoísmo, es una necesidad.</strong></p>

<h2>¿Por qué es importante el autocuidado?</h2>
<ul>
  <li>Reduce el estrés y la ansiedad</li>
  <li>Mejora la salud física y mental</li>
  <li>Aumenta la productividad</li>
  <li>Fortalece las relaciones</li>
  <li>Previene el burnout</li>
</ul>

<h2>Dimensiones del autocuidado:</h2>

<h3>1. Autocuidado Físico</h3>
<ul>
  <li>Dormir 7-9 horas diarias</li>
  <li>Alimentación balanceada</li>
  <li>Ejercicio regular (30 min/día)</li>
  <li>Hidratación adecuada (2L agua/día)</li>
  <li>Higiene personal</li>
  <li>Chequeos médicos regulares</li>
</ul>

<h3>2. Autocuidado Emocional</h3>
<ul>
  <li>Reconoce y valida tus emociones</li>
  <li>Expresa sentimientos de forma saludable</li>
  <li>Establece límites personales</li>
  <li>Practica la autocompasión</li>
  <li>Busca apoyo cuando lo necesites</li>
  <li>Lleva un diario emocional</li>
</ul>

<h3>3. Autocuidado Mental</h3>
<ul>
  <li>Lectura recreativa</li>
  <li>Aprendizaje de nuevas habilidades</li>
  <li>Desconexión digital regular</li>
  <li>Meditación y mindfulness</li>
  <li>Resolución de problemas</li>
  <li>Estimulación cognitiva</li>
</ul>

<h3>4. Autocuidado Social</h3>
<ul>
  <li>Tiempo de calidad con seres queridos</li>
  <li>Mantén conexiones significativas</li>
  <li>Participa en comunidades</li>
  <li>Pide ayuda cuando la necesites</li>
  <li>Contribuye al bienestar de otros</li>
</ul>

<h3>5. Autocuidado Espiritual</h3>
<ul>
  <li>Practica la gratitud diaria</li>
  <li>Conecta con la naturaleza</li>
  <li>Reflexiona sobre tus valores</li>
  <li>Meditación o oración</li>
  <li>Actividades que den sentido</li>
</ul>

<div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="color: #1976d2;">Plan semanal de autocuidado:</h3>
  <ul>
    <li><strong>Lunes:</strong> Ejercicio 30 min + meditación 10 min</li>
    <li><strong>Martes:</strong> Lectura recreativa + llamada a un amigo</li>
    <li><strong>Miércoles:</strong> Cocina saludable + baño relajante</li>
    <li><strong>Jueves:</strong> Caminata en naturaleza + diario emocional</li>
    <li><strong>Viernes:</strong> Hobby creativo + desconexión digital</li>
    <li><strong>Sábado:</strong> Tiempo en familia + actividad recreativa</li>
    <li><strong>Domingo:</strong> Descanso + planificación de la semana</li>
  </ul>
</div>

<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
  <h3>Señales de que necesitas más autocuidado:</h3>
  <ul>
    <li>⚠ Agotamiento constante</li>
    <li>⚠ Irritabilidad frecuente</li>
    <li>⚠ Dificultad para concentrarte</li>
    <li>⚠ Cambios en el apetito o sueño</li>
    <li>⚠ Pérdida de interés en actividades</li>
    <li>⚠ Sensación de estar "sobrepasado"</li>
  </ul>
</div>

<p style="background: #e8f5e9; padding: 15px; border-radius: 8px; font-weight: bold; color: #2e7d32;">
  Recuerda: El autocuidado no es lujo, es mantenimiento básico para tu bienestar.
</p>`,
        
        resumen: 'Descubre las 5 dimensiones del autocuidado y crea tu plan personalizado para mejorar tu bienestar físico, mental y emocional.',
        
        topicos: ['bienestar', 'autocuidado', 'salud_habitos'],
        
        fuente: 'OMS - Organización Mundial de la Salud',
        
        descripcion: 'Plan integral de autocuidado con actividades prácticas para cada dimensión del bienestar.',
        
        tipo: 'manual',
        
        etiquetas: ['autocuidado', 'bienestar', 'salud mental', 'rutinas saludables', 'prevención'],
        
        destacado: true,
        
        // URLs de Cloudinary - Recurso 3
        imagenPrincipal: 'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763083478/pexels-rethaferguson-3623180_fh4grm.jpg',
        
        galeria: [
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084283/pexels-roman-odintsov-8084797_dfz5xo.jpg',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084372/pexels-savanna-5184327_ip1xmj.jpg',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084415/pexels-yaroslav-shuraev-8845419_aupxsb.jpg'
        ],
        
        archivosAdjuntos: [
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763084808/GUIA-AUTOCUIDADO_FINAL_krkuj9.pdf',
          'https://res.cloudinary.com/dkmux1sv6/image/upload/v1763085037/Gu%C3%ADa_H%C3%A1bitos_Vida_Saludable_ygczfq.pdf'
        ],
        
        añadidoPor: creador._id,
        visible: true,
        aprobado: true
      }
    ];

    // Crear recursos en la base de datos
    console.log('');
    console.log('📚 Creando recursos informativos...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const recursoData of recursos) {
      // Verificar si ya existe
      const existente = await RecursoInformativo.findOne({ titulo: recursoData.titulo });
      
      if (existente) {
        console.log(`⚠️  Recurso ya existe: ${recursoData.titulo}`);
        continue;
      }

      const recurso = new RecursoInformativo(recursoData);
      await recurso.save();
      console.log(`✅ Recurso creado: ${recursoData.titulo}`);
      console.log(`   📁 Tipo: ${recursoData.tipo}`);
      console.log(`   🏷️  Tópicos: ${recursoData.topicos.join(', ')}`);
      console.log(`   🖼️  Galería: ${recursoData.galeria.length} imágenes`);
      console.log(`   📄 Archivos: ${recursoData.archivosAdjuntos.length} documentos`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ ¡Recursos informativos creados exitosamente!');
    console.log('');
    console.log('📊 Resumen:');
    recursos.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.titulo}`);
      console.log(`      - Tipo: ${r.tipo}`);
      console.log(`      - Tópicos: ${r.topicos.join(', ')}`);
    });
    console.log('');
    console.log('⚠️  IMPORTANTE: URLs de Placeholder');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Las URLs de imágenes y documentos son placeholders.');
    console.log('Debes subir los archivos reales a Cloudinary y actualizar las URLs.');
    console.log('');
    console.log('📸 Imágenes que necesitas buscar/crear:');
    console.log('');
    console.log('1️⃣  Salud Mental / Ansiedad:');
    console.log('   📷 Imagen principal (1200x800px):');
    console.log('      - Persona meditando en ambiente tranquilo');
    console.log('      - Paisaje relajante (playa, montaña, naturaleza)');
    console.log('      - Persona en posición de yoga/respiración');
    console.log('   🖼️  Galería (3 imágenes):');
    console.log('      - Ejercicios de respiración (diagrama)');
    console.log('      - Técnicas de mindfulness');
    console.log('      - Infografía sobre síntomas de ansiedad');
    console.log('   📄 Documento PDF:');
    console.log('      - Guía de técnicas de manejo de ansiedad');
    console.log('      - Ejercicios de respiración paso a paso');
    console.log('');
    console.log('2️⃣  Violencia de Género:');
    console.log('   📷 Imagen principal (1200x800px):');
    console.log('      - Manos entrelazadas simbolizando apoyo');
    console.log('      - Símbolo de "No a la violencia"');
    console.log('      - Imagen de empoderamiento femenino');
    console.log('   🖼️  Galería (3 imágenes):');
    console.log('      - Infografía de señales de alerta');
    console.log('      - Red de apoyo y recursos');
    console.log('      - Ciclo de la violencia (diagrama)');
    console.log('   📄 Documentos PDF:');
    console.log('      - Guía completa sobre violencia de género');
    console.log('      - Lista de números de emergencia en Chile');
    console.log('');
    console.log('3️⃣  Autocuidado:');
    console.log('   📷 Imagen principal (1200x800px):');
    console.log('      - Persona haciendo actividades de autocuidado');
    console.log('      - Rutina matutina saludable');
    console.log('      - Elementos de bienestar (té, libro, plantas)');
    console.log('   🖼️  Galería (3 imágenes):');
    console.log('      - Persona haciendo ejercicio/yoga');
    console.log('      - Meditación/mindfulness');
    console.log('      - Alimentación saludable');
    console.log('   📄 Documento PDF:');
    console.log('      - Plan de autocuidado semanal (plantilla)');
    console.log('      - Checklist de hábitos saludables');
    console.log('');
    console.log('📁 Carpetas sugeridas en Cloudinary:');
    console.log('   recursos-informativos/imagenes-principales/');
    console.log('   recursos-informativos/galerias/');
    console.log('   recursos-informativos/documentos/');
    console.log('');
    console.log('💡 Puedes buscar imágenes en:');
    console.log('   - Unsplash.com (gratuitas)');
    console.log('   - Pexels.com (gratuitas)');
    console.log('   - Canva.com (para crear infografías)');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear recursos informativos:', error.message);
    console.error(error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar script
crearRecursosInformativos();


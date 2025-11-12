const mongoose = require('mongoose');
const Encuesta = require('../models/Encuesta');
const Usuario = require('../models/Usuario');
require('dotenv').config();

/**
 * Script para crear encuestas de detección de violencia
 */

const crearEncuestas = async () => {
  try {
    // Conectar a MongoDB
    const mongoConnection = process.env.MONGO_CONNECTION;
    
    if (!mongoConnection) {
      throw new Error('❌ MONGO_CONNECTION no está definida en las variables de entorno');
    }

    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(mongoConnection);
    console.log('✅ Conectado a MongoDB');

    // Buscar un administrador para asignar como creador
    let admin = await Usuario.findOne({ rol: 'administrador' });
    
    if (!admin) {
      console.log('⚠️  No se encontró un administrador. Creando uno temporal...');
      const bcrypt = require('bcrypt');
      const contraseñaEncriptada = await bcrypt.hash('Admin123', 10);
      
      admin = new Usuario({
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
      
      await admin.save();
      console.log('✅ Administrador creado');
    }

    // Encuesta 1: Índice de Abuso en Relaciones de Pareja
    const encuesta1 = {
      titulo: 'Índice de Abuso en Relaciones de Pareja',
      descripcion: 'Cuestionario para evaluar la presencia de violencia y abuso en relaciones de pareja. Este instrumento ayuda a identificar diferentes tipos de violencia doméstica.',
      categoria: 'otro',
      activa: true,
      creadoPor: admin._id,
      tiempoEstimado: 10,
      version: '1.0',
      // Recomendaciones personalizadas según puntaje (Sí=3pts, A veces=2pts, Rara vez=1pt, No=0pts)
      recomendacionesPorNivel: [
        {
          rangoMin: 1,
          rangoMax: 11,
          nivel: 'Relación abusiva',
          descripcion: 'Existencia de problemas en el hogar, pero que se resuelven sin violencia física.',
          colorHexadecimal: '#FFC107',
          recomendaciones: [
            'Identifica los conflictos que surgen en tu relación y busca resolverlos mediante diálogo.',
            'Considera terapia de pareja si los problemas persisten.',
            'Establece límites claros en tu relación.',
            'Mantén comunicación abierta con personas de confianza.'
          ]
        },
        {
          rangoMin: 12,
          rangoMax: 22,
          nivel: 'Primer nivel de abuso',
          descripcion: 'La violencia en la relación está comenzando. Es una situación de ALERTA y un indicador de que la violencia puede aumentar en el futuro.',
          colorHexadecimal: '#FF9800',
          recomendaciones: [
            'ALERTA: La violencia puede escalar. Busca ayuda profesional ahora.',
            'Contacta a líneas de ayuda especializadas en violencia doméstica.',
            'Documenta todos los incidentes de violencia.',
            'Crea un plan de seguridad con personas de confianza.',
            'Considera alejarte temporalmente de la situación.',
            'Llama al 1455 (Fono Familia de Carabineros) o al 149 (Fono Mujer)'
          ]
        },
        {
          rangoMin: 23,
          rangoMax: 34,
          nivel: 'Abuso severo',
          descripcion: 'En este punto es importante solicitar ayuda institucional o personal y abandonar la casa temporalmente.',
          colorHexadecimal: '#F44336',
          recomendaciones: [
            'URGENTE: Solicita ayuda institucional inmediatamente.',
            'Considera abandonar la casa temporalmente por tu seguridad.',
            'Contacta al número 1455 o acude al centro de salud más cercano.',
            'Busca refugio en casas de acogida para víctimas de violencia.',
            'Contacta a familiares o amigos para apoyo inmediato.',
            'Documenta lesiones físicas y psicológicas.',
            'Consulta con abogado/a especializado/a en violencia doméstica.'
          ]
        },
        {
          rangoMin: 35,
          rangoMax: 45,
          nivel: '¡Abuso peligroso!',
          descripcion: 'Debes considerar en forma URGENTE e inmediata la posibilidad de dejar la relación en forma temporal y obtener apoyo externo, judicial y legal. Tu vida puede estar en peligro.',
          colorHexadecimal: '#9C27B0',
          recomendaciones: [
            '⚠️ PELIGRO INMINENTE: Tu vida puede estar en riesgo. Actúa YA.',
            'Abandona el lugar de forma inmediata y busca refugio seguro.',
            'Llama al 149 (Fono Mujer) o al 1455 (Fono Familia) AHORA.',
            'Acude a Carabineros o PDI para realizar denuncia formal.',
            'Solicita medidas de protección judicial urgentes.',
            'Contacta a red de casas de acogida (SERNAMEG).',
            'No regreses sola/o. Tu salud física y mental está en grave peligro.',
            'El problema NO se resolverá solo. Necesitas apoyo profesional urgente.',
            'Línea de atención: 800 104 008 (Ministerio de la Mujer)'
          ]
        }
      ],
      preguntas: [
        {
          enunciado: '¿Sientes que tu pareja te controla constantemente?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 1,
          obligatoria: true
        },
        {
          enunciado: '¿Te acusa de infidelidad o de que actúas en forma sospechosa?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 2,
          obligatoria: true
        },
        {
          enunciado: '¿Has perdido contacto con amigas, familiares, compañeras/os de trabajo para evitar que tu pareja se moleste?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 3,
          obligatoria: true
        },
        {
          enunciado: '¿Te critica y humilla, en público o en privado, sobre tu apariencia, tu forma de ser, tu forma de vestir y el modo en el que haces tus labores?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 4,
          obligatoria: true
        },
        {
          enunciado: '¿Controla estrictamente tus ingresos o el dinero que te entrega, originando discusiones?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 5,
          obligatoria: true
        },
        {
          enunciado: 'Cuando quiere que cambies de comportamiento, ¿te presiona con el silencio, con la indiferencia, o te priva de dinero?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 6,
          obligatoria: true
        },
        {
          enunciado: '¿Tu pareja tiene cambios bruscos de humor o se comporta distinto contigo en público, como si fuera otra persona?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 7,
          obligatoria: true
        },
        {
          enunciado: '¿Sientes que está en permanente tensión y que, hagas lo que hagas, él se irrita o te culpabiliza?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 8,
          obligatoria: true
        },
        {
          enunciado: '¿Te ha golpeado con sus manos, con un objeto o te ha lanzado cosas cuando se enoja o discuten, o lo ha intentado?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 9,
          obligatoria: true
        },
        {
          enunciado: '¿Te ha amenazado alguna vez con un objeto o arma, o con matarse a él, a ti o a algún miembro de tu familia?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 10,
          obligatoria: true
        },
        {
          enunciado: '¿Sientes que cedes a sus requerimientos sexuales por temor o te ha forzado a tener relaciones sexuales?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 11,
          obligatoria: true
        },
        {
          enunciado: 'Después de un episodio violento, ¿se muestra cariñoso y atento, te regala cosas y te promete que nunca más volverá a golpearte o insultarte y que todo cambiará?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 12,
          obligatoria: true
        },
        {
          enunciado: '¿Has buscado o recibido ayuda por lesiones que él te ha causado? (Primeros auxilios, atención médica, psicológica, o legal)',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 13,
          obligatoria: true
        },
        {
          enunciado: '¿Es violento con los hijos/as o con otras personas?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 14,
          obligatoria: true
        },
        {
          enunciado: '¿Ha sido necesario llamar a la policía o lo has intentado al sentir que tu vida o seguridad, y la de tu familia o amigos han sido puestas en peligro por tu pareja?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 15,
          obligatoria: true
        }
      ]
    };

    // Encuesta 2: Detección de Violencia en Noviazgo
    const encuesta2 = {
      titulo: 'Cuestionario de Detección de Violencia en Noviazgo',
      descripcion: 'Cuestionario diseñado para jóvenes que permite identificar señales de violencia en relaciones de noviazgo.',
      categoria: 'otro',
      activa: true,
      creadoPor: admin._id,
      tiempoEstimado: 8,
      version: '1.0',
      // Recomendaciones específicas para violencia en noviazgo (Sí=3pts, A veces=2pts, Rara vez=1pt, No=0pts)
      recomendacionesPorNivel: [
        {
          rangoMin: 0,
          rangoMax: 5,
          nivel: 'Relación no abusiva',
          descripcion: 'Tal vez existan algunos problemas que de manera común se presentan entre parejas, pero se resuelven sin violencia.',
          colorHexadecimal: '#4CAF50',
          recomendaciones: [
            'Tu relación muestra señales saludables.',
            'Mantén la comunicación abierta y respetuosa con tu pareja.',
            'Continúa estableciendo límites saludables.',
            'Si surgen conflictos, resuélvelos mediante el diálogo.'
          ]
        },
        {
          rangoMin: 6,
          rangoMax: 15,
          nivel: 'Platica con tu pareja',
          descripcion: 'Revisa las reglas de tu relación y establece límites claros.',
          colorHexadecimal: '#FFEB3B',
          recomendaciones: [
            'Habla con tu pareja sobre las dinámicas que te incomodan.',
            'Establece límites claros sobre lo que es aceptable y lo que no.',
            'Considera buscar orientación en consejería de pareja.',
            'Presta atención a patrones de comportamiento que puedan escalar.',
            'Mantén tu red de apoyo (amigos, familia) activa.'
          ]
        },
        {
          rangoMin: 16,
          rangoMax: 25,
          nivel: 'Estás viviendo violencia',
          descripcion: 'Tu relación tiene señales de abuso de poder. Es importante tomar acción.',
          colorHexadecimal: '#FF9800',
          recomendaciones: [
            'Tu relación muestra señales claras de violencia. Reconócelo.',
            'Busca apoyo en personas de confianza (familia, amigos, profesores).',
            'Contacta líneas de ayuda para jóvenes: 1515 (Fono Seguridades y Certezas).',
            'Considera terminar la relación si la violencia continúa.',
            'No estás solo/a. Hay profesionales que pueden ayudarte.',
            'Documenta los incidentes de violencia que ocurran.'
          ]
        },
        {
          rangoMin: 26,
          rangoMax: 36,
          nivel: '¡CUIDADO! Tu seguridad está en riesgo',
          descripcion: 'Pide asesoría y apoyo urgente. Tu seguridad puede estar en riesgo.',
          colorHexadecimal: '#F44336',
          recomendaciones: [
            '⚠️ PELIGRO: Tu seguridad está en riesgo. Actúa ahora.',
            'Termina la relación de forma segura. Busca apoyo antes de hacerlo.',
            'Contacta INMEDIATAMENTE a líneas de ayuda: 1455 o 149.',
            'Acude a tu establecimiento educativo y habla con orientador/a o psicólogo/a.',
            'NO enfrentes a tu pareja sola/o. Busca adultos de confianza.',
            'Considera realizar denuncia formal si hay agresiones físicas.',
            'Aléjate de situaciones donde estés a solas con tu pareja.',
            'Crea un plan de seguridad: identifica lugares seguros, personas de confianza.'
          ]
        }
      ],
      preguntas: [
        {
          enunciado: '¿Sientes que tu pareja constantemente te está controlando por amor?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 1,
          obligatoria: true
        },
        {
          enunciado: '¿Te acusa de infidelidad o de que actúas en forma sospechosa?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 2,
          obligatoria: true
        },
        {
          enunciado: '¿Has perdido contacto con amigos, familiares, compañeras/os de tu escuela o trabajo para evitar que tu pareja se moleste?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 3,
          obligatoria: true
        },
        {
          enunciado: '¿Te critica y humilla en público o en privado, opina negativamente sobre tu apariencia, tu forma de ser o el modo en que te vistes?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 4,
          obligatoria: true
        },
        {
          enunciado: '¿Tu pareja tiene cambios bruscos de humor o se comporta distinto contigo en público, como si fuera otra persona?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 5,
          obligatoria: true
        },
        {
          enunciado: '¿Sientes que está en permanente tensión y que, hagas lo que hagas, se irrita o te culpabiliza de sus cambios?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 6,
          obligatoria: true
        },
        {
          enunciado: '¿Te ha golpeado con sus manos, te ha jaloneado o te ha lanzado cosas cuando se enoja o cuando discuten?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 7,
          obligatoria: true
        },
        {
          enunciado: '¿Te ha amenazado alguna vez con un objeto o armas, o con matarse él, a ti o a algún miembro de la familia si no le obedeces?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 8,
          obligatoria: true
        },
        {
          enunciado: '¿Sientes que cedes a sus peticiones sexuales por temor, o te ha forzado a tener relaciones, amenazándote que si no tiene relaciones contigo, entonces se va con otra?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 9,
          obligatoria: true
        },
        {
          enunciado: 'Después de un episodio violento, ¿se muestra cariñoso y atento, te regala cosas y te promete que nunca más volverá a pegarte o insultarte y te dice que todo cambiará?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 10,
          obligatoria: true
        },
        {
          enunciado: '¿Has buscado o has recibido ayuda por lesiones que él te ha causado? (primeros auxilios, atención médica o legal)',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 11,
          obligatoria: true
        },
        {
          enunciado: '¿Es violento con otras personas o se pelea a golpes con otros hombres?',
          opciones: ['Sí', 'A veces', 'Rara vez', 'No'],
          tipo: 'escala',
          orden: 12,
          obligatoria: true
        }
      ]
    };

    // Encuesta 3: Evaluación de Violencia de Pareja (Universidad)
    const encuesta3 = {
      titulo: 'Cuestionario Evaluación Violencia de Pareja',
      descripcion: 'Cuestionario dirigido a personas que tuvieron o tienen una relación de noviazgo. Evalúa diferentes tipos de violencia en el contexto de pareja.',
      categoria: 'otro',
      activa: true,
      creadoPor: admin._id,
      tiempoEstimado: 15,
      version: '1.0',
      // Esta encuesta NO tiene recomendaciones personalizadas
      // Por lo tanto usará las recomendaciones por defecto del sistema
      recomendacionesPorNivel: [],
      preguntas: [
        {
          enunciado: '¿Su pareja ha tratado de golpearle?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 1,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja le ha pegado con la mano o el puño, pateado o empujado con intención de lastimarle?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 2,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja le ha pellizcado sin mala intención?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 3,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja le ha golpeado sin razón alguna?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 4,
          obligatoria: true
        },
        {
          enunciado: '¿Cree que los golpes de su pareja merecen justificación?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 5,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja le ha jalado del pelo?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 6,
          obligatoria: true
        },
        {
          enunciado: '¿Cuándo su pareja está estresado por otras situaciones se desquita golpeándole?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 7,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja ha golpeado o empujado la pared, puerta u otro objeto para asustarle?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 8,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja se irrita si usted dice algo que no le parece?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 9,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja le insulta en público?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 10,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja revisa su celular, bolsa, etc., sin su consentimiento?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 11,
          obligatoria: true
        },
        {
          enunciado: '¿Al momento de tener relaciones sexuales, su pareja solamente busca satisfacer sus propios deseos?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 12,
          obligatoria: true
        },
        {
          enunciado: '¿Hace todo lo que su pareja le diga?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 13,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja le ridiculiza frente a otras personas?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 14,
          obligatoria: true
        },
        {
          enunciado: '¿Su pareja se enoja cuando usted no quiere tener relaciones sexuales?',
          opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
          tipo: 'escala',
          orden: 15,
          obligatoria: true
        }
      ]
    };

    // Agregar más preguntas a la encuesta 3 (continuación)
    const preguntasAdicionales = [
      '¿Su pareja solo es amoroso/a cuando quiere tener relaciones sexuales?',
      '¿Su pareja le dice cosas solo para hacerle enfadar?',
      '¿Su pareja ha leído o escuchado conversaciones personales sin su consentimiento?',
      '¿Su pareja ha insultado la forma en la que hace su trabajo?',
      '¿Su pareja ha criticado el rol que usted desempeña en cualquier ámbito? (laboral, en la relación, familiar, etc)',
      '¿Su pareja le insulta con palabras despectivas?',
      '¿Su pareja le exige bloquear o eliminar gente de redes sociales?',
      '¿Su pareja le miente constantemente?',
      '¿Su pareja le interrumpe constantemente cuando habla?',
      '¿Si alguien le voltea a ver o le habla, su pareja se enoja con usted?',
      '¿Su pareja le cuenta a otros sus errores para burlarse?',
      '¿Cuándo algo le molesta no dice nada por miedo a una pelea?',
      '¿Su pareja le prohíbe ir a ciertos lugares o ver ciertas personas?',
      '¿Su pareja le critica negativamente?',
      '¿Su pareja le vigila cuando sale sin él o ella?',
      '¿Su pareja le hace sentir mal, inferior, menos, etc.?',
      '¿Tiene que dar explicaciones de a dónde va a su pareja?',
      '¿Su pareja le habla en un tono hostil u ofensivo?',
      'Yo creo que mi pareja me debe de obedecer',
      'Yo creo que mi pareja debe informarme donde se encuentra',
      'Yo creo que está bien prohibir amistades a mi pareja'
    ];

    preguntasAdicionales.forEach((pregunta, index) => {
      encuesta3.preguntas.push({
        enunciado: pregunta,
        opciones: ['Nunca', 'Casi nunca', 'Algunas veces', 'Frecuentemente', 'Siempre'],
        tipo: 'escala',
        orden: 16 + index,
        obligatoria: true
      });
    });

    // Crear encuestas en la base de datos
    const encuestas = [encuesta1, encuesta2, encuesta3];
    
    console.log('');
    console.log('📝 Creando encuestas...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const encuestaData of encuestas) {
      // Verificar si ya existe
      const existente = await Encuesta.findOne({ titulo: encuestaData.titulo });
      
      if (existente) {
        console.log(`⚠️  Encuesta ya existe: ${encuestaData.titulo}`);
        continue;
      }

      const encuesta = new Encuesta(encuestaData);
      await encuesta.save();
      console.log(`✅ Encuesta creada: ${encuestaData.titulo} (${encuestaData.preguntas.length} preguntas)`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ ¡Encuestas creadas exitosamente!');
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   1. ${encuesta1.titulo} - ${encuesta1.preguntas.length} preguntas`);
    console.log(`   2. ${encuesta2.titulo} - ${encuesta2.preguntas.length} preguntas`);
    console.log(`   3. ${encuesta3.titulo} - ${encuesta3.preguntas.length} preguntas`);
    console.log('');
    console.log('💡 Puedes ver las encuestas en:');
    console.log('   GET http://localhost:3000/api/encuestas');
    console.log('');

  } catch (error) {
    console.error('❌ Error al crear encuestas:', error.message);
    console.error(error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar script
crearEncuestas();


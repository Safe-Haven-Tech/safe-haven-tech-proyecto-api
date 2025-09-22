/* filepath: f:\SafeHaven\safe-haven-tech-proyecto-api\src\utils\pdfGenerator.js */
const puppeteer = require('puppeteer');

/**
 * @desc    Generar PDF con los resultados de la encuesta usando Puppeteer
 * @param   {Object} respuesta - Respuesta de la encuesta
 * @param   {Object} encuesta - Datos de la encuesta
 * @returns {Buffer} Buffer del PDF generado
 */
const generarPDFEncuesta = async (respuesta, encuesta) => {
  let browser;
  
  try {
    console.log('🔍 Iniciando generación de PDF...');
    
    // Validar que los parámetros existan
    if (!respuesta || !encuesta) {
      throw new Error('Faltan parámetros requeridos: respuesta y encuesta');
    }

    if (!encuesta.titulo) {
      throw new Error('La encuesta no tiene título definido');
    }

    // --- Definir valores por respuesta (si no vienen en la respuesta) ---
    const valoresRespuesta = {
      "Nunca": 0,
      "Ocasionalmente": 1,
      "Frecuentemente": 2,
      "Siempre": 3
    };

    // --- Calcular puntaje total (si no viene calculado) ---
    if (!respuesta.puntajeTotal && respuesta.puntajeTotal !== 0) {
      respuesta.puntajeTotal = respuesta.respuestas.reduce((sum, r) => {
        const valor = r.puntaje ?? valoresRespuesta[r.respuesta] ?? 0;
        return sum + valor;
      }, 0);
    }

    // --- Determinar nivel de riesgo (si no viene definido) ---
    if (!respuesta.nivelRiesgo) {
      let nivelRiesgo = 'bajo';
      const puntaje = respuesta.puntajeTotal;
      
      // Usar rangos de la encuesta si están definidos
      if (encuesta.riesgoCritico && puntaje >= encuesta.riesgoCritico) nivelRiesgo = 'crítico';
      else if (encuesta.riesgoAlto && puntaje >= encuesta.riesgoAlto) nivelRiesgo = 'alto';
      else if (encuesta.riesgoMedio && puntaje >= encuesta.riesgoMedio) nivelRiesgo = 'medio';
      else {
        // Rangos por defecto si no están definidos en la encuesta
        if (puntaje >= 8) nivelRiesgo = 'crítico';
        else if (puntaje >= 6) nivelRiesgo = 'alto';
        else if (puntaje >= 3) nivelRiesgo = 'medio';
      }
      
      respuesta.nivelRiesgo = nivelRiesgo;
    }

    // --- Generar recomendaciones (si no vienen definidas) ---
    if (!respuesta.recomendaciones || respuesta.recomendaciones.length === 0) {
      let recomendaciones = [];
      switch (respuesta.nivelRiesgo) {
        case 'bajo':
          recomendaciones = ['Mantener hábitos actuales', 'Continuar con prácticas de bienestar'];
          break;
        case 'medio':
          recomendaciones = ['Prestar atención a los síntomas', 'Consultar recursos preventivos', 'Considerar técnicas de manejo del estrés'];
          break;
        case 'alto':
          recomendaciones = ['Considerar asesoría profesional', 'Revisar hábitos de riesgo', 'Implementar estrategias de autocuidado'];
          break;
        case 'crítico':
          recomendaciones = ['Buscar ayuda profesional inmediata', 'Seguir plan de acción recomendado', 'Contactar servicios de apoyo especializados'];
          break;
      }
      respuesta.recomendaciones = recomendaciones;
    }

    console.log('🔍 Generando HTML...');
    // --- Generar HTML usando diseño existente ---
    const html = generarHTMLEncuesta(respuesta, encuesta);

    console.log('🔍 Lanzando Puppeteer...');
    // 🎯 CORREGIDO: Configuración más robusta de Puppeteer
    browser = await puppeteer.launch({ 
      headless: 'new', // 🎯 Usar la nueva versión headless
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: 60000 // 🎯 Timeout de 60 segundos para launch
    });

    console.log('🔍 Creando página...');
    const page = await browser.newPage();
    
    // 🎯 CORREGIDO: Configurar viewport y timeouts
    await page.setViewport({ width: 1200, height: 800 });
    page.setDefaultTimeout(45000); // 🎯 Timeout de 45 segundos para operaciones
    page.setDefaultNavigationTimeout(45000); // 🎯 Timeout de 45 segundos para navegación

    console.log('🔍 Configurando contenido HTML...');
    // 🎯 CORREGIDO: Usar domcontentloaded en lugar de networkidle0
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded', // 🎯 Más rápido que networkidle0
      timeout: 30000 // 🎯 Timeout específico para setContent
    });

    console.log('🔍 Esperando que la página esté lista...');
    // 🎯 CORREGIDO: Usar Promise en lugar de page.waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🔍 Generando PDF...');
    // 🎯 MEJORADO: Configuración del PDF
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    console.log('✅ PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
    return pdfBuffer;

  } catch (error) {
    console.error('❌ Error en generarPDFEncuesta:', error);
    
    // 🎯 NUEVO: Errores más específicos
    if (error.message.includes('Navigation timeout')) {
      throw new Error('Timeout al generar PDF: El contenido HTML tardó demasiado en cargar');
    } else if (error.message.includes('Protocol error')) {
      throw new Error('Error de protocolo Puppeteer: Problema de comunicación con el navegador');
    } else {
      throw new Error(`Error al generar PDF: ${error.message}`);
    }
  } finally {
    // 🎯 IMPORTANTE: Asegurar que el navegador se cierre siempre
    if (browser) {
      try {
        console.log('🔍 Cerrando navegador...');
        await browser.close();
      } catch (closeError) {
        console.error('❌ Error al cerrar navegador:', closeError);
      }
    }
  }
};

/**
 * @desc    Generar HTML para la encuesta (OPTIMIZADO)
 * @param   {Object} respuesta - Respuesta de la encuesta
 * @param   {Object} encuesta - Datos de la encuesta
 * @returns {string} HTML generado
 */
const generarHTMLEncuesta = (respuesta, encuesta) => {
  // 🎯 OPTIMIZADO: HTML más simple y rápido de cargar
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resultados de Autoevaluación - ${encuesta.titulo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
          background: white;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #4CAF50; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .header h1 { 
          color: #2E7D32; 
          margin: 0; 
          font-size: 28px; 
          font-weight: bold;
        }
        .header h2 { 
          color: #666; 
          margin: 10px 0 0 0; 
          font-size: 20px; 
          font-weight: normal;
        }
        .section { 
          margin-bottom: 25px; 
          break-inside: avoid;
        }
        .section h3 { 
          color: #2E7D32; 
          border-bottom: 2px solid #E8F5E8; 
          padding-bottom: 8px; 
          margin-bottom: 15px; 
          font-size: 18px;
        }
        .info-grid { 
          display: block; 
          margin-bottom: 20px; 
        }
        .info-item { 
          background: #F5F5F5; 
          padding: 10px; 
          border-radius: 5px; 
          margin-bottom: 10px;
        }
        .info-label { 
          font-weight: bold; 
          color: #555; 
          display: inline-block;
          min-width: 150px;
        }
        .results { 
          background: #E8F5E8; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        .risk-level { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-weight: bold; 
          color: white; 
          text-transform: uppercase; 
          margin-top: 5px;
        }
        .risk-bajo { background: #4CAF50; }
        .risk-medio { background: #FF9800; }
        .risk-alto { background: #F44336; }
        .risk-crítico { background: #9C27B0; }
        .recommendations { 
          background: #FFF3E0; 
          padding: 15px; 
          border-radius: 5px; 
          border-left: 4px solid #FF9800; 
        }
        .recommendations ul { 
          margin: 10px 0; 
          padding-left: 20px; 
        }
        .question { 
          margin-bottom: 15px; 
          padding: 10px; 
          background: #FAFAFA; 
          border-radius: 5px; 
          break-inside: avoid;
        }
        .question-text { 
          font-weight: bold; 
          margin-bottom: 5px; 
        }
        .answer { 
          color: #666; 
          font-style: italic; 
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #E0E0E0; 
          color: #666; 
          font-size: 12px; 
        }
        @page { 
          margin: 2cm; 
          size: A4;
        }
        @media print { 
          body { margin: 0; font-size: 12px; } 
          .header { page-break-after: avoid; } 
          .section { page-break-inside: avoid; } 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Resultados de Autoevaluación</h1>
        <h2>${encuesta.titulo || 'Sin título'}</h2>
      </div>

      <div class="section">
        <h3>Información General</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Fecha de evaluación:</span>
            <span>${new Date(respuesta.fechaCompletado).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Categoría:</span>
            <span>${encuesta.categoria || 'No especificada'}</span>
          </div>
          ${respuesta.tiempoCompletado ? `
          <div class="info-item">
            <span class="info-label">Tiempo completado:</span>
            <span>${Math.floor(respuesta.tiempoCompletado / 60)}m ${respuesta.tiempoCompletado % 60}s</span>
          </div>` : ''}
          ${encuesta.descripcion ? `
          <div class="info-item">
            <span class="info-label">Descripción:</span>
            <span>${encuesta.descripcion}</span>
          </div>` : ''}
        </div>
      </div>

      <div class="section">
        <h3>Resultados de la Evaluación</h3>
        <div class="results">
          <div class="info-item">
            <span class="info-label">Puntaje total:</span>
            <span style="font-size: 24px; font-weight: bold; color: #2E7D32;">
              ${respuesta.puntajeTotal || 0}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Nivel de riesgo:</span>
            <span class="risk-level risk-${respuesta.nivelRiesgo || 'bajo'}">
              ${(respuesta.nivelRiesgo || 'bajo').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      ${respuesta.recomendaciones && respuesta.recomendaciones.length > 0 ? `
      <div class="section">
        <h3>Recomendaciones</h3>
        <div class="recommendations">
          <ul>
            ${respuesta.recomendaciones.map(rec => `<li>${rec || ''}</li>`).join('')}
          </ul>
        </div>
      </div>` : ''}

      <div class="section">
        <h3>Detalle de Respuestas</h3>
        ${respuesta.respuestas && respuesta.respuestas.length > 0 ? 
          respuesta.respuestas.map((r, index) => `
            <div class="question">
              <div class="question-text">${index + 1}. ${r.preguntaEnunciado || `Pregunta ${r.preguntaOrden || index + 1}`}</div>
              <div class="answer">Respuesta: ${r.respuesta || 'Sin respuesta'}</div>
              ${r.puntaje !== undefined ? `<div class="answer">Puntaje: ${r.puntaje}</div>` : ''}
            </div>
          `).join('') : '<p>No hay respuestas disponibles</p>'
        }
      </div>

      <div class="footer">
        <p>Este documento fue generado automáticamente por el sistema SafeHaven.</p>
        <p>Para más información, contacta a un profesional de la salud mental.</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = { generarPDFEncuesta };
const puppeteer = require('puppeteer');

/**
 * @desc    Generar PDF con los resultados de la encuesta usando Puppeteer
 * @param   {Object} respuesta - Respuesta de la encuesta
 * @param   {Object} encuesta - Datos de la encuesta
 * @returns {Buffer} Buffer del PDF generado
 */
const generarPDFEncuesta = async (respuesta, encuesta) => {
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

  // --- Generar HTML usando diseño existente ---
  const html = generarHTMLEncuesta(respuesta, encuesta);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return pdfBuffer;
};

/**
 * @desc    Generar HTML para la encuesta
 * @param   {Object} respuesta - Respuesta de la encuesta
 * @param   {Object} encuesta - Datos de la encuesta
 * @returns {string} HTML generado
 */
const generarHTMLEncuesta = (respuesta, encuesta) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resultados de Autoevaluación - ${encuesta.titulo}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2E7D32; margin: 0; font-size: 28px; }
        .header h2 { color: #666; margin: 10px 0 0 0; font-size: 20px; }
        .section { margin-bottom: 25px; }
        .section h3 { color: #2E7D32; border-bottom: 2px solid #E8F5E8; padding-bottom: 8px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-item { background: #F5F5F5; padding: 10px; border-radius: 5px; }
        .info-label { font-weight: bold; color: #555; }
        .results { background: #E8F5E8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .risk-level { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: white; text-transform: uppercase; }
        .risk-bajo { background: #4CAF50; }
        .risk-medio { background: #FF9800; }
        .risk-alto { background: #F44336; }
        .risk-crítico { background: #9C27B0; }
        .recommendations { background: #FFF3E0; padding: 15px; border-radius: 5px; border-left: 4px solid #FF9800; }
        .recommendations ul { margin: 10px 0; padding-left: 20px; }
        .question { margin-bottom: 15px; padding: 10px; background: #FAFAFA; border-radius: 5px; }
        .question-text { font-weight: bold; margin-bottom: 5px; }
        .answer { color: #666; font-style: italic; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E0E0E0; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } .header { page-break-after: avoid; } .section { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Resultados de Autoevaluación</h1>
        <h2>${encuesta.titulo}</h2>
      </div>

      <div class="section">
        <h3>Información General</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Fecha de evaluación:</div>
            <div>${new Date(respuesta.fechaCompletado).toLocaleDateString('es-ES')}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Categoría:</div>
            <div>${encuesta.categoria || 'No especificada'}</div>
          </div>
          ${respuesta.tiempoCompletado ? `
          <div class="info-item">
            <div class="info-label">Tiempo completado:</div>
            <div>${Math.floor(respuesta.tiempoCompletado / 60)}m ${respuesta.tiempoCompletado % 60}s</div>
          </div>` : ''}
          ${encuesta.descripcion ? `
          <div class="info-item">
            <div class="info-label">Descripción:</div>
            <div>${encuesta.descripcion}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="section">
        <h3>Resultados de la Evaluación</h3>
        <div class="results">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Puntaje total:</div>
              <div style="font-size: 24px; font-weight: bold; color: #2E7D32;">
                ${respuesta.puntajeTotal}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Nivel de riesgo:</div>
              <div class="risk-level risk-${respuesta.nivelRiesgo}">
                ${respuesta.nivelRiesgo}
              </div>
            </div>
          </div>
        </div>
      </div>

      ${respuesta.recomendaciones && respuesta.recomendaciones.length > 0 ? `
      <div class="section">
        <h3>Recomendaciones</h3>
        <div class="recommendations">
          <ul>
            ${respuesta.recomendaciones.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      </div>` : ''}

      <div class="section">
        <h3>Detalle de Respuestas</h3>
        ${respuesta.respuestas.map((r, index) => `
          <div class="question">
            <div class="question-text">${index + 1}. ${r.preguntaEnunciado || `Pregunta ${r.preguntaOrden}`}</div>
            <div class="answer">Respuesta: ${r.respuesta}</div>
            ${r.puntaje !== undefined ? `<div class="answer">Puntaje: ${r.puntaje}</div>` : ''}
          </div>
        `).join('')}
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
const puppeteer = require('puppeteer');

/**
 * @desc    Generar PDF con los resultados de la encuesta usando Puppeteer
 * @param   {Object} respuesta - Respuesta de la encuesta
 * @param   {Object} encuesta - Datos de la encuesta
 * @returns {Buffer} Buffer del PDF generado
 */
const generarPDFEncuesta = async (respuesta, encuesta) => {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Generar HTML para el PDF
    const html = generarHTMLEncuesta(respuesta, encuesta);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generando PDF con Puppeteer:', error);
    throw new Error('Error al generar PDF');
  }
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
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
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
        }
        .header h2 {
          color: #666;
          margin: 10px 0 0 0;
          font-size: 20px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          color: #2E7D32;
          border-bottom: 2px solid #E8F5E8;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          background: #F5F5F5;
          padding: 10px;
          border-radius: 5px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
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
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          .section { page-break-inside: avoid; }
        }
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
            <div>${encuesta.categoria}</div>
          </div>
          ${respuesta.tiempoCompletado ? `
          <div class="info-item">
            <div class="info-label">Tiempo completado:</div>
            <div>${Math.floor(respuesta.tiempoCompletado / 60)}m ${respuesta.tiempoCompletado % 60}s</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <h3>Resultados de la Evaluación</h3>
        <div class="results">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Puntaje total:</div>
              <div style="font-size: 24px; font-weight: bold; color: #2E7D32;">
                ${respuesta.puntajeTotal || 'N/A'}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Nivel de riesgo:</div>
              <div class="risk-level risk-${respuesta.nivelRiesgo || 'bajo'}">
                ${respuesta.nivelRiesgo || 'N/A'}
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
      </div>
      ` : ''}
      
      <div class="section">
        <h3>Detalle de Respuestas</h3>
        ${respuesta.respuestas.map((respuestaIndividual, index) => {
          const pregunta = encuesta.preguntas.find(p => p.orden === respuestaIndividual.preguntaOrden);
          if (pregunta) {
            return `
              <div class="question">
                <div class="question-text">${index + 1}. ${pregunta.enunciado}</div>
                <div class="answer">Respuesta: ${respuestaIndividual.respuesta}</div>
              </div>
            `;
          }
          return '';
        }).join('')}
      </div>
      
      <div class="footer">
        <p>Este documento fue generado automáticamente por el sistema SafeHaven.</p>
        <p>Para más información, contacta a un profesional de la salud mental.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * @desc    Generar PDF de estadísticas de encuesta (para administradores)
 * @param   {Object} estadisticas - Estadísticas de la encuesta
 * @param   {Object} encuesta - Datos de la encuesta
 * @returns {Buffer} Buffer del PDF generado
 */
const generarPDFEstadisticas = async (estadisticas, encuesta) => {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Generar HTML para las estadísticas
    const html = generarHTMLEstadisticas(estadisticas, encuesta);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generando PDF de estadísticas con Puppeteer:', error);
    throw new Error('Error al generar PDF de estadísticas');
  }
};

/**
 * @desc    Generar HTML para las estadísticas
 * @param   {Object} estadisticas - Estadísticas de la encuesta
 * @param   {Object} encuesta - Datos de la encuesta
 * @returns {string} HTML generado
 */
const generarHTMLEstadisticas = (estadisticas, encuesta) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estadísticas de Encuesta - ${encuesta.titulo}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2196F3;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1976D2;
          margin: 0;
          font-size: 28px;
        }
        .header h2 {
          color: #666;
          margin: 10px 0 0 0;
          font-size: 20px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          color: #1976D2;
          border-bottom: 2px solid #E3F2FD;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .stat-item {
          background: #E3F2FD;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1976D2;
          margin-bottom: 5px;
        }
        .stat-label {
          color: #555;
          font-size: 14px;
        }
        .risk-distribution {
          background: #F3E5F5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .risk-bar {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .risk-label {
          width: 80px;
          font-weight: bold;
        }
        .risk-bar-bg {
          flex: 1;
          height: 20px;
          background: #E0E0E0;
          border-radius: 10px;
          margin: 0 10px;
          overflow: hidden;
        }
        .risk-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #FF9800, #F44336, #9C27B0);
          transition: width 0.3s ease;
        }
        .risk-count {
          width: 60px;
          text-align: right;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E0E0E0;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Estadísticas de Encuesta</h1>
        <h2>${encuesta.titulo}</h2>
      </div>
      
      <div class="section">
        <h3>Resumen General</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${estadisticas.totalRespuestas}</div>
            <div class="stat-label">Total de Respuestas</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${estadisticas.promedioPuntaje.toFixed(1)}</div>
            <div class="stat-label">Promedio de Puntaje</div>
          </div>
          ${estadisticas.tiempoPromedio ? `
          <div class="stat-item">
            <div class="stat-value">${Math.floor(estadisticas.tiempoPromedio / 60)}m</div>
            <div class="stat-label">Tiempo Promedio</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="section">
        <h3>Distribución por Nivel de Riesgo</h3>
        <div class="risk-distribution">
          ${Object.entries(estadisticas.distribucionRiesgo).map(([nivel, cantidad]) => {
            const porcentaje = estadisticas.totalRespuestas > 0 
              ? ((cantidad / estadisticas.totalRespuestas) * 100).toFixed(1)
              : 0;
            const barWidth = estadisticas.totalRespuestas > 0 
              ? (cantidad / estadisticas.totalRespuestas) * 100
              : 0;
            return `
              <div class="risk-bar">
                <div class="risk-label">${nivel.charAt(0).toUpperCase() + nivel.slice(1)}</div>
                <div class="risk-bar-bg">
                  <div class="risk-bar-fill" style="width: ${barWidth}%"></div>
                </div>
                <div class="risk-count">${cantidad} (${porcentaje}%)</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      ${estadisticas.fechaPrimeraRespuesta && estadisticas.fechaUltimaRespuesta ? `
      <div class="section">
        <h3>Período de Evaluación</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${new Date(estadisticas.fechaPrimeraRespuesta).toLocaleDateString('es-ES')}</div>
            <div class="stat-label">Primera Respuesta</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${new Date(estadisticas.fechaUltimaRespuesta).toLocaleDateString('es-ES')}</div>
            <div class="stat-label">Última Respuesta</div>
          </div>
        </div>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Reporte generado automáticamente por el sistema SafeHaven.</p>
        <p>Confidencial - Solo para administradores del sistema.</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generarPDFEncuesta,
  generarPDFEstadisticas
};

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'QRS_DEFINITIVOS_IMPRENTA');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const BASE_URL = 'https://www.aytohuelma.es/cipajarillo/';

const ITEMS = [
  {
    num: 'PORTAL',
    id: 0,
    title: 'Portal General del Santuario',
    desc: 'Acceso global, audioguías e información general de visita',
    url: BASE_URL + 'index.html'
  },
  {
    num: '01',
    id: 1,
    title: 'La Cabeza de Lobo',
    desc: 'Escultura cumbre ibérica en caliza · Siglo IV a.C.',
    url: BASE_URL + 'punto.html?id=1'
  },
  {
    num: '02',
    id: 2,
    title: 'El Monumento Heroico Escalonado',
    desc: 'Arquitectura escalonada en terrazas sobre el Jandulilla',
    url: BASE_URL + 'punto.html?id=2'
  },
  {
    num: '03',
    id: 3,
    title: 'El Territorio de Iltiraka',
    desc: 'Colonización de la silva salvaje y dominio del pagus',
    url: BASE_URL + 'punto.html?id=3'
  },
  {
    num: '04',
    id: 4,
    title: 'Un Paisaje Sagrado',
    desc: 'El camino ritual procesional y El Fontanar',
    url: BASE_URL + 'punto.html?id=4'
  },
  {
    num: '05',
    id: 5,
    title: 'El Guerrero de la Falcata y los Leones',
    desc: 'Combate heroico y fieras protectoras del santuario',
    url: BASE_URL + 'punto.html?id=5'
  },
  {
    num: '06',
    id: 6,
    title: 'Los Grifos y Seres Alados',
    desc: 'Mitología orientalizante y guardianes míticos del umbral',
    url: BASE_URL + 'punto.html?id=6'
  },
  {
    num: '07',
    id: 7,
    title: 'La Falcata Ibérica y el Armamento Sagrado',
    desc: 'Insignia de prestigio y combate civilizador del príncipe',
    url: BASE_URL + 'punto.html?id=7'
  },
  {
    num: '08',
    id: 8,
    title: 'La Loma del Perro',
    desc: 'Asentamiento satélite y control estratégico del valle',
    url: BASE_URL + 'punto.html?id=8'
  },
  {
    num: '09',
    id: 9,
    title: 'Las Campañas Arqueológicas de 1994 y BIC',
    desc: 'Excavación científica de urgencia y rescate patrimonial',
    url: BASE_URL + 'punto.html?id=9'
  },
  {
    num: '10',
    id: 10,
    title: 'Centro de Interpretación y Reconstrucción 3D',
    desc: 'Museografía interactiva, tecnología y mediación cultural',
    url: BASE_URL + 'punto.html?id=10'
  },
  {
    num: '11',
    id: 11,
    title: 'Punto 11',
    desc: 'Punto de recorrido disponible',
    url: BASE_URL + 'punto.html?id=11'
  },
  {
    num: '12',
    id: 12,
    title: 'Punto 12',
    desc: 'Punto de recorrido disponible',
    url: BASE_URL + 'punto.html?id=12'
  },
  {
    num: '13',
    id: 13,
    title: 'Punto 13',
    desc: 'Punto de recorrido disponible',
    url: BASE_URL + 'punto.html?id=13'
  },
  {
    num: '14',
    id: 14,
    title: 'Punto 14',
    desc: 'Punto de recorrido disponible',
    url: BASE_URL + 'punto.html?id=14'
  },
  {
    num: '15',
    id: 15,
    title: 'Punto 15',
    desc: 'Punto de recorrido disponible',
    url: BASE_URL + 'punto.html?id=15'
  }
];

async function generateAll() {
  console.log('Generando los 15 códigos QR oficiales + Portal (ISO/IEC 18004)...');

  let manifestTxt = 'RELACIÓN OFICIAL DE CÓDIGOS QR Y ENLACES DEFINITIVOS PARA PRODUCCIÓN\n';
  manifestTxt += 'Centro de Interpretación Santuario Ibérico de “El Pajarillo” · Ayuntamiento de Huelma\n';
  manifestTxt += '===================================================================================\n\n';

  let htmlCards = '';

  for (const item of ITEMS) {
    const slug = item.title.toLowerCase()
      .replace(/ /g, '_')
      .replace(/[áä]/g, 'a')
      .replace(/[éë]/g, 'e')
      .replace(/[íï]/g, 'i')
      .replace(/[óö]/g, 'o')
      .replace(/[úü]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9_]/g, '');

    const baseName = `QR_PUNTO_${item.num}_${slug}`;
    const pngPath = path.join(outDir, `${baseName}.png`);
    const svgPath = path.join(outDir, `${baseName}.svg`);

    // 1. Generar PNG oficial de Ultra Alta Calidad (1024px, 300DPI, ISO/IEC 18004)
    await QRCode.toFile(pngPath, item.url, {
      type: 'png',
      width: 1024,
      margin: 4,
      color: {
        dark: '#384F3E', // Verde corporativo oficial del Santuario de El Pajarillo
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // 30% recuperación (máxima resistencia física en paneles exteriores)
    });

    // 2. Generar SVG Vectorial puro para InDesign/Illustrator
    const svgString = await QRCode.toString(item.url, {
      type: 'svg',
      margin: 4,
      color: {
        dark: '#384F3E',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    fs.writeFileSync(svgPath, svgString, 'utf-8');

    manifestTxt += `PUNTO ${item.num}: ${item.title}\n`;
    manifestTxt += `  Descripción: ${item.desc}\n`;
    manifestTxt += `  URL Permanente: ${item.url}\n`;
    manifestTxt += `  Archivo Vectorial (SVG): ${baseName}.svg\n`;
    manifestTxt += `  Archivo Imagen HD (PNG): ${baseName}.png\n\n`;

    const localLink = item.id === 0 ? '../index.html' : `../punto.html?id=${item.id}`;

    htmlCards += `
      <div class="card">
        <span class="badge">PUNTO ${item.num}</span>
        <h3>${item.title}</h3>
        <p class="desc">${item.desc}</p>
        <div class="qr-wrap">
          <img src="./${baseName}.png" alt="QR ${item.title}">
        </div>
        <div class="url-badge">${item.url}</div>
        <a href="${localLink}" target="_blank" class="btn" style="background: #2E7D32; color: white; margin-bottom: 8px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(46,125,50,0.25);">
          👁️ Ver Ficha Local Actualizada
        </a>
        <div class="btn-group">
          <a href="./${baseName}.png" download class="btn btn-primary">⬇ PNG HD</a>
          <a href="./${baseName}.svg" download class="btn btn-outline">⬇ SVG</a>
        </div>
      </div>
    `;

    console.log(`✓ Generado Punto ${item.num}: ${item.title}`);
  }

  // Guardar archivo de texto con todas las URLs oficiales
  fs.writeFileSync(path.join(outDir, 'LEEME_URLS_IMPRENTA.txt'), manifestTxt, 'utf-8');

  // Guardar visor interactivo HTML para escanear y probar directamente en pantalla
  const testerHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Verificador Oficial de 15 Códigos QR · El Pajarillo</title>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #F4F6F4; color: #222; padding: 2rem 1rem 4rem; }
    .container { max-width: 1300px; margin: 0 auto; }
    header { background: white; padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid #D8DFD9; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
    h1 { font-family: 'Barlow Condensed', sans-serif; font-size: 2.2rem; color: #384F3E; text-transform: uppercase; }
    .test-banner { background: #E8F5E9; border-left: 5px solid #2E7D32; padding: 1.2rem 1.5rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.98rem; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
    .card { background: white; border: 1px solid #D8DFD9; border-radius: 12px; padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .badge { position: absolute; top: 1rem; left: 1rem; background: rgba(56, 79, 62, 0.1); color: #384F3E; font-weight: 800; font-size: 0.8rem; padding: 4px 12px; border-radius: 20px; }
    h3 { font-family: 'Barlow Condensed', sans-serif; font-size: 1.45rem; color: #384F3E; margin-top: 1.8rem; margin-bottom: 0.35rem; }
    .desc { font-size: 0.85rem; color: #666; margin-bottom: 1.1rem; min-height: 38px; }
    .qr-wrap { width: 250px; height: 250px; background: white; padding: 10px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; }
    .qr-wrap img { width: 100%; height: 100%; object-fit: contain; }
    .url-badge { font-family: monospace; font-size: 0.76rem; background: #EEF2EE; padding: 7px 10px; border-radius: 6px; word-break: break-all; margin-bottom: 1.25rem; width: 100%; color: #333; }
    .btn-group { display: flex; gap: 8px; width: 100%; }
    .btn { flex: 1; padding: 9px 12px; font-size: 0.84rem; font-weight: 700; border-radius: 6px; text-decoration: none; text-align: center; }
    .btn-primary { background: #384F3E; color: white; border: 1.5px solid #384F3E; }
    .btn-outline { background: white; color: #384F3E; border: 1.5px solid #384F3E; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>Colección Oficial: 15 Puntos QR · El Pajarillo</h1>
        <p style="color: #666; font-size: 0.92rem; margin-top: 0.2rem;">Centro de Interpretación Santuario Ibérico de “El Pajarillo” · Ayuntamiento de Huelma</p>
      </div>
      <a href="../QRS_DEFINITIVOS_IMPRENTA.zip" download style="background: #2E7D32; color: white; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px;">
        📦 Descargar Pack Completo de 15 QRs (ZIP)
      </a>
    </header>

    <div class="test-banner">
      <strong>📱 Comprobación con Cámara Móvil:</strong><br>
      Apunta la cámara de tu móvil a <strong>cualquiera de los 15 códigos QR</strong>. Verás que tu teléfono lo reconoce al instante mostrando su enlace permanente respectivo. Si en el futuro solo se colocan 10 o 12 paneles físicos, los sobrantes simplemente no se imprimen o se desactivan desde el panel de control sin ningún inconveniente.
    </div>

    <div class="grid">
      ${htmlCards}
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'probar_qrs_en_pantalla.html'), testerHtml, 'utf-8');
  console.log('\n¡Todos los 15 códigos QR oficiales + Portal generados con éxito!');
}

generateAll().catch(console.error);

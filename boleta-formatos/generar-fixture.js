// Genera los PDF de ejemplo en fixtures/ usados por index.test.js.
// Todos los datos son ficticios (stub), nunca boletas reales.
// Uso: node boleta-formatos/generar-fixture.js
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

async function generarEjemploPlantilla() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 200]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const rut = '11111111-1';
  const folio = '100001';

  page.drawText('BOLETA DE HONORARIOS ELECTRONICA', { x: 20, y: 170, size: 12, font });
  page.drawText(`R.U.T. Emisor: ${rut}`, { x: 20, y: 140, size: 10, font });
  page.drawText(`N° BHE: ${folio}`, { x: 20, y: 120, size: 10, font });
  page.drawText('Fecha Emision: 01-01-2026 (dato ficticio)', { x: 20, y: 100, size: 10, font });

  const bytes = await doc.save();
  fs.writeFileSync(path.join(FIXTURES_DIR, 'ejemplo-plantilla.pdf'), bytes);
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'ejemplo-plantilla.json'),
    JSON.stringify({ rut, folio }, null, 2) + '\n'
  );
}

async function generarSiiBheEstandar() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 400]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const symbol = await doc.embedFont(StandardFonts.Symbol);

  const rut = '11111111-K';
  const folio = '200002';

  // El SII escribe el RUT con signo menos (U+2212), que Helvetica no trae: se
  // dibuja con Symbol para que el fixture cubra ese caso igual que una boleta real.
  const dibujarConMenos = (antes, despues, { x, y, size }) => {
    page.drawText(antes, { x, y, size, font });
    const xMenos = x + font.widthOfTextAtSize(antes, size);
    page.drawText('−', { x: xMenos, y, size, font: symbol });
    page.drawText(despues, { x: xMenos + symbol.widthOfTextAtSize('−', size), y, size, font });
  };

  page.drawText('NOMBRE FICTICIO APELLIDO APELLIDO', { x: 20, y: 370, size: 12, font });
  page.drawText('BOLETA DE HONORARIOS', { x: 20, y: 350, size: 10, font });
  page.drawText('ELECTRONICA', { x: 20, y: 335, size: 10, font });
  page.drawText(`N ° ${folio}`, { x: 20, y: 320, size: 10, font });
  dibujarConMenos('RUT: 11.111.111', 'K', { x: 20, y: 300, size: 10 });
  page.drawText('Fecha: 1 de Enero de 2026', { x: 20, y: 280, size: 10, font });
  dibujarConMenos('Señor(es): RECEPTOR FICTICIO Rut: 22.222.222', ' 2', { x: 20, y: 260, size: 10 });
  page.drawText('Por atención profesional:', { x: 20, y: 240, size: 10, font });
  page.drawText('Total Honorarios: $: 10.000', { x: 20, y: 220, size: 10, font });
  page.drawText('Res. Ex. N° 83 de 30/08/2004', { x: 20, y: 200, size: 10, font });
  page.drawText('Verifique este documento en www.sii.cl', { x: 20, y: 185, size: 10, font });

  const bytes = await doc.save();
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sii-bhe-estandar.pdf'), bytes);
  fs.writeFileSync(
    path.join(FIXTURES_DIR, 'sii-bhe-estandar.json'),
    JSON.stringify({ rut, folio }, null, 2) + '\n'
  );
}

async function main() {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  await generarEjemploPlantilla();
  await generarSiiBheEstandar();
  console.log('Fixtures generados en boleta-formatos/fixtures/');
}

main();

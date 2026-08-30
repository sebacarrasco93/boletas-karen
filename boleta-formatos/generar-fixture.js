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

async function main() {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  await generarEjemploPlantilla();
  console.log('Fixtures generados en boleta-formatos/fixtures/');
}

main();

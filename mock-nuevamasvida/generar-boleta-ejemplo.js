// Genera una boleta de ejemplo (datos 100% ficticios) en DEJAR_BOLETAS_MOCK,
// para poder probar pnpm start:mock / CI sin necesitar ningún documento real.
// El RUT y folio calzan con cypress.mock.env.json y solicitudes-mock.json,
// así que también sirve para ejercitar revisar-aprobadas:mock de punta a punta.
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const CARPETA = path.join(__dirname, '..', 'DEJAR_BOLETAS_MOCK');

async function main() {
  fs.mkdirSync(CARPETA, { recursive: true });

  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 200]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText('BOLETA DE HONORARIOS ELECTRONICA', { x: 20, y: 170, size: 12, font });
  page.drawText('R.U.T. Emisor: 22222222-2', { x: 20, y: 140, size: 10, font });
  page.drawText('N° BHE: 9001', { x: 20, y: 120, size: 10, font });

  const rutaDestino = path.join(CARPETA, 'boleta-ejemplo.pdf');
  fs.writeFileSync(rutaDestino, await doc.save());
  console.log(`Boleta de ejemplo creada en ${rutaDestino}`);
}

main();

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { moverBoletasAprobadas } from './mover-aprobadas.js';

// Genera un PDF que calza con el formato "ejemplo-plantilla" registrado en
// boleta-formatos/index.js, para que extraerDatosBoleta() lo reconozca de verdad.
async function crearBoletaDePrueba(rutaDestino, { rut, folio }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 200]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText('BOLETA DE HONORARIOS ELECTRONICA', { x: 20, y: 170, size: 12, font });
  page.drawText(`R.U.T. Emisor: ${rut}`, { x: 20, y: 140, size: 10, font });
  page.drawText(`N° BHE: ${folio}`, { x: 20, y: 120, size: 10, font });

  fs.writeFileSync(rutaDestino, await doc.save());
}

let carpetaOrigen;
let carpetaDestino;

beforeEach(() => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'boletas-karen-revisar-'));
  carpetaOrigen = path.join(base, 'DEJAR_BOLETAS');
  carpetaDestino = path.join(base, 'PARA_ENVIAR', 'zip');
  fs.mkdirSync(carpetaOrigen, { recursive: true });
});

afterEach(() => {
  fs.rmSync(path.dirname(carpetaOrigen), { recursive: true, force: true });
});

describe('moverBoletasAprobadas', () => {
  it('mueve una boleta ya subida cuyo folio quedó AUTORIZADA, sin el prefijo __SUBIDA__', async () => {
    await crearBoletaDePrueba(path.join(carpetaOrigen, '__SUBIDA__boleta-aprobada.pdf'), { rut: '11111111-1', folio: '111' });

    const resultado = await moverBoletasAprobadas({
      carpetaOrigen,
      carpetaDestino,
      folios: [{ folio: '111', aprobado: true, motivoRechazo: null }],
    });

    expect(resultado.movidas).toEqual([
      { folio: '111', archivo: '__SUBIDA__boleta-aprobada.pdf', destino: path.join(carpetaDestino, 'boleta-aprobada.pdf') },
    ]);
    expect(fs.existsSync(path.join(carpetaDestino, 'boleta-aprobada.pdf'))).toBe(true);
    expect(fs.existsSync(path.join(carpetaOrigen, '__SUBIDA__boleta-aprobada.pdf'))).toBe(false);
  });

  it('reporta como rechazada una boleta cuyo folio quedó DEVUELTA (y no la mueve)', async () => {
    await crearBoletaDePrueba(path.join(carpetaOrigen, '__SUBIDA__boleta-rechazada.pdf'), { rut: '11111111-1', folio: '222' });

    const resultado = await moverBoletasAprobadas({
      carpetaOrigen,
      carpetaDestino,
      folios: [{ folio: '222', aprobado: false, motivoRechazo: 'ANTECEDENTES INSUFICIENTES' }],
    });

    expect(resultado.movidas).toEqual([]);
    expect(resultado.rechazadas).toEqual([
      { folio: '222', archivo: '__SUBIDA__boleta-rechazada.pdf', motivoRechazo: 'ANTECEDENTES INSUFICIENTES' },
    ]);
    expect(fs.existsSync(path.join(carpetaOrigen, '__SUBIDA__boleta-rechazada.pdf'))).toBe(true);
  });

  it('no toca una boleta cuyo folio no aparece todavía en el portal (sigue en revisión)', async () => {
    await crearBoletaDePrueba(path.join(carpetaOrigen, '__SUBIDA__boleta-en-revision.pdf'), { rut: '11111111-1', folio: '333' });

    const resultado = await moverBoletasAprobadas({ carpetaOrigen, carpetaDestino, folios: [] });

    expect(resultado.movidas).toEqual([]);
    expect(resultado.rechazadas).toEqual([]);
    expect(fs.existsSync(path.join(carpetaOrigen, '__SUBIDA__boleta-en-revision.pdf'))).toBe(true);
  });

  it('nunca mueve boletas de prueba, aunque su folio esté AUTORIZADA', async () => {
    await crearBoletaDePrueba(path.join(carpetaOrigen, '__SUBIDA__PRUEBA_test.pdf'), { rut: '11111111-1', folio: '444' });

    const resultado = await moverBoletasAprobadas({
      carpetaOrigen,
      carpetaDestino,
      folios: [{ folio: '444', aprobado: true, motivoRechazo: null }],
    });

    expect(resultado.movidas).toEqual([]);
    expect(fs.existsSync(path.join(carpetaOrigen, '__SUBIDA__PRUEBA_test.pdf'))).toBe(true);
  });

  it('marca como ambigua si dos archivos locales comparten el mismo folio, y no mueve ninguno', async () => {
    await crearBoletaDePrueba(path.join(carpetaOrigen, '__SUBIDA__uno.pdf'), { rut: '11111111-1', folio: '555' });
    await crearBoletaDePrueba(path.join(carpetaOrigen, '__SUBIDA__dos.pdf'), { rut: '22222222-2', folio: '555' });

    const resultado = await moverBoletasAprobadas({
      carpetaOrigen,
      carpetaDestino,
      folios: [{ folio: '555', aprobado: true, motivoRechazo: null }],
    });

    expect(resultado.movidas).toEqual([]);
    expect(resultado.ambiguas).toHaveLength(1);
    expect(resultado.ambiguas[0].folio).toBe('555');
  });

  it('no explota si la carpeta de origen no existe', async () => {
    const resultado = await moverBoletasAprobadas({
      carpetaOrigen: path.join(carpetaOrigen, 'no-existe'),
      carpetaDestino,
      folios: [{ folio: '111', aprobado: true, motivoRechazo: null }],
    });

    expect(resultado).toEqual({ movidas: [], rechazadas: [], ambiguas: [] });
  });
});

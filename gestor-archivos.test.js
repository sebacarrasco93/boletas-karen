import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  asegurarCarpeta,
  obtenerArchivosEnCarpeta,
  renombrarArchivo,
  eliminarArchivosYaSubidos,
  eliminarBoletasDePrueba,
} from './gestor-archivos.js';

let carpeta;

beforeEach(() => {
  carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'boletas-karen-test-'));
});

afterEach(() => {
  fs.rmSync(carpeta, { recursive: true, force: true });
});

describe('asegurarCarpeta', () => {
  it('crea la carpeta si no existe (evita el crash que pasó en producción)', () => {
    const carpetaInexistente = path.join(carpeta, 'no-existe-todavia');
    expect(fs.existsSync(carpetaInexistente)).toBe(false);

    asegurarCarpeta(carpetaInexistente);

    expect(fs.existsSync(carpetaInexistente)).toBe(true);
  });
});

describe('obtenerArchivosEnCarpeta', () => {
  it('ignora archivos ya subidos y no-PDFs', () => {
    fs.writeFileSync(path.join(carpeta, 'boleta-1.pdf'), '');
    fs.writeFileSync(path.join(carpeta, 'boleta-2.pdf'), '');
    fs.writeFileSync(path.join(carpeta, '__SUBIDA__boleta-vieja.pdf'), '');
    fs.writeFileSync(path.join(carpeta, 'notas.txt'), '');

    const archivos = obtenerArchivosEnCarpeta(carpeta);

    expect(archivos.sort()).toEqual(['boleta-1.pdf', 'boleta-2.pdf']);
  });

  it('ignora la subcarpeta informes/ (los informes viven ahí, no sueltos)', () => {
    fs.writeFileSync(path.join(carpeta, 'boleta-1.pdf'), '');
    fs.mkdirSync(path.join(carpeta, 'informes'));
    fs.writeFileSync(path.join(carpeta, 'informes', 'kinesiologia.pdf'), '');

    const archivos = obtenerArchivosEnCarpeta(carpeta);

    expect(archivos).toEqual(['boleta-1.pdf']);
  });

  it('incluye boletas de prueba (prefijo PRUEBA_, un solo guion bajo)', () => {
    fs.writeFileSync(path.join(carpeta, 'PRUEBA_boleta.pdf'), '');

    expect(obtenerArchivosEnCarpeta(carpeta)).toEqual(['PRUEBA_boleta.pdf']);
  });

  it('devuelve vacío si la carpeta no existe (no debería abrir el navegador)', () => {
    const carpetaInexistente = path.join(carpeta, 'no-existe');

    expect(obtenerArchivosEnCarpeta(carpetaInexistente)).toEqual([]);
  });
});

describe('renombrarArchivo', () => {
  it('le agrega el prefijo __SUBIDA__', () => {
    fs.writeFileSync(path.join(carpeta, 'boleta.pdf'), 'contenido');

    renombrarArchivo(carpeta, 'boleta.pdf');

    expect(fs.existsSync(path.join(carpeta, '__SUBIDA__boleta.pdf'))).toBe(true);
    expect(fs.existsSync(path.join(carpeta, 'boleta.pdf'))).toBe(false);
  });
});

describe('eliminarArchivosYaSubidos', () => {
  it('borra el original si coexiste con su versión __SUBIDA__', () => {
    fs.writeFileSync(path.join(carpeta, 'boleta.pdf'), '');
    fs.writeFileSync(path.join(carpeta, '__SUBIDA__boleta.pdf'), '');

    eliminarArchivosYaSubidos(carpeta);

    expect(fs.existsSync(path.join(carpeta, 'boleta.pdf'))).toBe(false);
    expect(fs.existsSync(path.join(carpeta, '__SUBIDA__boleta.pdf'))).toBe(true);
  });

  it('no toca archivos que no tienen versión __SUBIDA__', () => {
    fs.writeFileSync(path.join(carpeta, 'boleta-pendiente.pdf'), '');

    eliminarArchivosYaSubidos(carpeta);

    expect(fs.existsSync(path.join(carpeta, 'boleta-pendiente.pdf'))).toBe(true);
  });
});

describe('eliminarBoletasDePrueba', () => {
  it('borra las boletas de prueba ya subidas (__SUBIDA__PRUEBA_...)', () => {
    fs.writeFileSync(path.join(carpeta, '__SUBIDA__PRUEBA_boleta.pdf'), '');

    eliminarBoletasDePrueba(carpeta);

    expect(fs.existsSync(path.join(carpeta, '__SUBIDA__PRUEBA_boleta.pdf'))).toBe(false);
  });

  it('no toca boletas reales ya subidas', () => {
    fs.writeFileSync(path.join(carpeta, '__SUBIDA__boleta-real.pdf'), '');

    eliminarBoletasDePrueba(carpeta);

    expect(fs.existsSync(path.join(carpeta, '__SUBIDA__boleta-real.pdf'))).toBe(true);
  });

  it('no toca una boleta de prueba que todavía no se sube', () => {
    fs.writeFileSync(path.join(carpeta, 'PRUEBA_boleta.pdf'), '');

    eliminarBoletasDePrueba(carpeta);

    expect(fs.existsSync(path.join(carpeta, 'PRUEBA_boleta.pdf'))).toBe(true);
  });
});

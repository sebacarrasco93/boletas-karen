import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatos, extraerDatosBoleta } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

const idsConFixture = fs
  .readdirSync(FIXTURES_DIR)
  .filter((archivo) => archivo.endsWith('.pdf'))
  .map((archivo) => archivo.replace(/\.pdf$/, ''));

describe('boleta-formatos', () => {
  it('no hay dos formatos registrados con el mismo id', () => {
    const ids = formatos.map((formato) => formato.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada formato registrado tiene su fixture de prueba (fixtures/<id>.pdf + .json)', () => {
    formatos.forEach((formato) => {
      expect(idsConFixture, `Falta fixtures/${formato.id}.pdf`).toContain(formato.id);
    });
  });

  idsConFixture.forEach((id) => {
    it(`reconoce y extrae correctamente el formato "${id}"`, async () => {
      const pdfPath = path.join(FIXTURES_DIR, `${id}.pdf`);
      const jsonPath = path.join(FIXTURES_DIR, `${id}.json`);
      const esperado = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

      const resultado = await extraerDatosBoleta(pdfPath);

      expect(resultado.formatoId).toBe(id);
      expect(resultado.rut).toBe(esperado.rut);
      expect(resultado.folio).toBe(esperado.folio);
    });
  });
});

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearSolicitudes, agruparPorFolio } from './parsear-estado.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'estado-reembolso-ejemplo.html'),
  'utf-8'
);

describe('parsearSolicitudes', () => {
  it('extrae las 4 solicitudes del fixture', () => {
    const solicitudes = parsearSolicitudes(html);
    expect(solicitudes).toHaveLength(4);
  });

  it('lee estado y folio de una solicitud autorizada', () => {
    const solicitudes = parsearSolicitudes(html);
    const primera = solicitudes.find((s) => s.solicitudId === '900000000001');

    expect(primera.estado).toBe('AUTORIZADA');
    expect(primera.folio).toBe('111');
    expect(primera.motivoRechazo).toBeNull();
  });

  it('lee estado, folio y motivo de una solicitud devuelta (con &nbsp; extra en el label)', () => {
    const solicitudes = parsearSolicitudes(html);
    const devuelta = solicitudes.find((s) => s.solicitudId === '900000000002');

    expect(devuelta.estado).toBe('DEVUELTA');
    expect(devuelta.folio).toBe('222');
    expect(devuelta.motivoRechazo).toBe('ANTECEDENTES INSUFICIENTES');
  });
});

describe('agruparPorFolio', () => {
  it('un folio solo devuelto queda marcado como no aprobado, con su motivo', () => {
    const grupos = agruparPorFolio(parsearSolicitudes(html));
    const folio222 = grupos.find((g) => g.folio === '222');

    expect(folio222.aprobado).toBe(false);
    expect(folio222.motivoRechazo).toBe('ANTECEDENTES INSUFICIENTES');
  });

  it('un folio devuelto y luego autorizado en otra solicitud queda aprobado', () => {
    const grupos = agruparPorFolio(parsearSolicitudes(html));
    const folio333 = grupos.find((g) => g.folio === '333');

    expect(folio333.aprobado).toBe(true);
    expect(folio333.motivoRechazo).toBeNull();
  });

  it('un folio autorizado directo queda aprobado', () => {
    const grupos = agruparPorFolio(parsearSolicitudes(html));
    const folio111 = grupos.find((g) => g.folio === '111');

    expect(folio111.aprobado).toBe(true);
  });
});

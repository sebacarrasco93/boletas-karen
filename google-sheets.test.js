import { describe, it, expect } from 'vitest';
import { registrarBoletaSubida } from './google-sheets.js';

// Estos tests solo cubren los caminos "sin red": el tracking es best-effort y
// nunca debe lanzar, así que confirmamos que cuando falta configuración (o el
// archivo de credenciales no existe) resuelve en false en vez de explotar.
// La llamada real a la API de Sheets no se testea acá (requeriría mockear
// googleapis); se verifica manualmente al configurar el tracking.
describe('registrarBoletaSubida', () => {
  it('resuelve en false si no hay config de Google Sheets', async () => {
    const resultado = await registrarBoletaSubida(undefined, { archivo: 'x.pdf' });
    expect(resultado).toBe(false);
  });

  it('resuelve en false si falta SPREADSHEET_ID', async () => {
    const resultado = await registrarBoletaSubida(
      { SERVICE_ACCOUNT_KEY_PATH: 'google-credentials.json' },
      { archivo: 'x.pdf' }
    );
    expect(resultado).toBe(false);
  });

  it('resuelve en false si el archivo de credenciales no existe', async () => {
    const resultado = await registrarBoletaSubida(
      { SPREADSHEET_ID: 'abc123', SERVICE_ACCOUNT_KEY_PATH: 'no-existe.json' },
      { archivo: 'x.pdf' }
    );
    expect(resultado).toBe(false);
  });
});

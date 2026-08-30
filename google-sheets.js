const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const RANGO_POR_DEFECTO = 'Boletas!A:I';

async function registrarBoletaSubida(configGoogleSheets, datos) {
  const config = configGoogleSheets || {};
  const { SPREADSHEET_ID, SERVICE_ACCOUNT_KEY_PATH, RANGO } = config;

  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_KEY_PATH) {
    console.warn('[GoogleSheets] Tracking no configurado (falta SPREADSHEET_ID o SERVICE_ACCOUNT_KEY_PATH), se omite el registro.');
    return false;
  }

  const rutaLlave = path.resolve(SERVICE_ACCOUNT_KEY_PATH);

  if (!fs.existsSync(rutaLlave)) {
    console.warn(`[GoogleSheets] No se encontró el archivo de credenciales en ${rutaLlave}, se omite el registro.`);
    return false;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: rutaLlave,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGO || RANGO_POR_DEFECTO,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        datos.fecha,
        datos.archivo,
        datos.rutProfesional,
        datos.nombreProfesional,
        datos.tipoConsulta,
        datos.folio,
        datos.esPrueba ? 'SI' : 'NO',
        datos.estado,
        datos.formatoId || '',
      ]],
    },
  });

  return true;
}

module.exports = { registrarBoletaSubida };

const { PDFParse } = require('pdf-parse');
const fs = require('fs');

// Registro de formatos de Boleta de Honorarios Electrónica (BHE) conocidos.
// El ORDEN del array es la prioridad: se prueba el primero que "detecta" un
// match, de arriba hacia abajo. Pon los formatos más comunes primero.
//
// Cada formato define:
//   id: identificador corto (se usa para trackear en Google Sheets)
//   descripcion: para que un humano entienda de qué boleta se trata
//   detectar(texto): true/false, ¿el texto de este PDF corresponde a este formato?
//   extraer(texto): { rut, folio } a partir del texto del PDF
//
// Este archivo se puede editar a mano, pero la forma recomendada de agregar
// un formato nuevo es con el comando /analizar-boleta (ver .claude/commands/),
// dándole a Claude un PDF real de ejemplo para que arme el patrón.
//
// Cada formato debería tener un PDF de ejemplo (con datos ficticios/stub, nunca
// datos reales) en fixtures/<id>.pdf + fixtures/<id>.json con el {rut, folio}
// esperado. Correr `pnpm test:pdf` valida que cada patrón siga extrayendo bien.
const formatos = [
  {
    // ⚠️ PLANTILLA DE EJEMPLO: sirve para probar el motor de detección/extracción
    // y como referencia de cómo escribir un formato nuevo. NO está verificada
    // contra una boleta real del SII. Va al final de la prioridad a propósito:
    // cuando agregues formatos reales con /analizar-boleta, ponlos antes que este.
    id: 'ejemplo-plantilla',
    descripcion: 'Plantilla de referencia (texto simple, sin logo) usada solo para testear el motor de extracción con datos ficticios.',
    detectar: (texto) => /BOLETA DE HONORARIOS ELECTRONICA/i.test(texto) && /R\.?U\.?T\.?\s*Emisor/i.test(texto),
    extraer: (texto) => {
      const rutMatch = texto.match(/R\.?U\.?T\.?\s*Emisor:?\s*([\d.]+-[\dkK])/i);
      const folioMatch = texto.match(/N[°ºo]\s*BHE:?\s*(\d+)/i);

      return {
        rut: rutMatch ? rutMatch[1] : null,
        folio: folioMatch ? folioMatch[1] : null,
      };
    },
  },
];

function limpiarRut(rutCrudo) {
  if (!rutCrudo) return null;
  return rutCrudo.replace(/\./g, '').trim();
}

async function extraerTexto(rutaPdf) {
  const data = fs.readFileSync(rutaPdf);
  const parser = new PDFParse({ data });
  try {
    const resultado = await parser.getText();
    return resultado.text;
  } finally {
    await parser.destroy();
  }
}

async function extraerDatosBoleta(rutaPdf) {
  const texto = await extraerTexto(rutaPdf);

  for (const formato of formatos) {
    if (formato.detectar(texto)) {
      const { rut, folio } = formato.extraer(texto);

      if (rut && folio) {
        return { rut: limpiarRut(rut), folio, formatoId: formato.id, texto };
      }
    }
  }

  return { rut: null, folio: null, formatoId: null, texto };
}

module.exports = { formatos, extraerDatosBoleta, extraerTexto, limpiarRut };

const fs = require('fs');
const path = require('path');
const { PREFIJO_SUBIDA, PREFIJO_PRUEBA } = require('../constantes');
const { extraerDatosBoleta } = require('../boleta-formatos');

// Cruza los folios aprobados/rechazados (de parsear-estado.js) contra las
// boletas ya subidas en carpetaOrigen (DEJAR_BOLETAS), y mueve a
// carpetaDestino (PARA_ENVIAR/zip) las que ya están AUTORIZADA. No toca las
// boletas de prueba (PREFIJO_PRUEBA) ni las que siguen "en revisión" (ningún
// folio del portal calza con ellas todavía).
async function moverBoletasAprobadas({ carpetaOrigen, carpetaDestino, folios }) {
  const resultado = { movidas: [], rechazadas: [], ambiguas: [] };

  if (!fs.existsSync(carpetaOrigen)) {
    return resultado;
  }

  const infoPorFolio = new Map(folios.map((info) => [info.folio, info]));

  const candidatos = fs.readdirSync(carpetaOrigen).filter((archivo) => {
    return archivo.startsWith(PREFIJO_SUBIDA) && !archivo.startsWith(`${PREFIJO_SUBIDA}${PREFIJO_PRUEBA}`);
  });

  // folio -> [archivos locales con ese folio] (normalmente debería ser 1)
  const localesPorFolio = new Map();

  for (const archivo of candidatos) {
    let datos;

    try {
      datos = await extraerDatosBoleta(path.join(carpetaOrigen, archivo));
    } catch (error) {
      console.warn(`[revisar-aprobadas] No se pudo leer ${archivo}:`, error.message);
      continue;
    }

    if (!datos.folio) continue;

    const lista = localesPorFolio.get(datos.folio) || [];
    lista.push(archivo);
    localesPorFolio.set(datos.folio, lista);
  }

  fs.mkdirSync(carpetaDestino, { recursive: true });

  for (const [folio, archivos] of localesPorFolio.entries()) {
    const info = infoPorFolio.get(folio);

    // Sin info del portal para este folio: probablemente sigue en revisión, no se toca.
    if (!info) continue;

    if (archivos.length > 1) {
      resultado.ambiguas.push({ folio, archivos, motivo: 'más de un archivo local con el mismo folio' });
      continue;
    }

    const archivo = archivos[0];

    if (info.aprobado) {
      const nombreLimpio = archivo.slice(PREFIJO_SUBIDA.length);
      const rutaDestino = path.join(carpetaDestino, nombreLimpio);

      if (fs.existsSync(rutaDestino)) {
        resultado.ambiguas.push({ folio, archivos: [archivo], motivo: `ya existe ${nombreLimpio} en destino` });
        continue;
      }

      fs.renameSync(path.join(carpetaOrigen, archivo), rutaDestino);
      resultado.movidas.push({ folio, archivo, destino: rutaDestino });
    } else if (info.motivoRechazo) {
      resultado.rechazadas.push({ folio, archivo, motivoRechazo: info.motivoRechazo });
    }
  }

  return resultado;
}

module.exports = { moverBoletasAprobadas };

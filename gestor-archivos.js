const fs = require('fs');
const path = require('path');
const { PREFIJO_SUBIDA, PREFIJO_PRUEBA } = require('./constantes');

function asegurarCarpeta(carpeta) {
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }
}

// Boletas pendientes: PDFs sueltos directo en la carpeta (no en subcarpetas,
// como informes/) que no estén ya marcados como subidos. Los informes viven
// aparte en informes/, así que no hace falta filtrarlos por nombre.
function obtenerArchivosEnCarpeta(carpeta) {
  asegurarCarpeta(carpeta);
  const archivos = fs.readdirSync(carpeta);

  return archivos.filter((archivo) => {
    if (archivo.includes(PREFIJO_SUBIDA)) return false;
    if (path.extname(archivo).toLowerCase() !== '.pdf') return false;

    return fs.statSync(path.join(carpeta, archivo)).isFile();
  });
}

function renombrarArchivo(carpeta, archivo) {
  asegurarCarpeta(carpeta);
  fs.renameSync(path.join(carpeta, archivo), path.join(carpeta, `${PREFIJO_SUBIDA}${archivo}`));
  return true;
}

// Si un archivo y su versión "ya subida" coexisten (se volvió a dejar el original
// por error), se descarta el original: ya sabemos que ese ya se subió.
function eliminarArchivosYaSubidos(carpeta) {
  asegurarCarpeta(carpeta);
  const archivos = fs.readdirSync(carpeta);

  archivos.forEach((archivo) => {
    const rutaOriginal = path.join(carpeta, archivo);
    const rutaSubida = path.join(carpeta, `${PREFIJO_SUBIDA}${archivo}`);

    if (fs.existsSync(rutaOriginal) && fs.existsSync(rutaSubida)) {
      fs.unlinkSync(rutaOriginal);
    }
  });

  return true;
}

// Las boletas de prueba (prefijo PRUEBA_) ya cumplieron su propósito una vez
// quedan marcadas como subidas; se limpian solas para poder reutilizar
// el mismo nombre en la próxima prueba sin dejar rastro en las solicitudes reales.
function eliminarBoletasDePrueba(carpeta) {
  asegurarCarpeta(carpeta);
  const archivos = fs.readdirSync(carpeta);

  archivos.forEach((archivo) => {
    if (archivo.startsWith(`${PREFIJO_SUBIDA}${PREFIJO_PRUEBA}`)) {
      fs.unlinkSync(path.join(carpeta, archivo));
    }
  });

  return true;
}

module.exports = {
  asegurarCarpeta,
  obtenerArchivosEnCarpeta,
  renombrarArchivo,
  eliminarArchivosYaSubidos,
  eliminarBoletasDePrueba,
};

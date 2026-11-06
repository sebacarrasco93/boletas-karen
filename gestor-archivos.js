const fs = require('fs');
const path = require('path');
const { PREFIJO_SUBIDA, PREFIJO_PRUEBA, CARPETA_SUBIDAS } = require('./constantes');

function asegurarCarpeta(carpeta) {
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
  }
}

// Boletas pendientes: PDFs sueltos directo en la carpeta (no en subcarpetas,
// como informes/ o subidas/). Los archivos con el prefijo antiguo ya se subieron.
function obtenerArchivosEnCarpeta(carpeta) {
  asegurarCarpeta(carpeta);
  const archivos = fs.readdirSync(carpeta);

  return archivos.filter((archivo) => {
    if (archivo.includes(PREFIJO_SUBIDA)) return false;
    if (path.extname(archivo).toLowerCase() !== '.pdf') return false;

    return fs.statSync(path.join(carpeta, archivo)).isFile();
  });
}

function moverASubidas(carpeta, archivo) {
  const carpetaSubidas = path.join(carpeta, CARPETA_SUBIDAS);
  asegurarCarpeta(carpetaSubidas);
  fs.renameSync(path.join(carpeta, archivo), path.join(carpetaSubidas, archivo));
  return true;
}

// Si un archivo ya está en subidas/ (se volvió a dejar el original por error),
// se descarta el original: ya sabemos que ese ya se subió.
function eliminarArchivosYaSubidos(carpeta) {
  asegurarCarpeta(carpeta);
  const archivos = fs.readdirSync(carpeta);

  archivos.forEach((archivo) => {
    const rutaOriginal = path.join(carpeta, archivo);
    const rutaSubida = path.join(carpeta, CARPETA_SUBIDAS, archivo);

    if (fs.existsSync(rutaOriginal) && fs.existsSync(rutaSubida)) {
      fs.unlinkSync(rutaOriginal);
    }
  });

  return true;
}

// Las boletas de prueba (prefijo PRUEBA_) ya cumplieron su propósito una vez
// quedan en subidas/; se limpian solas para poder reutilizar
// el mismo nombre en la próxima prueba sin dejar rastro en las solicitudes reales.
function eliminarBoletasDePrueba(carpeta) {
  const carpetaSubidas = path.join(carpeta, CARPETA_SUBIDAS);
  asegurarCarpeta(carpetaSubidas);
  const archivos = fs.readdirSync(carpetaSubidas);

  archivos.forEach((archivo) => {
    if (archivo.startsWith(PREFIJO_PRUEBA)) {
      fs.unlinkSync(path.join(carpetaSubidas, archivo));
    }
  });

  return true;
}

module.exports = {
  asegurarCarpeta,
  obtenerArchivosEnCarpeta,
  moverASubidas,
  eliminarArchivosYaSubidos,
  eliminarBoletasDePrueba,
};

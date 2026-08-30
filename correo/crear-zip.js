const fs = require('fs');
const { ZipArchive } = require('archiver');

// Comprime todo el contenido de carpetaOrigen (sin subcarpetas) en rutaZipDestino.
function crearZip(carpetaOrigen, rutaZipDestino) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(rutaZipDestino);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve(rutaZipDestino));
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(carpetaOrigen, false);
    archive.finalize();
  });
}

module.exports = { crearZip };

const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        obtenerArchivosEnCarpeta(carpeta) {
          const rutaCarpeta = path.join(__dirname, carpeta);
          const archivos = fs.readdirSync(carpeta);

          return archivos.filter((archivo) => {
            if (archivo !== 'Informe.pdf' || archivo.includes('__SUBIDA__')) {
              const extension = path.extname(archivo).toLowerCase();
              return extension === '.pdf';
            }
          });
        },
      });

      on('task', {
        renombrarArchivo(archivo) {
          return fs.renameSync('DEJAR_BOLETAS/'+archivo, 'DEJAR_BOLETAS/__SUBIDA__'+archivo) ? true : false;
        },
      });
      
      // implement node event listeners here
    },
  },
});

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
            if (archivo !== 'Informe.pdf' && ! archivo.includes('__SUBIDA__') && ! archivo.includes('__')) {
              const extension = path.extname(archivo).toLowerCase();
              return extension === '.pdf';
            }
          });
        },
      });

      on('task', {
        renombrarArchivo(archivo) {
          return fs.renameSync('DEJAR_BOLETAS/'+archivo, 'DEJAR_BOLETAS/__SUBIDA__'+archivo) ? true : false;
        }
      });

      on('task', {
        eliminarArchivosYaSubidos() {
          const archivos = fs.readdirSync('DEJAR_BOLETAS');

          archivos.forEach(archivo => {
            if (fs.existsSync('DEJAR_BOLETAS/'+archivo) && fs.existsSync('DEJAR_BOLETAS/__SUBIDA__'+archivo)) {
              return fs.unlinkSync('DEJAR_BOLETAS/'+archivo) ? true : false;
            }

            return false;
          });

          return true;
        }
      });
      
      // implement node event listeners here
    },
  },
});

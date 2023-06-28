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

          const archivosPDF = archivos.filter((archivo) => {
            if (archivo == 'Informe.pdf') {
              return false;
            }

            const extension = path.extname(archivo).toLowerCase();
            return extension === '.pdf';
          });
            
          return archivosPDF;
        },
      });
      
      // implement node event listeners here
    },
  },
});

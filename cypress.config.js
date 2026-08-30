const { defineConfig } = require("cypress");
const fs = require('fs');
const path = require('path');
const { registrarBoletaSubida: registrarEnGoogleSheets } = require('./google-sheets');
const { extraerDatosBoleta: extraerDatosDelPdf } = require('./boleta-formatos');
const gestorArchivos = require('./gestor-archivos');
const { parsearSolicitudes, agruparPorFolio } = require('./revisar-aprobadas/parsear-estado');
const { moverBoletasAprobadas } = require('./revisar-aprobadas/mover-aprobadas');

module.exports = defineConfig({
  // RUT/CLAVE/DATOS_PROFESIONALES son datos sensibles: con Cypress.env() (deprecado)
  // TODAS las variables de entorno se serializan al navegador. Con esto en false,
  // solo se puede acceder a ellas explícitamente vía cy.env(['clave']), que no las
  // expone todas de una. El spec usa cy.env(), nunca Cypress.env().
  allowCypressEnv: false,
  e2e: {
    // El sitio de la Isapre es intermitente (522/timeouts de Cloudflare de a ratos),
    // así que reintentamos el flujo completo; el dedup por __SUBIDA__ evita duplicar
    // boletas que ya se hayan alcanzado a subir en un intento anterior.
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      // Modo mock: `cypress run --env MOCK=true` corre contra el clon local
      // (mock-nuevamasvida/) en vez del sitio real, con credenciales/datos
      // 100% ficticios de cypress.mock.env.json, y usando carpetas *_MOCK
      // separadas para no tocar boletas reales pendientes en DEJAR_BOLETAS.
      const esMock = String(config.env.MOCK) === 'true';

      if (esMock) {
        // OJO: Cypress carga cypress.env.json (el real) automáticamente sin
        // importar el modo. Acá se REEMPLAZA por completo config.env (no se
        // mezcla) para que el modo mock quede 100% aislado de datos reales.
        const datosMock = JSON.parse(fs.readFileSync(path.join(__dirname, 'cypress.mock.env.json'), 'utf-8'));
        config.env = { ...datosMock, MOCK: true };
      }

      const carpeta = esMock ? 'DEJAR_BOLETAS_MOCK' : 'DEJAR_BOLETAS';
      const carpetaParaEnviar = esMock ? 'PARA_ENVIAR_MOCK/zip' : 'PARA_ENVIAR/zip';

      on('task', {
        obtenerArchivosEnCarpeta() {
          return gestorArchivos.obtenerArchivosEnCarpeta(carpeta);
        },

        renombrarArchivo(archivo) {
          return gestorArchivos.renombrarArchivo(carpeta, archivo);
        },

        eliminarArchivosYaSubidos() {
          return gestorArchivos.eliminarArchivosYaSubidos(carpeta);
        },

        eliminarBoletasDePrueba() {
          return gestorArchivos.eliminarBoletasDePrueba(carpeta);
        },

        // Las boletas del SII ya no llegan con nombres predecibles (traen prefijos
        // aleatorios del origen de descarga), así que el RUT del profesional y el
        // folio se sacan del CONTENIDO del PDF, probando los formatos conocidos
        // en boleta-formatos/index.js por orden de prioridad.
        async extraerDatosBoleta(archivo) {
          gestorArchivos.asegurarCarpeta(carpeta);

          try {
            const { rut, folio, formatoId } = await extraerDatosDelPdf(`${carpeta}/${archivo}`);
            return { rut, folio, formatoId };
          } catch (error) {
            // Un PDF corrupto o ilegible no debe tumbar toda la corrida: se
            // trata igual que "formato no reconocido" y se salta ese archivo.
            console.warn(`[boleta-formatos] No se pudo leer ${archivo}:`, error.message);
            return { rut: null, folio: null, formatoId: null };
          }
        },

        // Recibe el HTML de estado_reembolso.php (ya logueado), determina qué
        // folios quedaron AUTORIZADA/DEVUELTA, y mueve a PARA_ENVIAR/zip las
        // boletas locales (__SUBIDA__...) cuyo folio ya está aprobado.
        async procesarEstadoReembolso(html) {
          const solicitudes = parsearSolicitudes(html);
          const folios = agruparPorFolio(solicitudes);

          return moverBoletasAprobadas({
            carpetaOrigen: carpeta,
            carpetaDestino: carpetaParaEnviar,
            folios,
          });
        },

        async registrarBoletaSubida(datos) {
          try {
            await registrarEnGoogleSheets(config.env.GOOGLE_SHEETS, datos);
          } catch (error) {
            console.warn('[GoogleSheets] No se pudo registrar la boleta:', error.message);
          }

          // El tracking es "best effort": nunca debe hacer fallar la subida real.
          return true;
        },
      });

      return config;
    },
  },
});

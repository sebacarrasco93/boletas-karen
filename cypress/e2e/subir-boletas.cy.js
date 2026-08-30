const { PREFIJO_PRUEBA } = require('../../constantes');
const { obtenerBaseUrl, obtenerCarpetaBoletas } = require('../support/sitio');

describe('Subir boletas', () => {
  it('Procesar', () => {
    // Eliminar archivos ya subidos (dedup) y boletas de prueba ya usadas
    cy.task('eliminarArchivosYaSubidos');
    cy.task('eliminarBoletasDePrueba');

    // RUT/CLAVE/DATOS_PROFESIONALES son sensibles: se piden explícitamente con
    // cy.env() (no Cypress.env(), que expone TODAS las variables al navegador).
    cy.env(['RUT', 'CLAVE', 'NOMBRE', 'DATOS_PROFESIONALES', 'MOCK']).then((env) => {
      const baseUrl = obtenerBaseUrl(env.MOCK);
      const carpetaBoletas = obtenerCarpetaBoletas(env.MOCK);

      // Revisar archivos en la carpeta ANTES de abrir el navegador:
      // si no hay nada pendiente, no tiene sentido ni loguearse.
      cy.task('obtenerArchivosEnCarpeta').then((archivos) => {
        if (archivos.length === 0) {
          cy.log('No hay boletas pendientes por subir. No se abrirá el navegador.');
          return;
        }

        // El login se movió al subdominio de Sucursal Virtual (antes vivía en la home de www.nuevamasvida.cl)
        cy.visit(`${baseUrl}/`);

        // Escribir RUT y clave. { log: false } evita que queden en texto plano
        // en el Command Log (y por lo tanto en screenshots/videos de fallos).
        cy.get('#rut')
          .type(env.RUT, { log: false });

        cy.get('#clave')
          .type(env.CLAVE, { log: false });

        // Entrar (ya no es un <input value="Ingresar">, ahora es un link con id #ingreso)
        cy.get('#ingreso')
          .click();

        archivos.forEach((archivo) => {
          cy.log(`Procesando ${archivo}`);

          // ¿Es una boleta de prueba? (nombre reservado con prefijo PRUEBA_)
          const esPrueba = archivo.startsWith(PREFIJO_PRUEBA);

          // El SII ya no entrega nombres de archivo predecibles (traen prefijos
          // aleatorios según de dónde se descargó), así que el RUT del profesional
          // y el folio se extraen del CONTENIDO del PDF (ver boleta-formatos/index.js).
          cy.task('extraerDatosBoleta', archivo).then(({ rut: rutDocumento, folio: folioDocumento, formatoId }) => {
            if (!rutDocumento || !folioDocumento) {
              cy.log(`⚠️ No se reconoció el formato de ${archivo}. Corre "/analizar-boleta ${archivo}" para enseñarle este formato. Se omite por ahora.`);
              return;
            }

            // Buscar RUT en JSON desde DATOS_PROFESIONALES. Se compara solo la
            // parte numérica (sin dígito verificador) en ambos lados: rutDocumento
            // viene completo desde el PDF (ej. "22222222-2"), y así no importa si
            // en el JSON se configuró con o sin dígito verificador.
            const rutEncontrado = env.DATOS_PROFESIONALES.find((profesional) => {
              return profesional.RUT_PROFESIONAL.split('-')[0] == rutDocumento.split('-')[0];
            });

            if (!rutEncontrado) {
              cy.log(`⚠️ El RUT ${rutDocumento} (extraído de ${archivo}) no está en DATOS_PROFESIONALES. Se omite.`);
              return;
            }

            cy.log(`Se encontró el RUT de ${rutEncontrado.NOMBRE_PROFESIONAL} en JSON (formato: ${formatoId})`);
            cy.log(`RUT ${rutDocumento}`);
            cy.log(`Folio ${folioDocumento}`);

            if (esPrueba) {
              cy.log('⚠️ Esta es una boleta de PRUEBA, se subirá igual que una real para validar el flujo.');
            }

            // Abrir URL de reembolso
            cy.visit(`${baseUrl}/sucursal_virtual/solicitud_reembolso.php`);

            // Confirmar datos y continuar
            cy.get('#chk_verificacion')
              .click();
            cy.get('#activo > img')
              .click();
            cy.get('#bnf_rut')
              .select(env.NOMBRE);
            cy.get('#srw_tipo_consulta')
              .select(rutEncontrado.TIPO_CONSULTA);
            cy.get('#ptd_rut')
              .type(rutEncontrado.RUT_PROFESIONAL);
            cy.get('#srw_num_boleta')
              .type(folioDocumento);
            cy.get('#continuar_datos')
              .click();
            cy.get('#srw_rut_tratante')
              .type(rutEncontrado.RUT_PROFESIONAL);

            // Adjuntar archivos. El informe depende del tipo de consulta (ej. un
            // informe de Kinesiología no sirve para una boleta de Fonoaudiología):
            // se define por profesional en DATOS_PROFESIONALES.INFORME (ruta
            // relativa a DEJAR_BOLETAS, ej. "informes/kinesiologia.pdf").
            // Es null/omitible: hay tipos de consulta que no necesitan informe.
            cy.get('#archivo').selectFile(`${carpetaBoletas}/${archivo}`, { force: true });

            if (rutEncontrado.INFORME) {
              cy.get('#archivo_oa').selectFile(`${carpetaBoletas}/${rutEncontrado.INFORME}`, { force: true });
            }

            // Confirmar formulario
            cy.get('#chk_verificacion')
              .click();

            // Darle 100 ms para que aparezca el nombre del profesional
            cy.wait(100);

            // Subir y esperar
            cy.get('#procesar_solreembolso')
              .click();

            // Esperar que no salga error
            cy.get('#error').should('not.visible');

            // Verificar que se haya subido
            cy.get('#resp_registro > .titulo').contains('Solicitud enviada');

            cy.task('renombrarArchivo', archivo);

            cy.task('registrarBoletaSubida', {
              fecha: new Date().toISOString(),
              archivo,
              rutProfesional: rutEncontrado.RUT_PROFESIONAL,
              nombreProfesional: rutEncontrado.NOMBRE_PROFESIONAL,
              tipoConsulta: rutEncontrado.TIPO_CONSULTA,
              folio: folioDocumento,
              formatoId,
              esPrueba,
              estado: 'Solicitud enviada',
            });
          });
        });
      });
    });
  });
});

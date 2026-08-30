const { obtenerBaseUrl } = require('../support/sitio');

// Comando aparte de subir-boletas.cy.js: entra a la Sucursal Virtual, revisa
// el estado de las solicitudes de reembolso, y mueve a PARA_ENVIAR/zip las
// boletas locales ya subidas cuyo folio quedó AUTORIZADA. No sube nada nuevo.
describe('Revisar aprobadas', () => {
  it('Procesar', () => {
    cy.env(['RUT', 'CLAVE', 'MOCK']).then((env) => {
      const baseUrl = obtenerBaseUrl(env.MOCK);

      cy.visit(`${baseUrl}/`);

      cy.get('#rut').type(env.RUT, { log: false });
      cy.get('#clave').type(env.CLAVE, { log: false });
      cy.get('#ingreso').click();

      cy.visit(`${baseUrl}/sucursal_virtual/estado_reembolso.php`);

      // El HTML entero (todas las solicitudes de los últimos 12 meses) ya viene
      // en la carga inicial de la página, no hace falta interactuar con el acordeón.
      cy.document().then((doc) => {
        const html = doc.documentElement.outerHTML;

        cy.task('procesarEstadoReembolso', html).then((resultado) => {
          if (resultado.movidas.length === 0) {
            cy.log('No hay boletas nuevas para mover a PARA_ENVIAR/zip.');
          }

          resultado.movidas.forEach(({ folio, archivo }) => {
            cy.log(`✅ Folio ${folio} (${archivo}) autorizado — movido a PARA_ENVIAR/zip.`);
          });

          resultado.rechazadas.forEach(({ folio, archivo, motivoRechazo }) => {
            cy.log(`⚠️ Folio ${folio} (${archivo}) fue DEVUELTA: ${motivoRechazo}. Revisa manualmente.`);
          });

          resultado.ambiguas.forEach(({ folio, motivo }) => {
            cy.log(`⚠️ Folio ${folio}: ${motivo}. No se movió automáticamente, revisa manualmente.`);
          });
        });
      });
    });
  });
});

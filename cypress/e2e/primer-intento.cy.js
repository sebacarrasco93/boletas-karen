describe('Primer intente', () => {
  it(`Subiendo`, () => {
    cy.visit('https://nuevamasvida.cl');
    cy.get('#rut')
      .type(Cypress.env('RUT'));
    cy.get('#clave')
      .type(Cypress.env('CLAVE'))
      .wait(1500);
    cy.get('[value="Ingresar"]')
      .click();
    cy.task('obtenerArchivosEnCarpeta', 'DEJAR_BOLETAS').then((archivos) => {
      archivos.forEach((archivo) => {
        cy.log(`Procesando ${archivo}`);

        const arrayDatos = archivo.split('-');
        const rutDocumento = arrayDatos[0].replace('bhe_', '');
        const folioDocumento = arrayDatos[1];

        const rutEncontrado = Cypress.env('DATOS_PROFESIONALES').find((profesional) => {
          return profesional.RUT_PROFESIONAL.split('-')[0] == rutDocumento;
        });

        if (rutEncontrado) {
          cy.log(`Se encontró el RUT de ${rutEncontrado.NOMBRE_PROFESIONAL}`);
          cy.log(`RUT ${rutDocumento}`);
          cy.log(`Folio ${folioDocumento}`);

          cy.visit('https://sv.nuevamasvida.cl/sucursal_virtual/solicitud_reembolso.php');
          cy.get('#chk_verificacion')
            .click();
          cy.get('#activo > img')
            .click();
          cy.get('#bnf_rut')
            .select(Cypress.env('NOMBRE'));
          cy.get('#srw_tipo_consulta')
            .select('Consulta médica');
          cy.get('#ptd_rut')
            .type(rutEncontrado.RUT_PROFESIONAL);
          cy.get('#srw_num_boleta')
            .type(folioDocumento);
          cy.get('#continuar_datos')
            .click();
          cy.get('#srw_rut_tratante')
            .type(rutEncontrado.RUT_PROFESIONAL);
          // cy.get('#srw_nom_tratante')
          //   .type('Sebastián Carrasco Poblete')

          cy.get('#archivo').selectFile(`DEJAR_BOLETAS/${archivo}`, { force: true });
          cy.get('#archivo_oa').selectFile(`DEJAR_BOLETAS/Informe.pdf`, { force: true });
          cy.get('#chk_verificacion')
            .click();

          cy.task('renombrarArchivo', archivo);
        }
      });
    });
  });
});

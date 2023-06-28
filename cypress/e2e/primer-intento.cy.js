describe('Primer intente', () => {
  it(`Procesar`, () => {
    cy.visit('https://nuevamasvida.cl');

    // Eliminar archivos ya subidos
    cy.task('eliminarArchivosYaSubidos');
    
    // Escribir RUT
    cy.get('#rut')
      .type(Cypress.env('RUT'));

    // Escribir Clave y esperar 1,5 segundos
    cy.get('#clave')
      .type(Cypress.env('CLAVE'))
      .wait(1500);

    // Entrar
    cy.get('[value="Ingresar"]')
      .click();

    // Revisar archivos en la carpeta
    cy.task('obtenerArchivosEnCarpeta', 'DEJAR_BOLETAS').then((archivos) => {
      archivos.forEach((archivo) => {
        cy.log(`Procesando ${archivo}`);

        // Convertir nombre a array
        const arrayDatos = archivo.split('-');

        // Quitar prefijo bhe_ y guardar sin dígito verificador
        const rutDocumento = arrayDatos[0].replace('bhe_', '');

        // Obtener folio de documento
        const folioDocumento = arrayDatos[1];

        // Buscar RUT en JSON desde DATOS_PROFESIONALES
        const rutEncontrado = Cypress.env('DATOS_PROFESIONALES').find((profesional) => {
          return profesional.RUT_PROFESIONAL.split('-')[0] == rutDocumento;
        });

        // Encontró RUT de profesional en JSON?
        if (rutEncontrado) {
          cy.log(`Se encontró el RUT de ${rutEncontrado.NOMBRE_PROFESIONAL} en JSON`);
          
          cy.log(`RUT ${rutDocumento}`);
          cy.log(`Folio ${folioDocumento}`);

          // Abrir URL de reembolso
          cy.visit('https://sv.nuevamasvida.cl/sucursal_virtual/solicitud_reembolso.php');
          
          // Confirmar datos y continuar
          cy.get('#chk_verificacion')
            .click();
          cy.get('#activo > img')
            .click();
          cy.get('#bnf_rut')
            .select(Cypress.env('NOMBRE'));
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
          // cy.get('#srw_nom_tratante')
          //   .type('Sebastián Carrasco Poblete')

          // Adjuntar archivos
          cy.get('#archivo').selectFile(`DEJAR_BOLETAS/${archivo}`, { force: true });
          cy.get('#archivo_oa').selectFile(`DEJAR_BOLETAS/Informe.pdf`, { force: true });
          
          // Confirmar formulario
          cy.get('#chk_verificacion')
            .click();

          // Subir y esperar
          cy.get('#procesar_solreembolso')
            .click();

          cy.task('renombrarArchivo', archivo);
        }
      });
    });
  });
});

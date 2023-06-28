describe('Primer intente', () => {

  it('intento 1', () => {
    cy.visit('https://nuevamasvida.cl');
    cy.get('#rut')
      .type(Cypress.env('RUT'));
    cy.get('#clave')
      .type(Cypress.env('CLAVE'));
    cy.get('[value="Ingresar"]')
      .click();
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
      .type('18376588-4');
    cy.get('#srw_num_boleta')
      .type('123');
    cy.get('#continuar_datos')
      .click();
    cy.get('#srw_rut_tratante')
      .type('18376588-4');
    cy.get('#srw_nom_tratante')
      .type('Sebastián Carrasco Poblete')
    cy.get('#archivo').selectFile('DEJAR_BOLETAS/json.json', { force: true });
    cy.get('#archivo_oa').selectFile('DEJAR_BOLETAS/json.json', { force: true });
    cy.get('#chk_verificacion')
      .click();
  })
})

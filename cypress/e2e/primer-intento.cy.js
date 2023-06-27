describe('Primer intente', () => {

  it('intento 1', () => {
    cy.visit('https://nuevamasvida.cl')
    cy.get('#rut')
      .type(Cypress.env('RUT'))
    cy.get('#clave')
      .type(Cypress.env('CLAVE'))
  })
})

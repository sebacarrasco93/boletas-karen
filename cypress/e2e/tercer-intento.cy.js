describe('Tercer intento', () => {
  it(`Renombrar archivo`, () => {
    cy.task('renombrarArchivo', 'prueba.pdf');
  });
});

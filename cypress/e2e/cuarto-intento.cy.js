describe('Cuarto intento', () => {
  it(`Eliminar archivo si existía`, () => {
    cy.task('eliminarArchivoYaSubido', 'prueba.pdf');
  });
});

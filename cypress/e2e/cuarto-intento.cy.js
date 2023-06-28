describe('Cuarto intento', () => {
  it(`Eliminar archivos si ya estaban subidos`, () => {
    cy.task('eliminarArchivosYaSubidos');
  });
});

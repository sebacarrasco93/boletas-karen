describe('Segundo intento', () => {
  it(`Obtener RUT`, () => {
    const buscar = '18376588';

    const rutEncontrado = Cypress.env('DATOS_PROFESIONALES').find((profesional) => {
      return profesional.RUT_PROFESIONAL.split('-')[0] == buscar;
    });

    if (rutEncontrado) {
      cy.log('Se encontró el RUT');
      cy.log(rutEncontrado.NOMBRE_PROFESIONAL);
    }
  });
});

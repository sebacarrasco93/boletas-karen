// Constantes compartidas entre cypress.config.js (tasks, corre en Node) y los
// specs (corren en el navegador vía el bundler de Cypress). Un solo lugar
// para no desincronizar el prefijo entre ambos lados.
module.exports = {
  PREFIJO_SUBIDA: '__SUBIDA__',
  PREFIJO_PRUEBA: 'PRUEBA_',
};

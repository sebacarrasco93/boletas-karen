// Constantes compartidas entre cypress.config.js (tasks, corre en Node) y los
// specs (corren en el navegador vía el bundler de Cypress). Un solo lugar
// para no desincronizar el prefijo entre ambos lados.
module.exports = {
  // Prefijo de la versión anterior: ya no se escribe, solo se ignora.
  PREFIJO_SUBIDA: '__SUBIDA__',
  CARPETA_SUBIDAS: 'subidas',
  PREFIJO_PRUEBA: 'PRUEBA_',
};

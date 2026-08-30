// URL base de la Sucursal Virtual: la real, o el clon local (mock-nuevamasvida/)
// cuando se corre `cypress run --env MOCK=true`.
const BASE_URL_REAL = 'https://sv.nuevamasvida.cl';
const BASE_URL_MOCK = 'http://localhost:4567';

function obtenerBaseUrl(esMock) {
  return esMock === true || esMock === 'true' ? BASE_URL_MOCK : BASE_URL_REAL;
}

// En modo mock se usa una carpeta aparte para no tocar boletas reales
// pendientes en DEJAR_BOLETAS (debe calzar con cypress.config.js).
function obtenerCarpetaBoletas(esMock) {
  return esMock === true || esMock === 'true' ? 'DEJAR_BOLETAS_MOCK' : 'DEJAR_BOLETAS';
}

module.exports = { obtenerBaseUrl, obtenerCarpetaBoletas };

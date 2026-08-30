// Clon mínimo de sv.nuevamasvida.cl para poder desarrollar y testear los
// flujos (subir-boletas.cy.js, revisar-aprobadas.cy.js) sin depender de la
// disponibilidad del sitio real ni arriesgar boletas/solicitudes reales.
// Replica solo el contrato DOM que Cypress necesita, no el diseño real.
const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  paginaLogin,
  paginaBienvenida,
  paginaSolicitudReembolso,
  paginaEstadoReembolso,
} = require('./paginas');

const PUERTO = process.env.MOCK_PORT || 4567;

const datosEnv = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cypress.mock.env.json'), 'utf-8'));
const solicitudesMock = JSON.parse(fs.readFileSync(path.join(__dirname, 'solicitudes-mock.json'), 'utf-8'));

const app = express();
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.send(paginaLogin()));

// El form de login real apunta a "sucursal_virtual/" (relativo); cualquier
// rut/clave "loguea" bien acá, no hay validación real.
app.post('/sucursal_virtual/', (req, res) => res.redirect('/sucursal_virtual/'));
app.get('/sucursal_virtual/', (req, res) => res.send(paginaBienvenida()));

app.get('/sucursal_virtual/solicitud_reembolso.php', (req, res) => {
  res.send(paginaSolicitudReembolso(datosEnv));
});

app.get('/sucursal_virtual/estado_reembolso.php', (req, res) => {
  res.send(paginaEstadoReembolso(solicitudesMock));
});

if (require.main === module) {
  app.listen(PUERTO, () => {
    console.log(`Mock de NuevaMasVida escuchando en http://localhost:${PUERTO}`);
  });
}

module.exports = { app };

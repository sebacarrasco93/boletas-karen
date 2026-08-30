// Páginas HTML mínimas que replican SOLO lo que subir-boletas.cy.js y
// revisar-aprobadas.cy.js necesitan interactuar (mismos ids/clases/forms que
// el sitio real). No pretende clonar el diseño real, solo el contrato DOM.

function paginaLogin() {
  return `<!doctype html>
<html>
<head><title>Mock Sucursal Virtual — Login</title></head>
<body>
  <h1>Sucursal Virtual (mock)</h1>
  <form id="acceso" action="/sucursal_virtual/" method="post">
    <input id="rut" name="rut" type="text" placeholder="Ingresa tu rut">
    <input id="clave" name="clave" type="password" placeholder="Ingresa tu clave">
    <a href="#" id="ingreso">Ingresar</a>
  </form>
  <script>
    document.getElementById('ingreso').addEventListener('click', function (evento) {
      evento.preventDefault();
      document.getElementById('acceso').submit();
    });
  </script>
</body>
</html>`;
}

function paginaBienvenida() {
  return `<!doctype html>
<html>
<head><title>Mock Sucursal Virtual</title></head>
<body>
  <h1>Bienvenido(a) (mock)</h1>
  <p><a href="solicitud_reembolso.php">Solicitud de reembolso</a></p>
  <p><a href="estado_reembolso.php">Estado de reembolsos</a></p>
</body>
</html>`;
}

function paginaSolicitudReembolso(datosEnv) {
  const opcionesTipoConsulta = datosEnv.DATOS_PROFESIONALES
    .map((profesional) => `<option value="${profesional.TIPO_CONSULTA}">${profesional.TIPO_CONSULTA}</option>`)
    .join('\n');

  return `<!doctype html>
<html>
<head><title>Mock Solicitud de Reembolso</title></head>
<body>
  <h1>Solicitud de reembolso (mock)</h1>

  <label><input type="checkbox" id="chk_verificacion"> Verifico que los datos son correctos</label>

  <div id="activo"><img src="/img-activo.png" alt="activo" width="20" height="20"></div>

  <select id="bnf_rut">
    <option value="">Selecciona beneficiario</option>
    <option value="${datosEnv.NOMBRE}">${datosEnv.NOMBRE}</option>
  </select>

  <select id="srw_tipo_consulta">
    <option value="">Selecciona tipo de consulta</option>
    ${opcionesTipoConsulta}
  </select>

  <input id="ptd_rut" type="text">
  <input id="srw_num_boleta" type="text">
  <button id="continuar_datos" type="button">Continuar</button>

  <input id="srw_rut_tratante" type="text">
  <input id="archivo" type="file">
  <input id="archivo_oa" type="file">

  <button id="procesar_solreembolso" type="button">Procesar</button>

  <div id="error" style="display:none"></div>

  <div id="resp_registro" style="display:none">
    <div class="titulo"></div>
  </div>

  <script>
    document.getElementById('procesar_solreembolso').addEventListener('click', function () {
      var resp = document.getElementById('resp_registro');
      resp.style.display = 'block';
      resp.querySelector('.titulo').textContent = 'Solicitud enviada';
    });
  </script>
</body>
</html>`;
}

// Misma estructura que revisar-aprobadas/parsear-estado.js espera: bloques
// <div class="accordion-group" id="solic_XXX"> con el badge de estado y,
// dentro, "N° documento" (folio) y opcionalmente "Motivos rechazo".
function paginaEstadoReembolso(solicitudes) {
  const bloques = solicitudes
    .map((solicitud) => {
      const filaMotivo = solicitud.motivoRechazo
        ? `<tr><td class="space_tr">Motivos rechazo</td><td> : ${solicitud.motivoRechazo}</td></tr>`
        : '';

      return `
  <div class="accordion-group" id="solic_${solicitud.solicitudId}">
    <div class="accordion-heading">
      <h4 class="panel-title2">
        <a class="accordion-toggle" href="#reem_${solicitud.solicitudId}">
          <div class="row-fluid">
            <span class="span4">Folio: ${solicitud.solicitudId}</span>
            <span class="span3">Estado:
              <span class="text-center" style="background:#008dcf;color:white;width:100px;display:inline-block;">${solicitud.estado}</span>
            </span>
          </div>
        </a>
      </h4>
    </div>
    <div id="reem_${solicitud.solicitudId}" class="accordion-body collapse">
      <div class="accordion-inner">
        <table>
          <tbody>
            <tr><td class="space_tr">N° documento</td><td>: ${solicitud.folio}</td></tr>
            ${filaMotivo}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
    })
    .join('\n');

  return `<!doctype html>
<html>
<head><title>Mock Estado de Reembolsos</title></head>
<body>
  <h1>Estado de reembolsos (mock)</h1>
  <div id="accordion">
    ${bloques}
  </div>
</body>
</html>`;
}

module.exports = { paginaLogin, paginaBienvenida, paginaSolicitudReembolso, paginaEstadoReembolso };

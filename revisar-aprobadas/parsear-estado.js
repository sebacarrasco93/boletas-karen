// Parsea el HTML de sv.nuevamasvida.cl/sucursal_virtual/estado_reembolso.php.
// Cada solicitud aparece como un bloque <div class="accordion-group" id="solic_XXX">.
// Se lee por bloque (no con regex globales sueltas) porque las cantidades de
// campos NO calzan 1:1 entre solicitudes AUTORIZADA y DEVUELTA (estas últimas
// traen campos extra: motivo de rechazo, RUT del documento, etc).
function parsearSolicitudes(html) {
  const bloques = html
    .split(/(?=<div class="accordion-group" id="solic_\d+">)/)
    .filter((bloque) => /^<div class="accordion-group" id="solic_\d+">/.test(bloque));

  return bloques.map((bloque) => {
    const solicitudId = bloque.match(/id="solic_(\d+)"/)[1];
    const estadoMatch = bloque.match(/width:100px;display:inline-block;">\s*([A-ZÁÉÍÓÚÑ ]+)/);
    // El label "N° documento" viene con distinta cantidad de &nbsp; según el tipo
    // de solicitud, por eso [^<]* en vez de \s*.
    const folioMatch = bloque.match(/N[^<]*documento[^<]*<\/td><td>:\s*(\d+)/);
    const motivoMatch = bloque.match(/Motivos rechazo<\/td>\s*<td>\s*:\s*([^<]+)/);

    return {
      solicitudId,
      estado: estadoMatch ? estadoMatch[1].trim() : null,
      folio: folioMatch ? folioMatch[1] : null,
      motivoRechazo: motivoMatch ? motivoMatch[1].trim() : null,
    };
  });
}

// Un mismo folio (N° documento) puede aparecer en varias solicitudes a lo largo
// del tiempo (ej. devuelta por falta de antecedentes y luego reenviada y
// autorizada). Si CUALQUIER intento quedó autorizado, se considera aprobado.
function agruparPorFolio(solicitudes) {
  const porFolio = new Map();

  solicitudes.forEach((solicitud) => {
    if (!solicitud.folio) return;

    const actual = porFolio.get(solicitud.folio) || {
      folio: solicitud.folio,
      aprobado: false,
      motivoRechazo: null,
    };

    if (solicitud.estado === 'AUTORIZADA') {
      actual.aprobado = true;
      actual.motivoRechazo = null;
    } else if (!actual.aprobado && solicitud.motivoRechazo) {
      actual.motivoRechazo = solicitud.motivoRechazo;
    }

    porFolio.set(solicitud.folio, actual);
  });

  return Array.from(porFolio.values());
}

module.exports = { parsearSolicitudes, agruparPorFolio };

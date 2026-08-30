const path = require('path');

// Arma el objeto que espera nodemailer a partir de la config (email.config.json)
// y de los adjuntos ya resueltos (rutas absolutas en disco). No toca el disco ni
// la red: es la parte fácil de testear del envío de correo.
function construirMailOptions(config, { zipPath, adjuntosExtra } = {}) {
  const attachments = [];

  if (zipPath) {
    attachments.push({ filename: path.basename(zipPath), path: zipPath });
  }

  (adjuntosExtra || []).forEach((rutaArchivo) => {
    attachments.push({ filename: path.basename(rutaArchivo), path: rutaArchivo });
  });

  return {
    from: `"${config.REMITENTE.NOMBRE}" <${config.REMITENTE.EMAIL}>`,
    to: `"${config.DESTINATARIO.NOMBRE}" <${config.DESTINATARIO.EMAIL}>`,
    subject: config.ASUNTO,
    text: config.MENSAJE,
    attachments,
  };
}

// Texto plano para mostrar antes de enviar (vista previa / confirmación).
function formatearVistaPrevia(mailOptions) {
  const lineas = [
    `De: ${mailOptions.from}`,
    `Para: ${mailOptions.to}`,
    `Asunto: ${mailOptions.subject}`,
    '',
    mailOptions.text,
    '',
    `Adjuntos (${mailOptions.attachments.length}):`,
    ...(mailOptions.attachments.length
      ? mailOptions.attachments.map((adjunto) => `  - ${adjunto.filename}`)
      : ['  (ninguno)']),
  ];

  return lineas.join('\n');
}

module.exports = { construirMailOptions, formatearVistaPrevia };

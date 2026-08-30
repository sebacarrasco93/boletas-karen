#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('node:readline/promises');
const nodemailer = require('nodemailer');
const { construirMailOptions, formatearVistaPrevia } = require('./armar-correo');
const { crearZip } = require('./crear-zip');

const RAIZ = path.join(__dirname, '..');
const RUTA_CONFIG = path.join(RAIZ, 'email.config.json');

// Deja acá las boletas ya aprobadas por la Isapre (se comprimen y adjuntan como
// un solo .zip) y, aparte, cualquier adjunto suelto que también quieras mandar.
// Ambas carpetas están en .gitignore: son documentos reales, no van al repo.
const CARPETA_PARA_ENVIAR = path.join(RAIZ, 'PARA_ENVIAR');
const CARPETA_ZIP = path.join(CARPETA_PARA_ENVIAR, 'zip');
const CARPETA_ADJUNTOS = path.join(CARPETA_PARA_ENVIAR, 'adjuntos');
const RUTA_ZIP_TEMPORAL = path.join(CARPETA_PARA_ENVIAR, 'boletas-aprobadas.zip');

function leerConfig() {
  if (!fs.existsSync(RUTA_CONFIG)) {
    throw new Error(`Falta ${RUTA_CONFIG}. Copia example.email.config.json, ponle ese nombre y complétalo con tus datos.`);
  }

  return JSON.parse(fs.readFileSync(RUTA_CONFIG, 'utf-8'));
}

function listarArchivos(carpeta) {
  if (!fs.existsSync(carpeta)) return [];

  return fs
    .readdirSync(carpeta)
    .map((archivo) => path.join(carpeta, archivo))
    .filter((rutaArchivo) => fs.statSync(rutaArchivo).isFile());
}

async function pedirConfirmacion(pregunta) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const respuesta = await rl.question(pregunta);
  rl.close();
  return respuesta.trim().toLowerCase() === 's';
}

async function main() {
  const config = leerConfig();
  const forzarEnvio = process.argv.includes('--si') || process.argv.includes('--yes');

  let zipPath = null;
  const archivosParaZip = listarArchivos(CARPETA_ZIP);

  if (archivosParaZip.length > 0) {
    zipPath = await crearZip(CARPETA_ZIP, RUTA_ZIP_TEMPORAL);
    console.log(`Zip creado con ${archivosParaZip.length} archivo(s): ${zipPath}`);
  }

  const adjuntosExtra = listarArchivos(CARPETA_ADJUNTOS);

  if (!zipPath && adjuntosExtra.length === 0) {
    console.log(`No hay nada para enviar. Deja las boletas aprobadas en ${CARPETA_ZIP} y/o adjuntos sueltos en ${CARPETA_ADJUNTOS}.`);
    return;
  }

  const mailOptions = construirMailOptions(config, { zipPath, adjuntosExtra });

  console.log('\n--- Vista previa del correo ---\n');
  console.log(formatearVistaPrevia(mailOptions));
  console.log('\n--------------------------------\n');

  if (!forzarEnvio) {
    const confirmado = await pedirConfirmacion('¿Enviar este correo? (s/N) ');

    if (!confirmado) {
      console.log('Cancelado, no se envió nada.');
      if (zipPath) fs.unlinkSync(zipPath);
      return;
    }
  }

  const transporter = nodemailer.createTransport({
    service: 'Yahoo',
    auth: {
      user: config.REMITENTE.EMAIL,
      pass: config.REMITENTE.APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail(mailOptions);
  console.log(`Correo enviado. ID: ${info.messageId}`);

  if (zipPath) fs.unlinkSync(zipPath);
}

main().catch((error) => {
  console.error('Error enviando el correo:', error.message);
  process.exitCode = 1;
});

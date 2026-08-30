import { describe, it, expect } from 'vitest';
import { construirMailOptions, formatearVistaPrevia } from './armar-correo.js';

const config = {
  REMITENTE: { EMAIL: 'yo@yahoo.com', NOMBRE: 'Yo' },
  DESTINATARIO: { EMAIL: 'destino@ejemplo.cl', NOMBRE: 'Destino' },
  ASUNTO: 'Asunto de prueba',
  MENSAJE: 'Mensaje de prueba',
};

describe('construirMailOptions', () => {
  it('arma from/to/subject/text desde la config', () => {
    const mail = construirMailOptions(config, {});

    expect(mail.from).toBe('"Yo" <yo@yahoo.com>');
    expect(mail.to).toBe('"Destino" <destino@ejemplo.cl>');
    expect(mail.subject).toBe('Asunto de prueba');
    expect(mail.text).toBe('Mensaje de prueba');
  });

  it('sin zip ni adjuntos extra, no hay attachments', () => {
    const mail = construirMailOptions(config, {});
    expect(mail.attachments).toEqual([]);
  });

  it('incluye el zip como primer adjunto', () => {
    const mail = construirMailOptions(config, { zipPath: '/tmp/boletas-aprobadas.zip' });
    expect(mail.attachments).toEqual([{ filename: 'boletas-aprobadas.zip', path: '/tmp/boletas-aprobadas.zip' }]);
  });

  it('incluye los adjuntos extra después del zip', () => {
    const mail = construirMailOptions(config, {
      zipPath: '/tmp/boletas-aprobadas.zip',
      adjuntosExtra: ['/tmp/carta.pdf', '/tmp/otro.pdf'],
    });

    expect(mail.attachments.map((a) => a.filename)).toEqual([
      'boletas-aprobadas.zip',
      'carta.pdf',
      'otro.pdf',
    ]);
  });
});

describe('formatearVistaPrevia', () => {
  it('incluye destinatario, asunto, mensaje y adjuntos', () => {
    const mail = construirMailOptions(config, { adjuntosExtra: ['/tmp/carta.pdf'] });
    const vistaPrevia = formatearVistaPrevia(mail);

    expect(vistaPrevia).toContain('Para: "Destino" <destino@ejemplo.cl>');
    expect(vistaPrevia).toContain('Asunto: Asunto de prueba');
    expect(vistaPrevia).toContain('Mensaje de prueba');
    expect(vistaPrevia).toContain('carta.pdf');
  });

  it('avisa cuando no hay adjuntos, en vez de mostrar una lista vacía confusa', () => {
    const mail = construirMailOptions(config, {});
    expect(formatearVistaPrevia(mail)).toContain('(ninguno)');
  });
});

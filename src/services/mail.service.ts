import nodemailer from 'nodemailer';
import { config } from '../config/env';

function isMailConfigured(): boolean {
  return Boolean(
    config.mail.host &&
      config.mail.port &&
      config.mail.user &&
      config.mail.pass &&
      config.mail.from,
  );
}

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: {
        user: config.mail.user,
        pass: config.mail.pass,
      },
    });
  }

  return cachedTransporter;
}

export async function sendPasswordResetCodeEmail(email: string, code: string): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error('Email service is not configured (SMTP).');
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: 'Codigo temporal para actualizar tu contrasena',
    text: `Tu codigo temporal es: ${code}. Inicia sesion con este codigo y actualiza tu contrasena inmediatamente.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #222;">
        <h2>Recuperacion de contrasena</h2>
        <p>Tu codigo temporal para entrar a la app es:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 2px;">${code}</p>
        <p>Por seguridad, cambia tu contrasena al iniciar sesion.</p>
      </div>
    `,
  });
}


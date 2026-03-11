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
      pool: true,
      maxConnections: 1,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      auth: {
        user: config.mail.user,
        pass: config.mail.pass,
      },
    });
  }

  return cachedTransporter;
}

export async function sendPasswordResetCodeEmail(email: string, code: string): Promise<void> {
  console.log('[mail.service] sendPasswordResetCodeEmail - inicio, destinatario:', email);
  if (!isMailConfigured()) {
    console.log('[mail.service] sendPasswordResetCodeEmail - ERROR: SMTP no configurado (host, user, pass, from)');
    throw new Error('Email service is not configured (SMTP).');
  }
  console.log('[mail.service] sendPasswordResetCodeEmail - SMTP configurado, host:', config.mail.host, 'port:', config.mail.port);

  const transporter = getTransporter();
  console.log('[mail.service] sendPasswordResetCodeEmail - transporter obtenido, enviando...');
  try {
    await transporter.sendMail({
      from: config.mail.from,
      replyTo: config.mail.from,
      to: email,
      subject: 'Código temporal para acceder a tu cuenta',
      text: `Hola. Tu código temporal de seguridad es: ${code}. Úsalo para iniciar sesión en la app. Por seguridad, te pediremos que actualices tu contraseña inmediatamente.`,
      html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de acceso</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 40px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background-color: #1a1a1a; padding: 30px; text-align: center; border-bottom: 3px solid #d4af37;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Bartop</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px;">Recuperación de acceso</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #555555; margin-bottom: 25px;">Hola,</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #555555; margin-bottom: 25px;">
                      Hemos recibido una solicitud para acceder a tu cuenta. Utiliza el siguiente código temporal de 6 dígitos para iniciar sesión de forma segura:
                    </p>
                    <div style="text-align: center; margin: 35px 0;">
                      <span style="display: inline-block; padding: 15px 30px; background-color: #f9f9f9; border: 2px dashed #d4af37; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a1a;">
                        ${code}
                      </span>
                    </div>
                    <p style="font-size: 14px; line-height: 1.5; color: #777777; margin-bottom: 15px; padding-left: 15px; border-left: 3px solid #d4af37;">
                      <strong>Nota importante:</strong> Por razones de seguridad, se te pedirá que crees una nueva contraseña inmediatamente después de ingresar este código en la aplicación.
                    </p>
                    <p style="font-size: 14px; line-height: 1.5; color: #777777;">
                      Si tú no solicitaste este código, puedes ignorar este correo con seguridad. Tu cuenta sigue protegida.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0;">Este es un mensaje automático, por favor no respondas a este correo.</p>
                    <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Bartop. Todos los derechos reservados.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    });
    console.log('[mail.service] sendPasswordResetCodeEmail - correo enviado exitosamente');
  } catch (err) {
    console.error('[mail.service] sendPasswordResetCodeEmail - ERROR al enviar:', err);
    throw err;
  }
}


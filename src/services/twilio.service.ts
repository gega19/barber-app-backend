import twilio from 'twilio';

// Añade a tu .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || '';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error('Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  }
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export function isTwilioConfigured(): boolean {
  return Boolean(accountSid && authToken && verifyServiceSid);
}

/**
 * Envía un código de verificación por SMS al número (E.164).
 */
export async function sendVerificationCode(phone: string): Promise<void> {
  const client = getClient();
  if (!verifyServiceSid) {
    throw new Error('Twilio Verify Service is not configured. Set TWILIO_VERIFY_SERVICE_SID in .env');
  }
  await client.verify.v2
    .services(verifyServiceSid)
    .verifications.create({
      to: phone.trim(),
      channel: 'sms',
    });
}

/**
 * Verifica el código ingresado por el usuario.
 * @returns true si el código es válido
 */
export async function checkVerificationCode(phone: string, code: string): Promise<boolean> {
  const client = getClient();
  if (!verifyServiceSid) {
    throw new Error('Twilio Verify Service is not configured. Set TWILIO_VERIFY_SERVICE_SID in .env');
  }
  const result = await client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: phone.trim(),
      code: code.trim(),
    });
  return result.status === 'approved';
}

import path from 'path';
import fs from 'fs';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function loadSmtpFromFile(): SmtpConfig | null {
  const possiblePaths = [
    path.join(process.cwd(), 'config', 'smtp.json'),
    path.join(__dirname, '..', '..', 'config', 'smtp.json'),
  ];

  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;

        const host = data.host as string;
        const user = data.user as string;
        const pass = data.pass as string;

        if (host && user && pass) {
          console.log(`✅ Loaded SMTP config from: ${filePath}`);
          return {
            host,
            port: typeof data.port === 'number' ? data.port : parseInt(String(data.port || '587'), 10),
            secure: data.secure === true,
            user,
            pass,
            from: (data.from as string) || user,
          };
        }
      }
    } catch (error) {
      // Continue to next path
    }
  }

  return null;
}

export function getMailConfig(): SmtpConfig {
  const fromFile = loadSmtpFromFile();

  if (fromFile) {
    return fromFile;
  }

  return {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  };
}

import dotenv from 'dotenv';

// Muat variabel lingkungan dari file .env
dotenv.config();

const decodeB64 = (str) => Buffer.from(str, 'base64').toString('utf8');

export const env = {
  port: process.env.PORT || 5000,
  cfAccountId:
    process.env.CF_ACCOUNT_ID || decodeB64('ODdmZDA0NjI4NWM1YWIwMjBiODc1ZjhjNDI1ZjM1NTg='),
  cfDatabaseId:
    process.env.CF_DATABASE_ID || decodeB64('NDFlOWU1OTUtYzdjOC00NTJkLWIwMGEtNWUwY2NlMTFiMDA5'),
  cfApiToken:
    process.env.CF_API_TOKEN ||
    decodeB64('Y2ZrX1NZaFFLN1JqTno3TkozZnNJT3B1Z1VPS2JjQndZcklCZUcwUUpuWnhiMGI4ODFkYw=='),
  cfEmail: process.env.CF_EMAIL || decodeB64('eXVtZW5vYm9rZW5AZ21haWwuY29t'),
  jwtSecret: process.env.JWT_SECRET || 'rahasia_super_aman_tka_sd_2026',
  frontendUrl: process.env.FRONTEND_URL || 'https://hihu-group.vercel.app',
  smtpUser: process.env.SMTP_USER || decodeB64('eXVtZW5vYm9rZW5AZ21haWwuY29t'),
  smtpPass: process.env.SMTP_PASS || decodeB64('dWtwYnBka3lubmt5anJkcg=='),
};

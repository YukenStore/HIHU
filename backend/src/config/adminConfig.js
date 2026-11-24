import { ADMIN_EMAILS as FRONTEND_ADMIN_EMAILS } from '../../../frontend/src/config/adminConfig.js';

/**
 * ============================================================================
 * KONFIGURASI VALIDASI EMAIL ADMIN (BACKEND)
 * ============================================================================
 */

export const ADMIN_EMAILS = Array.from(
  new Set([
    'yumenoboken@gmail.com',
    'faalihabraar@gmail.com',
    'indonesiangamer208@gmail.com',
    ...(Array.isArray(FRONTEND_ADMIN_EMAILS) ? FRONTEND_ADMIN_EMAILS : []),
  ])
);

/**
 * Memeriksa apakah email termasuk dalam daftar Admin
 * @param {Object|string|null} userOrEmail
 * @returns {boolean}
 */
export const isAdminEmail = (userOrEmail) => {
  const rawEmail =
    typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email;

  if (!rawEmail || typeof rawEmail !== 'string') return false;

  const cleanEmail = rawEmail.trim().toLowerCase();

  // Mendukung tambahan email dari environment variable ADMIN_EMAILS (dipisahkan koma)
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const allAdmins = [
    ...ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
    ...envAdmins,
  ];

  return allAdmins.includes(cleanEmail);
};

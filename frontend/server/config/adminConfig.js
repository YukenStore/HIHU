/**
 * ============================================================================
 * KONFIGURASI VALIDASI EMAIL ADMIN (BACKEND)
 * ============================================================================
 * Tambahkan alamat email admin baru ke dalam array ADMIN_EMAILS di bawah ini.
 * Digunakan oleh middleware backend untuk memvalidasi request edit Materi & Latihan Soal.
 */
export const ADMIN_EMAILS = [
  'yumenoboken@gmail.com',
  // Tambahkan email admin lainnya di bawah baris ini:
  // 'admin.kedua@gmail.com',
];

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

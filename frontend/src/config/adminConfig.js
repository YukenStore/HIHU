/**
 * ============================================================================
 * KONFIGURASI VALIDASI EMAIL ADMIN PORTAL TKA SD
 * ============================================================================
 * Tambahkan alamat email admin baru ke dalam array ADMIN_EMAILS di bawah ini.
 * Hanya akun dengan email yang terdaftar di sini yang dapat melihat tombol
 * Admin Panel di Dashboard/Navbar dan mengakses halaman /admin.
 */
export const ADMIN_EMAILS = [
  'yumenoboken@gmail.com',
  // Tambahkan email admin lainnya di bawah baris ini:
  // 'admin.kedua@gmail.com',
];

/**
 * Memeriksa apakah user atau alamat email memiliki hak akses Admin
 * @param {Object|string|null} userOrEmail - Objek user ({ email }) atau string email
 * @returns {boolean}
 */
export const isAdminUser = (userOrEmail) => {
  const rawEmail =
    typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email;

  if (!rawEmail || typeof rawEmail !== 'string') return false;

  const cleanEmail = rawEmail.trim().toLowerCase();
  return ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.trim().toLowerCase() === cleanEmail
  );
};

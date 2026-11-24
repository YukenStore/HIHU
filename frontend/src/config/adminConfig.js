export const ADMIN_EMAILS = [
  'yumenoboken@gmail.com',
  'faalihabraar@gmail.com',
  'indonesiangamer208@gmail.com',
];

// Daftar username admin (digunakan juga untuk menyembunyikan akun admin dari cache leaderboard)
export const ADMIN_USERNAMES = [
  'admin',
  'orangpintar',
  'HIHU',
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

/**
 * Memeriksa apakah entri pada Leaderboard adalah milik akun Admin
 * @param {Object} entry - Objek entri leaderboard ({ name, username, email })
 * @param {Object|null} currentUser - User yang sedang login saat ini
 * @returns {boolean}
 */
export const isAdminLeaderboardEntry = (entry, currentUser = null) => {
  if (!entry) return false;
  if (entry.email && isAdminUser(entry.email)) return true;

  const entryName = (entry.name || entry.username || '').trim().toLowerCase();
  if (!entryName) return false;

  if (
    ADMIN_USERNAMES.some(
      (adminName) => adminName.trim().toLowerCase() === entryName
    )
  ) {
    return true;
  }

  // Jika user yang sedang login adalah admin, sembunyikan juga username miliknya
  if (currentUser && isAdminUser(currentUser)) {
    const currentAdminName = (currentUser.username || '').trim().toLowerCase();
    if (currentAdminName && currentAdminName === entryName) {
      return true;
    }
  }

  return false;
};

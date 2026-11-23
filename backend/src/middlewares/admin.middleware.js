import { isAdminEmail } from '../config/adminConfig.js';

/**
 * Middleware untuk memastikan pengguna yang login memiliki email yang terdaftar sebagai Admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || !isAdminEmail(req.user.email)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya Admin terdaftar yang dapat mengelola Materi dan Latihan Soal.',
    });
  }
  next();
};

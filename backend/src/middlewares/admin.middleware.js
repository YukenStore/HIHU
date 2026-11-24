import { isAdminEmail } from '../config/adminConfig.js';
import { findUserById } from '../models/user.model.js';

/**
 * Middleware untuk memastikan pengguna yang login memiliki email yang terdaftar sebagai Admin
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya Admin terdaftar yang dapat mengelola Materi dan Latihan Soal.',
      });
    }

    if (isAdminEmail(req.user.email)) {
      return next();
    }

    // Fallback: cek email langsung dari database berdasarkan user ID jika token belum memuat email terbaru
    if (req.user.id) {
      const dbUser = await findUserById(req.user.id);
      if (dbUser?.email && isAdminEmail(dbUser.email)) {
        req.user.email = dbUser.email;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya Admin terdaftar yang dapat mengelola Materi dan Latihan Soal.',
    });
  } catch (error) {
    next(error);
  }
};

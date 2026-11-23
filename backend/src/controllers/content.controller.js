import {
  getAllCustomContents,
  upsertCustomContent,
  deleteCustomContentOverride,
} from '../models/content.model.js';

/**
 * GET /api/content
 * Mengambil seluruh perubahan/tambahan Materi & Latihan Soal dari database Cloudflare D1
 */
export const getCustomContentList = async (req, res, next) => {
  try {
    const items = await getAllCustomContents();
    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT atau POST /api/admin/content
 * Menyimpan perubahan / penambahan / penghapusan Materi atau Latihan Soal (Khusus Admin)
 */
export const saveCustomContent = async (req, res, next) => {
  try {
    const { contentType, subject, itemId, action = 'upsert', payload } = req.body || {};

    if (!contentType || !['materi', 'latihan'].includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipe konten harus berupa "materi" atau "latihan".',
      });
    }

    if (!subject || !['matematika', 'bahasa_indonesia'].includes(subject)) {
      return res.status(400).json({
        success: false,
        message: 'Mata pelajaran harus "matematika" atau "bahasa_indonesia".',
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'ID materi atau level latihan (itemId) wajib diisi.',
      });
    }

    const saved = await upsertCustomContent({
      contentType,
      subject,
      itemId: String(itemId),
      action,
      payload: payload || {},
      updatedBy: req.user?.email || '',
    });

    return res.status(200).json({
      success: true,
      message: `${contentType === 'materi' ? 'Materi' : 'Latihan Soal'} berhasil disimpan ke database!`,
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/content/:contentType/:subject/:itemId
 * Mereset item Materi / Latihan Soal kembali ke versi default bawaan
 */
export const resetCustomContentItem = async (req, res, next) => {
  try {
    const { contentType, subject, itemId } = req.params;
    const result = await deleteCustomContentOverride({
      contentType,
      subject,
      itemId,
    });

    return res.status(200).json({
      success: true,
      message: 'Konten berhasil dikembalikan ke pengaturan awal (default).',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

import { Router } from 'express';
import {
  getCustomContentList,
  saveCustomContent,
  resetCustomContentItem,
} from '../controllers/content.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Endpoint Publik/Siswa untuk memuat kustomisasi Materi & Latihan Soal terbaru
router.get('/content', getCustomContentList);

// Endpoint Khusus Admin untuk menyimpan/mengedit Materi & Latihan Soal
router.put('/admin/content', authenticate, requireAdmin, saveCustomContent);
router.post('/admin/content', authenticate, requireAdmin, saveCustomContent);

// Endpoint Khusus Admin untuk mereset item ke bawaan default
router.delete(
  '/admin/content/:contentType/:subject/:itemId',
  authenticate,
  requireAdmin,
  resetCustomContentItem
);

export default router;

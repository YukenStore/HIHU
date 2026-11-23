import api from './api';
import { PUSMENDIK_MATERI } from '../data/pusmendikData';
import { PUSMENDIK_LATIHAN } from '../data/latihanData';

const STORAGE_KEY = 'tka_sd_custom_contents_v1';

// Simpan salinan awal (baseline) dari kode bawaan agar selalu bisa di-reset ke default
const BASE_MATERI = JSON.parse(JSON.stringify(PUSMENDIK_MATERI));
const BASE_LATIHAN = JSON.parse(JSON.stringify(PUSMENDIK_LATIHAN));

/**
 * Mengambil daftar override dari localStorage
 */
export const getCachedCustomContents = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

/**
 * Menyimpan daftar override ke localStorage
 */
const setCachedCustomContents = (items) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Gagal menyimpan cache konten kustom:', e);
  }
};

/**
 * Menerapkan daftar kustomisasi (Materi & Latihan Soal) langsung ke objek PUSMENDIK_MATERI dan PUSMENDIK_LATIHAN
 */
export const applyCustomContentsToData = (items = []) => {
  // 1. Kembalikan ke baseline awal terlebih dahulu
  ['matematika', 'bahasa_indonesia'].forEach((subj) => {
    if (BASE_MATERI[subj]) {
      PUSMENDIK_MATERI[subj].elemen = JSON.parse(
        JSON.stringify(BASE_MATERI[subj].elemen)
      );
    }
    if (BASE_LATIHAN[subj]) {
      PUSMENDIK_LATIHAN[subj].levels = JSON.parse(
        JSON.stringify(BASE_LATIHAN[subj].levels)
      );
    }
  });

  // 2. Terapkan setiap item kustomisasi secara berurutan
  items.forEach((item) => {
    if (!item || !item.contentType || !item.subject || !item.itemId) return;
    const { contentType, subject, itemId, action, payload } = item;

    if (contentType === 'materi' && PUSMENDIK_MATERI[subject]) {
      const elemenList = PUSMENDIK_MATERI[subject].elemen;
      let found = false;

      for (const el of elemenList) {
        const idx = el.bab.findIndex((b) => String(b.id) === String(itemId));
        if (idx !== -1) {
          found = true;
          if (action === 'delete') {
            el.bab.splice(idx, 1);
          } else if (payload) {
            el.bab[idx] = {
              ...el.bab[idx],
              ...payload,
              id: String(itemId),
            };
          }
          break;
        }
      }

      // Jika belum ditemukan dan aksinya upsert -> materi baru tambahan dari Admin
      if (!found && action !== 'delete' && payload) {
        const targetElemen = elemenList[elemenList.length - 1];
        if (targetElemen) {
          targetElemen.bab.push({
            ...payload,
            id: String(itemId),
          });
        }
      }
    } else if (contentType === 'latihan' && PUSMENDIK_LATIHAN[subject]) {
      const levelsList = PUSMENDIK_LATIHAN[subject].levels;
      const idx = levelsList.findIndex(
        (lvl) =>
          String(lvl.level) === String(itemId) ||
          String(lvl.id) === String(itemId)
      );

      if (idx !== -1) {
        if (action === 'delete') {
          levelsList.splice(idx, 1);
        } else if (payload) {
          const levelNum = Number(payload.level || levelsList[idx].level);
          levelsList[idx] = {
            ...levelsList[idx],
            ...payload,
            level: levelNum,
            targetSoal: Array.isArray(payload.soal)
              ? payload.soal.length
              : payload.targetSoal || levelsList[idx].targetSoal,
          };
        }
      } else if (action !== 'delete' && payload) {
        const levelNum = Number(payload.level || itemId) || levelsList.length + 1;
        levelsList.push({
          ...payload,
          level: levelNum,
          namaLevel: payload.namaLevel || `Level ${levelNum}`,
          targetSoal: Array.isArray(payload.soal)
            ? payload.soal.length
            : Number(payload.targetSoal) || 5,
          soal: Array.isArray(payload.soal) ? payload.soal : [],
        });
      }
    }
  });

  // 3. Rapikan penomoran urut Materi (no: 1..N) dan pengurutan Level Latihan
  ['matematika', 'bahasa_indonesia'].forEach((subj) => {
    if (PUSMENDIK_MATERI[subj]?.elemen) {
      let counter = 1;
      PUSMENDIK_MATERI[subj].elemen.forEach((el) => {
        el.bab.forEach((b) => {
          b.no = counter++;
        });
      });
    }
    if (PUSMENDIK_LATIHAN[subj]?.levels) {
      PUSMENDIK_LATIHAN[subj].levels.sort((a, b) => Number(a.level) - Number(b.level));
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tka_content_updated'));
  }
};

// Terapkan cache saat file pertama kali di-import
applyCustomContentsToData(getCachedCustomContents());

/**
 * Sinkronisasi data kustomisasi Materi & Latihan Soal dari server (Cloudflare D1)
 */
export const syncCustomContentFromServer = async () => {
  try {
    const response = await api.get('/content');
    if (response.data?.success && Array.isArray(response.data.data)) {
      setCachedCustomContents(response.data.data);
      applyCustomContentsToData(response.data.data);
      return response.data.data;
    }
  } catch (err) {
    // Tetap gunakan cache localStorage jika sedang offline
    console.warn('Menggunakan cache lokal untuk konten Materi & Latihan:', err.message);
  }
  return getCachedCustomContents();
};

/**
 * Simpan perubahan / penambahan / penghapusan Materi atau Latihan Soal (Khusus Admin)
 */
export const saveAdminContentItem = async ({
  contentType,
  subject,
  itemId,
  action = 'upsert',
  payload,
}) => {
  const id = `${contentType}:${subject}:${itemId}`;
  const currentList = getCachedCustomContents();
  const nextItem = {
    id,
    contentType,
    subject,
    itemId: String(itemId),
    action,
    payload,
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = currentList.findIndex((i) => i.id === id);
  const updatedList =
    existingIdx !== -1
      ? currentList.map((item, idx) => (idx === existingIdx ? nextItem : item))
      : [...currentList, nextItem];

  // Update tampilan & cache lokal secara instan
  setCachedCustomContents(updatedList);
  applyCustomContentsToData(updatedList);

  // Simpan ke database Cloudflare D1 lewat API backend
  const response = await api.put('/admin/content', {
    contentType,
    subject,
    itemId: String(itemId),
    action,
    payload,
  });

  return response.data;
};

/**
 * Reset suatu Materi atau Latihan Soal ke data default bawaan aplikasi
 */
export const resetAdminContentItem = async ({ contentType, subject, itemId }) => {
  const id = `${contentType}:${subject}:${itemId}`;
  const updatedList = getCachedCustomContents().filter((i) => i.id !== id);

  setCachedCustomContents(updatedList);
  applyCustomContentsToData(updatedList);

  const response = await api.delete(
    `/admin/content/${encodeURIComponent(contentType)}/${encodeURIComponent(subject)}/${encodeURIComponent(itemId)}`
  );
  return response.data;
};

/**
 * Memeriksa apakah suatu item adalah item bawaan (default) atau tambahan baru
 */
export const isDefaultContentItem = (contentType, subject, itemId) => {
  if (contentType === 'materi') {
    const babs = BASE_MATERI[subject]?.elemen?.flatMap((e) => e.bab) || [];
    return babs.some((b) => String(b.id) === String(itemId));
  }
  if (contentType === 'latihan') {
    const levels = BASE_LATIHAN[subject]?.levels || [];
    return levels.some((l) => String(l.level) === String(itemId));
  }
  return false;
};

/**
 * Memeriksa apakah suatu item memiliki modifikasi kustom dari Admin
 */
export const hasCustomOverride = (contentType, subject, itemId) => {
  const id = `${contentType}:${subject}:${itemId}`;
  return getCachedCustomContents().some((i) => i.id === id);
};
